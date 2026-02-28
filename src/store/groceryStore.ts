import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GroceryItem } from '../types/grocery';

export interface GroceryList {
    id: string; // ID local único
    airtableId?: string; // ID do registro no Airtable 
    title: string;
    items: GroceryItem[];
    updatedAt: string;
}

interface GroceryState {
    lists: GroceryList[];

    // Lista Management
    createList: (title: string, airtableId?: string, items?: GroceryItem[]) => GroceryList;
    updateListMeta: (id: string, updates: Partial<Pick<GroceryList, 'title' | 'airtableId'>>) => void;
    deleteList: (id: string) => void;

    // Items Management (operam na lista cujo ID for passado)
    addItem: (listId: string, text: string) => void;
    toggleItem: (listId: string, itemId: string) => void;
    removeItem: (listId: string, itemId: string) => void;
    clearChecked: (listId: string) => void;

    // Bulk overwrite (para usar durante o sync com airtable)
    setListItems: (listId: string, items: GroceryItem[]) => void;
}

export const useGroceryStore = create<GroceryState>()(
    persist(
        (set) => ({
            lists: [],

            createList: (title, airtableId, items = []) => {
                const newList: GroceryList = {
                    id: crypto.randomUUID(),
                    airtableId,
                    title,
                    items,
                    updatedAt: new Date().toISOString()
                };
                set((state) => ({ lists: [newList, ...state.lists] }));
                return newList;
            },

            updateListMeta: (id, updates) => {
                set((state) => ({
                    lists: state.lists.map(list =>
                        list.id === id
                            ? { ...list, ...updates, updatedAt: new Date().toISOString() }
                            : list
                    )
                }));
            },

            deleteList: (id) => {
                set((state) => ({
                    lists: state.lists.filter(list => list.id !== id)
                }));
            },

            addItem: (listId, text) => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

                const newItem: GroceryItem = {
                    id: crypto.randomUUID(),
                    text,
                    checked: false,
                };

                set((state) => ({
                    lists: state.lists.map(list =>
                        list.id === listId
                            ? { ...list, items: [newItem, ...list.items], updatedAt: new Date().toISOString() }
                            : list
                    )
                }));
            },

            toggleItem: (listId, itemId) => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

                set((state) => ({
                    lists: state.lists.map(list => {
                        if (list.id !== listId) return list;
                        return {
                            ...list,
                            items: list.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
                            updatedAt: new Date().toISOString()
                        };
                    })
                }));
            },

            removeItem: (listId, itemId) => {
                set((state) => ({
                    lists: state.lists.map(list =>
                        list.id === listId
                            ? { ...list, items: list.items.filter(item => item.id !== itemId), updatedAt: new Date().toISOString() }
                            : list
                    )
                }));
            },

            clearChecked: (listId) => {
                set((state) => ({
                    lists: state.lists.map(list =>
                        list.id === listId
                            ? { ...list, items: list.items.filter(item => !item.checked), updatedAt: new Date().toISOString() }
                            : list
                    )
                }));
            },

            setListItems: (listId, items) => {
                set((state) => ({
                    lists: state.lists.map(list =>
                        list.id === listId
                            ? { ...list, items, updatedAt: new Date().toISOString() }
                            : list
                    )
                }));
            }
        }),
        {
            name: 'weedoo_groceries_v2', // _v2 porque estruturamos de flat array para { lists: [] }
        }
    )
);
