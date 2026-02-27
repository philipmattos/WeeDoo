export type TaskPriority = 'baixa' | 'media' | 'alta';

export interface Task {
    id: number;
    title: string;
    priority: TaskPriority;
    category: string;
    completed: boolean;
    createdAt: string;
    dueDate?: string; // ISO string date (optionally with time)
}
