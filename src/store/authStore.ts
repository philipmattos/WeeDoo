import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    saveCode: string | null;
    isLoggedIn: boolean;
    generateSaveCode: () => string;
    loginWithCode: (code: string) => void;
    logout: () => void;
}

const generateId = () => {
    // Gera uma ID robusta e amigável apenas com letras legíveis e números (sem 0, O, I, l)
    // Exemplo de saída: wd-A8K3PX9V
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
    let result = 'wd-';
    const randomArray = new Uint8Array(10);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < 10; i++) {
        result += chars[randomArray[i] % chars.length];
    }
    return result;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            saveCode: null,
            isLoggedIn: false,

            generateSaveCode: () => {
                return generateId();
            },

            loginWithCode: (code: string) => {
                const cleanCode = code.trim();
                if (!cleanCode) return;
                set({ saveCode: cleanCode, isLoggedIn: true });
            },

            logout: () => {
                set({ saveCode: null, isLoggedIn: false });
            },
        }),
        {
            name: 'weedoo-auth-storage',
        }
    )
);
