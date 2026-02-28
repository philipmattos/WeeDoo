export interface CalendarEvent {
    id: string;
    title: string;
    date: string;       // 'YYYY-MM-DD'
    time?: string;      // 'HH:MM' (optional)
    description?: string;
    color: string;      // Tailwind bg color class
    createdAt: string;
}
