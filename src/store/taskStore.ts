import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskPriority } from '../types/task';

interface TaskState {
    tasks: Task[];
    addTask: (title: string, priority: TaskPriority, category: string) => void;
    toggleTaskCompletion: (id: number) => void;
    updateTaskTitle: (id: number, newTitle: string) => void;
    updateTaskDueDate: (id: number, dueDate: string | undefined) => void;
    deleteTask: (id: number) => void;
    getCategories: () => string[];
}

// Removed INITIAL_TASKS for production

export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: [],

            addTask: (title, priority, category) => {
                const newTask: Task = {
                    id: Date.now(),
                    title,
                    priority,
                    category: category || 'Geral',
                    completed: false,
                    createdAt: new Date().toISOString(),
                };

                // Haptic Feedback
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(10);
                }

                set((state) => ({
                    tasks: [newTask, ...state.tasks], // Adds to the top
                }));
            },

            toggleTaskCompletion: (id) => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(10);
                }

                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, completed: !task.completed } : task
                    ),
                }));
            },

            updateTaskTitle: (id, newTitle) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, title: newTitle } : task
                    ),
                }));
            },

            updateTaskDueDate: (id, dueDate) => {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, dueDate } : task
                    ),
                }));
            },

            deleteTask: (id) => {
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(10);
                }

                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id),
                }));
            },

            getCategories: () => {
                const tasks = get().tasks;
                const categories = tasks.map(t => t.category);
                return Array.from(new Set(categories));
            }
        }),
        {
            name: 'weedoo_tasks', // Key for localStorage
        }
    )
);
