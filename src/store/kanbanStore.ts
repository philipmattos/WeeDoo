import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id, KanbanColumn, KanbanTask } from '../types/kanban';

interface KanbanState {
    columns: KanbanColumn[];
    tasks: KanbanTask[];

    addColumn: (title: string) => void;
    updateColumn: (id: Id, title: string) => void;
    deleteColumn: (id: Id) => void;

    addTask: (columnId: Id, content: string) => void;
    updateTask: (id: Id, updates: Partial<KanbanTask>) => void;
    deleteTask: (id: Id) => void;

    setColumns: (columns: KanbanColumn[]) => void;
    setTasks: (tasks: KanbanTask[]) => void;
}

const defaultCols: KanbanColumn[] = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'doing', title: 'Fazendo' },
    { id: 'done', title: 'Concluído' },
];

export const useKanbanStore = create<KanbanState>()(
    persist(
        (set) => ({
            columns: defaultCols,
            tasks: [],

            addColumn: (title) => {
                const newCol: KanbanColumn = { id: crypto.randomUUID(), title };
                set((state) => ({ columns: [...state.columns, newCol] }));
            },

            updateColumn: (id, title) => {
                set((state) => ({
                    columns: state.columns.map(col => (col.id === id ? { ...col, title } : col)),
                }));
            },

            deleteColumn: (id) => {
                set((state) => ({
                    columns: state.columns.filter(col => col.id !== id),
                    tasks: state.tasks.filter(task => task.columnId !== id),
                }));
            },

            addTask: (columnId, content) => {
                const newTask: KanbanTask = {
                    id: crypto.randomUUID(),
                    columnId,
                    content,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ tasks: [...state.tasks, newTask] }));
            },

            updateTask: (id, updates) => {
                set((state) => ({
                    tasks: state.tasks.map(task => (task.id === id ? { ...task, ...updates } : task)),
                }));
            },

            deleteTask: (id) => {
                set((state) => ({
                    tasks: state.tasks.filter(task => task.id !== id),
                }));
            },

            setColumns: (columns) => set({ columns }),
            setTasks: (tasks) => set({ tasks }),
        }),
        {
            name: 'weedoo_kanban',
        }
    )
);
