import { create } from "zustand";
import { persist } from "zustand/middleware";
import { documentsApi } from "@/services/api";
import { useAuthStore } from "./authStore";

export interface DocumentEntry {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  preview: string; // Plaintext excerpt
  updatedAt: string;
  createdAt: string;
  is_favorite: boolean;
  is_pinned: boolean;
}

interface DocumentState {
  documents: DocumentEntry[];
  activeDocumentId: string | null;
  syncStatus: "saved" | "saving" | "error" | "offline";
  offlineQueue: { id: string; content: string; preview: string }[];
  
  // Actions
  createDocument: (title: string, content: string) => Promise<string>;
  updateDocument: (id: string, updates: { content?: string; title?: string; is_favorite?: boolean; is_pinned?: boolean }) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  setActiveDocumentId: (id: string | null) => void;
  loadCloudDocuments: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  clearAll: () => void;
}

// Active timeouts dictionary to handle keystroke debouncing per document
const activeTimers: Record<string, NodeJS.Timeout> = {};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => {
      // Helper to strip HTML tags for plain text summaries
      const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      };

      const getClientIp = () => {
        return "local";
      };

      return {
        documents: [],
        activeDocumentId: null,
        syncStatus: "saved",
        offlineQueue: [],

        loadCloudDocuments: async () => {
          const token = useAuthStore.getState().token;
          if (!token) return;
          
          set({ syncStatus: "saving" });
          try {
            const docs = await documentsApi.list();
            // Format DB camel_case keys to frontend camelCase keys
            const formattedDocs: DocumentEntry[] = docs.map((d: any) => ({
              id: d.id,
              title: d.title,
              content: d.content,
              preview: d.preview,
              is_favorite: d.is_favorite,
              is_pinned: d.is_pinned,
              createdAt: d.created_at,
              updatedAt: d.updated_at
            }));

            set({ 
              documents: formattedDocs, 
              syncStatus: "saved" 
            });
            
            // Set first document active if none chosen
            if (formattedDocs.length > 0 && !get().activeDocumentId) {
              set({ activeDocumentId: formattedDocs[0].id });
            }
          } catch (e) {
            set({ syncStatus: "error" });
          }
        },

        createDocument: async (title, content) => {
          const id = Math.random().toString(36).substring(2, 11) + "-" + Date.now();
          const now = new Date().toISOString();
          const preview = stripHtml(content).slice(0, 100);
          
          const newDoc: DocumentEntry = {
            id,
            title: title.trim() || "Untitled Draft",
            content,
            preview,
            is_favorite: false,
            is_pinned: false,
            createdAt: now,
            updatedAt: now,
          };

          // Optimistically update frontend state
          set((state) => ({
            documents: [newDoc, ...state.documents],
            activeDocumentId: id,
          }));

          const token = useAuthStore.getState().token;
          if (token) {
            set({ syncStatus: "saving" });
            try {
              const res = await documentsApi.create({
                id,
                title: newDoc.title,
                content: newDoc.content,
                preview: newDoc.preview
              });
              if (res) {
                set((state) => ({
                  syncStatus: "saved",
                  documents: state.documents.map(d => d.id === id ? { ...d, title: res.title, updatedAt: res.updated_at } : d)
                }));
              }
            } catch (e) {
              set({ syncStatus: "error" });
            }
          }
          return id;
        },

        updateDocument: async (id, updates) => {
          const now = new Date().toISOString();
          
          // Optimistic local state update
          set((state) => {
            const updatedDocs = state.documents.map((doc) => {
              if (doc.id === id) {
                const updatedContent = updates.content !== undefined ? updates.content : doc.content;
                const updatedPreview = updates.content !== undefined ? stripHtml(updates.content).slice(0, 100) : doc.preview;
                
                // Locally update title if modified manually
                let updatedTitle = updates.title !== undefined ? updates.title : doc.title;

                return {
                  ...doc,
                  title: updatedTitle,
                  content: updatedContent,
                  preview: updatedPreview,
                  is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : doc.is_favorite,
                  is_pinned: updates.is_pinned !== undefined ? updates.is_pinned : doc.is_pinned,
                  updatedAt: now,
                };
              }
              return doc;
            });

            // Sort by pinned or updatedAt
            const activeDoc = updatedDocs.find(d => d.id === id);
            if (activeDoc) {
              const filtered = updatedDocs.filter(d => d.id !== id);
              return { documents: [activeDoc, ...filtered] };
            }
            return { documents: updatedDocs };
          });

          // Cloud Sync logic
          const token = useAuthStore.getState().token;
          if (token) {
            set({ syncStatus: "saving" });
            
            // Keystroke Debouncer
            if (activeTimers[id]) {
              clearTimeout(activeTimers[id]);
            }

            activeTimers[id] = setTimeout(async () => {
              const targetDoc = get().documents.find(d => d.id === id);
              if (!targetDoc) return;

              try {
                const res = await documentsApi.update(id, {
                  title: targetDoc.title,
                  content: targetDoc.content,
                  preview: targetDoc.preview,
                  is_favorite: targetDoc.is_favorite,
                  is_pinned: targetDoc.is_pinned
                });
                
                if (res) {
                  // Merge backend title updates (for automatic title generation outcomes)
                  set((state) => ({
                    syncStatus: "saved",
                    documents: state.documents.map(d => d.id === id ? { ...d, title: res.title, updatedAt: res.updated_at } : d)
                  }));
                }
              } catch (err) {
                // Network failure: queue for background retry
                set((state) => ({
                  syncStatus: "offline",
                  offlineQueue: [
                    ...state.offlineQueue.filter(q => q.id !== id),
                    { id, content: targetDoc.content, preview: targetDoc.preview }
                  ]
                }));
              }
            }, 500);
          }
        },

        deleteDocument: async (id) => {
          set((state) => {
            const nextActiveId = state.activeDocumentId === id ? null : state.activeDocumentId;
            return {
              documents: state.documents.filter((doc) => doc.id !== id),
              activeDocumentId: nextActiveId,
            };
          });

          const token = useAuthStore.getState().token;
          if (token) {
            try {
              await documentsApi.delete(id);
            } catch (e) {
              console.error("Autosave Error: failed to delete cloud document:", e);
            }
          }
        },

        processOfflineQueue: async () => {
          const { offlineQueue } = get();
          if (offlineQueue.length === 0) return;

          const token = useAuthStore.getState().token;
          if (!token) return;

          set({ syncStatus: "saving" });
          const remainingQueue = [...offlineQueue];
          
          for (const task of offlineQueue) {
            try {
              await documentsApi.update(task.id, {
                content: task.content,
                preview: task.preview
              });
              remainingQueue.shift();
            } catch (err) {
              set({ syncStatus: "offline" });
              break;
            }
          }

          set({ 
            offlineQueue: remainingQueue, 
            syncStatus: remainingQueue.length === 0 ? "saved" : "offline" 
          });
        },

        setActiveDocumentId: (id) => set({ activeDocumentId: id }),

        clearAll: () => set({ documents: [], activeDocumentId: null, syncStatus: "saved", offlineQueue: [] }),
      };
    },
    {
      name: "verra-documents-store",
    }
  )
);
