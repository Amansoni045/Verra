import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDocumentStore } from "./documentStore";
import { settingsApi, documentsApi } from "@/services/api";

interface UserProfile {
  id: number;
  email: string;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password, rememberMe = false) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, remember_me: rememberMe })
          });
          
          const data = await res.json();
          if (!res.ok || !data.success) {
            return { success: false, message: data.message || "Failed to log in." };
          }

          const { access_token, user } = data.data;
          
          set({
            token: access_token,
            user,
            isAuthenticated: true
          });

          // Sync any local guest drafts to the database immediately after successful login
          try {
            const guestDocs = useDocumentStore.getState().documents;
            if (guestDocs.length > 0) {
              const syncItems = guestDocs.map(doc => ({
                id: doc.id,
                title: doc.title,
                content: doc.content,
                preview: doc.preview,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt
              }));
              
              await fetch(`${API_BASE_URL}/api/documents/sync`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${access_token}`
                },
                body: JSON.stringify({ documents: syncItems })
              });
            }
          } catch (syncError) {
            console.error("Auth Store Warning: guest documents sync failed:", syncError);
          }

          // Trigger documents and settings reload in the document store
          await useDocumentStore.getState().loadCloudDocuments();

          return { success: true, message: "Logged in successfully." };
        } catch (error) {
          return { success: false, message: "Unable to connect to the login server. Please try again." };
        }
      },

      register: async (email, password) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          
          const data = await res.json();
          if (!res.ok || !data.success) {
            return { success: false, message: data.message || "Registration failed." };
          }

          return { success: true, message: "Account created successfully. You can now log in." };
        } catch (error) {
          return { success: false, message: "Unable to connect to the registration server." };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        
        // Reset document store to empty guest state
        useDocumentStore.getState().clearAll();
      }
    }),
    {
      name: "verra-auth-store",
      // Exclude non-serializable properties if any
    }
  )
);
