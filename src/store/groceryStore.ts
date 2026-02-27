import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GroceryItem } from '../types/grocery';

interface GroceryState {
    items: GroceryItem[];
    addItem: (text: string) => void;
    toggleItem: (id: string) => void;
    removeItem: (id: string) => void;
    clearChecked: () => void;
}

export const useGroceryStore = create<GroceryState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (text) => {
                const newItem: GroceryItem = {
                    id: Date.now().toString(),
                    text,
                    checked: false,
                };

                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(10);
                }

                set((state) => ({
                    items: [newItem, ...state.items],
                }));
            },

            toggleItem: (id) => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(10);
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, checked: !item.checked } : item
                    ),
                }));
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }));
            },

            clearChecked: () => {
                set((state) => ({
                    items: state.items.filter((item) => !item.checked),
                }));
            },
        }),
        {
            name: 'weedoo_groceries',
        }
    )
);
