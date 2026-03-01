import React, { useState, useMemo } from 'react';
import { BaseModal } from './BaseModal';
import { useCalendarStore } from '../store/calendarStore';
import { useTaskStore } from '../store/taskStore';
import { useModalStore } from '../store/modalStore';
import type { CalendarEvent } from '../types/calendar';
import { format, parseISO, isSameDay, startOfWeek, addDays, isSameMonth, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Plus, Trash2, Clock, ChevronLeft, ChevronRight,
    CalendarDays, CheckSquare, AlertCircle,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (date: Date): string => format(date, 'yyyy-MM-dd');

const COLOR_OPTIONS = [
    { label: 'Verde', value: 'bg-emerald-500' },
    { label: 'Azul', value: 'bg-blue-500' },
    { label: 'Roxo', value: 'bg-purple-500' },
    { label: 'Laranja', value: 'bg-orange-500' },
    { label: 'Vermelho', value: 'bg-red-500' },
    { label: 'Rosa', value: 'bg-pink-500' },
    { label: 'Ciano', value: 'bg-cyan-500' },
    { label: 'Âmbar', value: 'bg-amber-500' },
];

// ── Event badge (small dot) ───────────────────────────────────────────────────
const EventDot = ({ color }: { color: string }) => (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
);

// ── Single event row ──────────────────────────────────────────────────────────
interface EventRowProps {
    title: string;
    time?: string;
    color: string;
    isTask?: boolean;
    isOverdue?: boolean;
    onDelete?: () => void;
    onClick?: () => void;
}

const EventRow = ({ title, time, color, isTask, isOverdue, onDelete, onClick }: EventRowProps) => (
    <div
        onClick={onClick}
        className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all
            ${isTask
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-wd-primary/40 cursor-pointer'}
            ${isOverdue ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : ''}`}
    >
        <div className={`w-1 h-10 rounded-full shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm truncate ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
                {time && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={10} /> {time}
                    </span>
                )}
                {isTask && (
                    <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                        <CheckSquare size={10} /> Tarefa
                    </span>
                )}
                {isOverdue && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle size={10} /> Atrasada
                    </span>
                )}
            </div>
        </div>
        {onDelete && (
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 shrink-0"
            >
                <Trash2 size={16} />
            </button>
        )}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const CalendarModal = () => {
    const { events, addEvent, deleteEvent, updateEvent, getDatesWithEvents } = useCalendarStore();
    const { tasks } = useTaskStore();
    const openModal = useModalStore(s => s.openModal);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formTime, setFormTime] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formColor, setFormColor] = useState(COLOR_OPTIONS[0].value);

    // ── Derived data ──────────────────────────────────────────────────────────

    // All dates that have calendar events
    const eventDates = useMemo(() => getDatesWithEvents(), [events]);

    // Tasks with due dates — normalized to date string
    const taskDates = useMemo(() => {
        const map = new Map<string, typeof tasks>();
        tasks.filter(t => t.dueDate && !t.completed).forEach(t => {
            const dateStr = t.dueDate!.substring(0, 10); // 'YYYY-MM-DD'
            if (!map.has(dateStr)) map.set(dateStr, []);
            map.get(dateStr)!.push(t);
        });
        return map;
    }, [tasks]);

    // All dates that have ANY event (calendar or task)
    const allHighlightedDates = useMemo(() => {
        const dates: Date[] = [];
        eventDates.forEach(d => dates.push(parseISO(d)));
        taskDates.forEach((_, d) => {
            const date = parseISO(d);
            if (!dates.some(e => isSameDay(e, date))) dates.push(date);
        });
        return dates;
    }, [eventDates, taskDates]);

    // Events for selected day
    const selectedDateStr = toDateStr(selectedDate);
    const dayEvents = events.filter(e => e.date === selectedDateStr)
        .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const dayTasks = taskDates.get(selectedDateStr) ?? [];
    const today = toDateStr(new Date());

    // ── Handlers ──────────────────────────────────────────────────────────────

    const openAdd = () => {
        setFormTitle('');
        setFormTime('');
        setFormDesc('');
        setFormColor(COLOR_OPTIONS[0].value);
        setEditingEvent(null);
        setIsAddOpen(true);
    };

    const openEdit = (event: CalendarEvent) => {
        setFormTitle(event.title);
        setFormTime(event.time ?? '');
        setFormDesc(event.description ?? '');
        setFormColor(event.color);
        setEditingEvent(event);
        setIsAddOpen(true);
    };

    const handleSave = () => {
        if (!formTitle.trim()) return;
        if (editingEvent) {
            updateEvent(editingEvent.id, {
                title: formTitle.trim(),
                time: formTime || undefined,
                description: formDesc.trim() || undefined,
                color: formColor,
            });
        } else {
            addEvent({
                title: formTitle.trim(),
                date: selectedDateStr,
                time: formTime || undefined,
                description: formDesc.trim() || undefined,
                color: formColor,
            });
        }
        setIsAddOpen(false);
    };

    // ── Day decorators for DayPicker ──────────────────────────────────────────

    const modifiers = { hasEvent: allHighlightedDates };
    const modifiersClassNames = { hasEvent: 'rdp-has-event' };

    const formattedSelectedDate = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    const totalDayItems = dayEvents.length + dayTasks.length;

    // Build the 7 days of the selected week for the Week View
    const getWeekDays = (baseDate: Date) => {
        const start = startOfWeek(baseDate, { weekStartsOn: 0 }); // Sunday default
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        return days;
    };
    const weekDaysArray = getWeekDays(selectedDate);
    const hasEventInDay = (day: Date) => allHighlightedDates.some(hd => isSameDay(hd, day));

    return (
        <BaseModal id="calendar" title="Calendário">
            <div className="flex flex-col gap-4 pb-8">

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full self-center mb-1">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-6 py-1.5 rounded-full text-sm transition-all ${viewMode === 'month' ? 'font-bold bg-white dark:bg-slate-700 text-wd-primary shadow-sm' : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Mês
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-6 py-1.5 rounded-full text-sm transition-all ${viewMode === 'week' ? 'font-bold bg-white dark:bg-slate-700 text-wd-primary shadow-sm' : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Semana
                    </button>
                </div>

                {/* ── Calendar (Conditional) ──────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

                    {/* Dot indicators CSS */}
                    <style>{`
                        .rdp-has-event {
                            position: relative;
                        }
                        .rdp-has-event::after {
                            content: '';
                            position: absolute;
                            bottom: 3px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 5px;
                            height: 5px;
                            border-radius: 50%;
                            background-color: var(--wd-primary);
                        }
                    `}</style>

                    {viewMode === 'month' ? (
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            locale={ptBR}
                            modifiers={modifiers}
                            modifiersClassNames={modifiersClassNames}
                            className="w-full mx-auto sm:w-[350px] p-2 sm:p-4 [--cell-size:2.5rem]"
                            classNames={{
                                months: 'w-full',
                                month: 'w-full',
                                table: 'w-full',
                                weekdays: 'flex justify-between px-2',
                                weekday: 'flex-1 text-center text-xs text-slate-400 dark:text-slate-500 font-bold py-2',
                                week: 'flex justify-between px-2 mt-1',
                                day: 'flex-1 flex items-center justify-center aspect-square',
                                month_caption: 'flex h-10 w-full items-center justify-center px-10',
                                caption_label: 'text-base font-extrabold text-slate-800 dark:text-slate-100 capitalize',
                                nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between px-4 pt-3 sm:pt-5',
                                today: 'font-bold text-wd-primary',
                            }}
                        />
                    ) : (
                        <div className="flex flex-col w-full mx-auto sm:w-[350px] p-4 pt-4 pb-5">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <button
                                    onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">
                                    {format(weekDaysArray[0], "MMMM yyyy", { locale: ptBR })}
                                </span>
                                <button
                                    onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <div className="flex justify-between w-full">
                                {weekDaysArray.map((day, i) => {
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isToday = isSameDay(day, new Date());
                                    const hasEvent = hasEventInDay(day);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(day)}
                                            className={`flex flex-col items-center justify-center w-10 h-14 rounded-2xl transition-all relative
                                                ${isSelected ? 'bg-wd-primary text-white shadow-md scale-105' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-white/80' : isToday ? 'text-wd-primary' : 'text-slate-400'}`}>
                                                {format(day, 'EEEEEE', { locale: ptBR })}
                                            </span>
                                            <span className={`text-base font-extrabold ${isSelected ? 'text-white' : isToday ? 'text-wd-primary' : ''}`}>
                                                {format(day, 'd')}
                                            </span>
                                            {hasEvent && (
                                                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-wd-primary'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Day Header ────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 capitalize text-base">
                            {formattedSelectedDate}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {totalDayItems === 0
                                ? 'Sem compromissos'
                                : `${totalDayItems} compromisso${totalDayItems > 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <Button
                        onClick={openAdd}
                        size="sm"
                        className="h-9 rounded-full px-4 bg-wd-primary hover:bg-wd-primary-dark text-white font-semibold"
                    >
                        <Plus size={16} className="mr-1.5" /> Adicionar
                    </Button>
                </div>

                {/* ── Events list for selected day ───────────────────────── */}
                <div className="flex flex-col gap-2">

                    {/* Tasks with due dates — click redirects to Tasks tab */}
                    {dayTasks.map(task => {
                        const isOverdue = task.dueDate!.substring(0, 10) < today;
                        const timeStr = task.dueDate && task.dueDate.includes('T')
                            ? task.dueDate.substring(11, 16) : undefined;
                        return (
                            <EventRow
                                key={task.id}
                                title={task.title}
                                time={timeStr}
                                color="bg-blue-500"
                                isTask
                                isOverdue={isOverdue}
                                onClick={() => openModal('tasks')}
                            />
                        );
                    })}

                    {/* Calendar appointments */}
                    {dayEvents.map(event => (
                        <EventRow
                            key={event.id}
                            title={event.title}
                            time={event.time}
                            color={event.color}
                            onDelete={() => deleteEvent(event.id)}
                            onClick={() => openEdit(event)}
                        />
                    ))}

                    {totalDayItems === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                            <CalendarDays size={40} className="text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Nenhum compromisso para este dia
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Toque em "Adicionar" para criar um
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add / Edit Dialog ────────────────────────────────────── */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 w-[95vw] max-w-sm [&>button:last-child]:hidden">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-sm"
                            >
                                <ChevronLeft size={16} /> Voltar
                            </button>
                            <DialogTitle className="text-slate-800 dark:text-slate-100 text-base font-bold">
                                {editingEvent ? 'Editar compromisso' : 'Novo compromisso'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400 text-xs pt-1 text-right">
                            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-2">
                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Título *
                            </label>
                            <Input
                                autoFocus
                                placeholder="Nome do compromisso..."
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus-visible:ring-wd-primary"
                            />
                        </div>

                        {/* Time */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Horário (opcional)
                            </label>
                            <Input
                                type="time"
                                value={formTime}
                                onChange={(e) => setFormTime(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus-visible:ring-wd-primary"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Descrição (opcional)
                            </label>
                            <Textarea
                                placeholder="Detalhes do compromisso..."
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus-visible:ring-wd-primary resize-none min-h-[80px]"
                            />
                        </div>

                        {/* Color picker */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Cor
                            </label>
                            <div className="flex flex-nowrap gap-1.5">
                                {COLOR_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        title={opt.label}
                                        onClick={() => setFormColor(opt.value)}
                                        className={`w-7 h-7 rounded-lg ${opt.value} transition-transform shrink-0
                                            ${formColor === opt.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingEvent && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { deleteEvent(editingEvent.id); setIsAddOpen(false); }}
                                className="rounded-full flex-1 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 size={16} className="mr-1.5" /> Excluir
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={!formTitle.trim()}
                            className="rounded-full flex-1 bg-wd-primary hover:bg-wd-primary-dark text-white font-semibold"
                        >
                            {editingEvent ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </BaseModal>
    );
};
