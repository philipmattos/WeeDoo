export type Id = string | number;

export type KanbanColumn = {
    id: Id;
    title: string;
};

export type KanbanTask = {
    id: Id;
    columnId: Id;
    content: string;
    description?: string;
    createdAt: string;
    color?: string;
};
