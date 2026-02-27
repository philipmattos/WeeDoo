import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDark: false,
            toggle: () => {
                const next = !get().isDark;
                set({ isDark: next });
                // Apply to <html> immediately
                if (next) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        }),
        {
            name: 'weedoo_theme',
            onRehydrateStorage: () => (state) => {
                // Re-apply class on page load from persisted state
                if (state?.isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        }
    )
);
