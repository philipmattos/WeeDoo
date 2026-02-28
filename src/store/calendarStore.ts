import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent } from '../types/calendar';

interface CalendarState {
    events: CalendarEvent[];
    addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
    updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
    deleteEvent: (id: string) => void;
    getEventsForDate: (date: string) => CalendarEvent[];
    getDatesWithEvents: () => Set<string>;
}

export const useCalendarStore = create<CalendarState>()(
    persist(
        (set, get) => ({
            events: [],

            addEvent: (event) => {
                const newEvent: CalendarEvent = {
                    ...event,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ events: [newEvent, ...state.events] }));
            },

            updateEvent: (id, updates) => {
                set((state) => ({
                    events: state.events.map(e =>
                        e.id === id ? { ...e, ...updates } : e
                    ),
                }));
            },

            deleteEvent: (id) => {
                set((state) => ({
                    events: state.events.filter(e => e.id !== id),
                }));
            },

            getEventsForDate: (date) => {
                return get().events.filter(e => e.date === date);
            },

            getDatesWithEvents: () => {
                return new Set(get().events.map(e => e.date));
            },
        }),
        { name: 'weedoo_calendar_v1' }
    )
);
