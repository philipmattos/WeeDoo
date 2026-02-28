import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { useNotesStore } from '../../store/notesStore';
import { useKanbanStore } from '../../store/kanbanStore';
import { useCalendarStore } from '../../store/calendarStore';
import { useThemeStore } from '../../store/themeStore';
import { syncUserDataToAirtable, fetchUserDataRecord } from '../../services/airtable';

// Um hook invisível que gerencia o fluxo de Upload/Download Airtable
export const CloudSync = () => {
    const { isLoggedIn, saveCode } = useAuthStore();

    useEffect(() => {
        // Se o aplicativo acabou de abrir travado ou não tem login, desliga a escuta.
        if (!isLoggedIn || !saveCode) return;

        // --- DEBOUNCERS PARA AUTOSAVE ---------------------------------------
        // Evitam que cada tecla digitada gere uma requisição HTTP. Esperam 3 segundos finais.
        let timeoutTasks: ReturnType<typeof setTimeout>;
        let timeoutNotes: ReturnType<typeof setTimeout>;
        let timeoutKanban: ReturnType<typeof setTimeout>;
        let timeoutCalendar: ReturnType<typeof setTimeout>;
        let timeoutConfig: ReturnType<typeof setTimeout>;

        // --- SUBSCRIPTIONS --------------------------------------------------

        // 1. Ouvindo o TaskStore
        const unsubTasks = useTaskStore.subscribe((state) => {
            clearTimeout(timeoutTasks);
            timeoutTasks = setTimeout(() => {
                const snapshot = { tasks: state.tasks };
                syncUserDataToAirtable('UsersData_Tasks', saveCode, JSON.stringify(snapshot));
            }, 3000);
        });

        // 2. Ouvindo o NotesStore
        const unsubNotes = useNotesStore.subscribe((state) => {
            clearTimeout(timeoutNotes);
            timeoutNotes = setTimeout(() => {
                const snapshot = { notes: state.notes };
                syncUserDataToAirtable('UsersData_Notes', saveCode, JSON.stringify(snapshot));
            }, 3000);
        });

        // 3. Ouvindo o KanbanStore
        const unsubKanban = useKanbanStore.subscribe((state) => {
            clearTimeout(timeoutKanban);
            timeoutKanban = setTimeout(() => {
                const snapshot = { columns: state.columns, tasks: state.tasks };
                syncUserDataToAirtable('UsersData_Kanban', saveCode, JSON.stringify(snapshot));
            }, 3000);
        });

        // 4. Ouvindo o CalendarStore
        const unsubCalendar = useCalendarStore.subscribe((state) => {
            clearTimeout(timeoutCalendar);
            timeoutCalendar = setTimeout(() => {
                const snapshot = { events: state.events };
                syncUserDataToAirtable('UsersData_Calendar', saveCode, JSON.stringify(snapshot));
            }, 3000);
        });

        // 5. Tema/Configurações
        const unsubTheme = useThemeStore.subscribe((state) => {
            clearTimeout(timeoutConfig);
            timeoutConfig = setTimeout(() => {
                const snapshot = { isDark: state.isDark };
                syncUserDataToAirtable('UsersData_Config', saveCode, JSON.stringify(snapshot));
            }, 3000);
        });

        // Cleanup
        return () => {
            unsubTasks();
            unsubNotes();
            unsubKanban();
            unsubCalendar();
            unsubTheme();
            clearTimeout(timeoutTasks);
            clearTimeout(timeoutNotes);
            clearTimeout(timeoutKanban);
            clearTimeout(timeoutCalendar);
            clearTimeout(timeoutConfig);
        };
    }, [isLoggedIn, saveCode]);

    return null; // Silent worker
};
