export type Id = string | number;

export interface Note {
    id: Id;
    title: string;
    content: string; // HTML or Markdown content
    createdAt: string;
    updatedAt: string;
}
