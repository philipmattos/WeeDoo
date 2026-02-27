import { create } from 'zustand';

type ModalType = 'notes' | 'tasks' | 'kanban' | 'calendar' | 'groceries' | null;

interface ModalStore {
    activeModal: ModalType;
    openModal: (modal: ModalType) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
    activeModal: null,
    openModal: (modal) => set({ activeModal: modal }),
    closeModal: () => set({ activeModal: null }),
}));
