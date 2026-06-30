import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DocumentEntry {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  preview: string; // Plaintext excerpt for the sidebar
  updatedAt: string;
  createdAt: string;
}

interface DocumentState {
  documents: DocumentEntry[];
  activeDocumentId: string | null;
  createDocument: (title: string, content: string) => string;
  updateDocument: (id: string, content: string) => void;
  deleteDocument: (id: string) => void;
  setActiveDocumentId: (id: string | null) => void;
  clearAll: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      activeDocumentId: null,

      createDocument: (title, content) => {
        const id = Math.random().toString(36).substring(2, 11);
        const now = new Date().toISOString();
        
        const stripHtml = (html: string) => {
          return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        };
        const preview = stripHtml(content).slice(0, 100);

        const newDoc: DocumentEntry = {
          id,
          title: title.trim() || "Untitled Draft",
          content,
          preview,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          documents: [newDoc, ...state.documents],
          activeDocumentId: id,
        }));

        return id;
      },

      updateDocument: (id, content) => {
        const now = new Date().toISOString();
        
        const stripHtml = (html: string) => {
          return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        };
        const preview = stripHtml(content).slice(0, 100);

        set((state) => {
          const updatedDocs = state.documents.map((doc) => {
            if (doc.id === id) {
              let title = doc.title;
              if (title === "Untitled Draft" || !title.trim() || title.endsWith("...")) {
                const plaintext = stripHtml(content).trim();
                if (plaintext) {
                  const words = plaintext.split(/\s+/);
                  title = words.slice(0, 4).join(" ");
                  if (words.length > 4) title += "...";
                }
              }

              return {
                ...doc,
                content,
                preview,
                title: title || "Untitled Draft",
                updatedAt: now,
              };
            }
            return doc;
          });

          const targetDoc = updatedDocs.find((doc) => doc.id === id);
          if (targetDoc) {
            const filtered = updatedDocs.filter((doc) => doc.id !== id);
            return { documents: [targetDoc, ...filtered] };
          }

          return { documents: updatedDocs };
        });
      },

      deleteDocument: (id) =>
        set((state) => {
          const nextActiveId = state.activeDocumentId === id ? null : state.activeDocumentId;
          return {
            documents: state.documents.filter((doc) => doc.id !== id),
            activeDocumentId: nextActiveId,
          };
        }),

      setActiveDocumentId: (id) => set({ activeDocumentId: id }),

      clearAll: () => set({ documents: [], activeDocumentId: null }),
    }),
    {
      name: "verra-documents-store",
    }
  )
);
