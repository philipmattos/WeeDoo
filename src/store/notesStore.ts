import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id, Note } from '../types/notes';

interface NotesState {
    notes: Note[];
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
    updateNote: (id: Id, updates: Partial<Note>) => void;
    deleteNote: (id: Id) => void;
}

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            notes: [],

            addNote: (note) => {
                const newNote: Note = {
                    ...note,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({ notes: [newNote, ...state.notes] }));
                return newNote;
            },

            updateNote: (id, updates) => {
                set((state) => ({
                    notes: state.notes.map((note) =>
                        note.id === id
                            ? { ...note, ...updates, updatedAt: new Date().toISOString() }
                            : note
                    ),
                }));
            },

            deleteNote: (id) => {
                set((state) => ({
                    notes: state.notes.filter((note) => note.id !== id),
                }));
            },
        }),
        {
            name: 'weedoo_notes',
        }
    )
);
