import React from 'react';
import { useModalStore } from '../store/modalStore';

interface BaseModalProps {
    id: 'notes' | 'tasks' | 'kanban' | 'calendar' | 'groceries';
    title: string;
    children: React.ReactNode;
}

export const BaseModal = ({ id, title, children }: BaseModalProps) => {
    const { activeModal } = useModalStore();

    if (activeModal !== id) return null;

    return (
        <div className="fixed inset-0 top-[56px] bottom-[72px] z-20 flex flex-col bg-slate-50 dark:bg-slate-900 sm:max-w-md sm:mx-auto sm:border-x sm:shadow-xl">
            {/* Tab Header */}
            <div className="px-4 pt-5 pb-3 bg-slate-50 dark:bg-slate-900 shrink-0">
                <h2 className="font-bold text-2xl text-slate-800 dark:text-slate-100">{title}</h2>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 relative">
                {children}
            </div>
        </div>
    );
};
