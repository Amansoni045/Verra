import unittest
import os
import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup module path resolution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core import security
from app.db import crud, models
from app.ml import predictor
from app.services import prediction_service

class TestAuthentication(unittest.TestCase):
    """Tests password hashing and secure token generation workflows."""
    
    def test_password_hashing(self):
        password = "super-secret-password-123"
        hashed, salt = security.hash_password(password)
        
        self.assertNotEqual(password, hashed)
        self.assertTrue(security.verify_password(password, hashed, salt))
        self.assertFalse(security.verify_password("wrong-password", hashed, salt))

    def test_jwt_generation(self):
        user_id = 99
        access_token = security.create_access_token(user_id)
        payload = security.decode_token(access_token)
        
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), str(user_id))
        self.assertEqual(payload.get("type"), "access")

class TestRateLimiter(unittest.TestCase):
    """Tests that the in-memory rate limiter correctly blocks request floods."""
    
    def test_rate_limiting_trigger(self):
        limiter = security.InMemoryRateLimiter(limit=3, window_seconds=2)
        client_key = "test-ip-address"
        
        # First 3 requests should pass
        limiter.check_rate_limit(client_key)
        limiter.check_rate_limit(client_key)
        limiter.check_rate_limit(client_key)
        
        # 4th request must raise an HTTPException (429)
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as context:
            limiter.check_rate_limit(client_key)
        
        self.assertEqual(context.exception.status_code, 429)

class TestMLPreprocessors(unittest.TestCase):
    """Tests sequence padding and auto-title generator heuristics."""

    def test_sequence_pre_padding(self):
        sequence = [14, 289, 11]
        maxlen = 6
        padded = predictor.pad_sequence_pre(sequence, maxlen)
        
        # Padded result should have shape (1, maxlen)
        self.assertEqual(padded.shape, (1, 6))
        # Padded elements should be left-padded with zero
        self.assertEqual(list(padded[0]), [0, 0, 0, 14, 289, 11])

    def test_intelligent_title_extractor(self):
        # 1. Short text: under 5 words threshold (must return None)
        self.assertIsNone(crud.extract_auto_title("<p>The path is clear.</p>"))
        
        # 2. Long text with greetings and fillers
        html = "<p>Hello! My name is Aman and the path to the stars is written in code.</p>"
        title = crud.extract_auto_title(html)
        
        self.assertIsNotNone(title)
        # Should strip hello, my, name, is, the, to, etc.
        # Capitalize and take the first few meaningful words: "Aman Path Stars Written"
        self.assertTrue("Hello" not in title)
        self.assertTrue("Is" not in title)
        # Minimum words constraint (never fewer than 3 words)
        words = title.split()
        self.assertTrue(len(words) >= 3)

class TestDatabaseCRUD(unittest.TestCase):
    """Tests isolated database CRUD operations inside SQLite in-memory engine."""

    def setUp(self):
        # Establish an isolated SQLite in-memory database for testing
        self.engine = create_engine("sqlite:///:memory:")
        models.Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()
        models.Base.metadata.drop_all(self.engine)

    def test_create_and_authenticate_user(self):
        user_register = security.UserRegister(email="test@verra.ai", password="securepassword123")
        user = crud.create_user(self.db, user_register)
        
        self.assertEqual(user.email, "test@verra.ai")
        self.assertIsNotNone(user.id)
        
        # Test retrieving preferences configuration
        settings = crud.get_user_settings(self.db, user.id)
        self.assertEqual(settings.temperature, 0.8)

    def test_document_crud_and_soft_delete(self):
        # Create user
        user_register = security.UserRegister(email="author@verra.ai", password="securepassword123")
        user = crud.create_user(self.db, user_register)
        
        # Create document draft
        doc_in = crud.DocumentCreate(
            title="Trained LSTM Models",
            content="<p>Inside the recurrent layers of Verra's autocomplete engine.</p>",
            preview="Inside the recurrent layers..."
        )
        doc = crud.create_document(self.db, user.id, doc_in)
        self.assertEqual(doc.title, "Trained LSTM Models")
        
        # Retrieve documents
        active_docs = crud.get_user_documents(self.db, user.id)
        self.assertEqual(len(active_docs), 1)
        
        # Perform soft delete
        crud.delete_document(self.db, user.id, doc.id)
        
        # Verify document is hidden/excluded from active list
        active_docs_after = crud.get_user_documents(self.db, user.id)
        self.assertEqual(len(active_docs_after), 0)
        
        # Verify record remains in database table (soft delete validation)
        db_raw = self.db.query(models.Document).filter(models.Document.id == doc.id).first()
        self.assertIsNotNone(db_raw)
        self.assertIsNotNone(db_raw.deleted_at)

if __name__ == "__main__":
    unittest.main()
