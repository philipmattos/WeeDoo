import React, { useState, useRef } from 'react';
import { useModalStore } from './store/modalStore';
import { useThemeStore } from './store/themeStore';
import { ModalManager } from './Modals/ModalManager';
import { useTaskStore } from './store/taskStore';
import { useKanbanStore } from './store/kanbanStore';
import { useNotesStore } from './store/notesStore';
import { useGroceryStore } from './store/groceryStore';
import { useCalendarStore } from './store/calendarStore';
import {
    Sun, Moon, User, FileText, Home, CheckSquare,
    Columns, ShoppingCart, AlertCircle, Calendar1,
    ClipboardList, StickyNote, ArrowRight
} from 'lucide-react';
import { format, isBefore, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ModalType = 'notes' | 'tasks' | 'kanban' | 'calendar' | 'groceries' | null;

// -- Theme Toggle with rising icon animation ----------------------------------
const ThemeToggle = () => {
    const { isDark, toggle } = useThemeStore();
    // Changing the key forces React to remount the icon span => re-triggers CSS animation
    const iconKey = isDark ? 'moon' : 'sun';

    return (
        <button
            onClick={toggle}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            className="relative flex items-center w-[52px] h-[28px] rounded-full transition-colors cursor-pointer shrink-0 overflow-hidden"
            style={{
                backgroundColor: isDark ? '#04C776' : '#09ED91',
                overflow: 'hidden',
            }}
        >
            {/* Background icons — white, visible, above background */}
            <Sun size={16} className="absolute left-[6px]  top-1/2 -translate-y-1/2 text-white pointer-events-none z-[1]" />
            <Moon size={16} className="absolute right-[6px] top-1/2 -translate-y-1/2 text-white pointer-events-none z-[1]" />

            {/* Sliding white thumb — overflow hidden clips the rising icon */}
            <span
                className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md
                            flex items-center justify-center overflow-hidden z-10
                            transition-[left] duration-500`}
                style={{ left: isDark ? '27px' : '3px' }}
            >
                {/* Icon key changes on toggle => remounts => triggers wd-rise animation */}
                <span key={iconKey} className="wd-rise flex items-center justify-center">
                    {isDark
                        ? <Moon size={12} className="text-slate-600" />
                        : <Sun size={12} className="text-[#F0BC00]" />
                    }
                </span>
            </span>
        </button>
    );
};

// -- Nav Button with pop animation -------------------------------------------
const NavButton = ({
    id, icon: Icon, label, active, onClick,
}: {
    id: string | null; icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${active ? 'text-wd-primary' : 'text-slate-400 dark:text-slate-500'
                }`}
        >
            {/* key on active triggers remount => wd-nav-pop plays */}
            <span key={active ? `${id}-on` : `${id}-off`}
                className={active ? 'wd-nav-pop' : ''}>
                <Icon size={24} className={active ? 'stroke-[2.5px]' : ''} />
            </span>
            <span key={active ? `${id}-lbl-on` : `${id}-lbl-off`}
                className={`text-[11px] ${active ? 'wd-label-up font-semibold' : ''}`}>
                {label}
            </span>
        </button>
    );
};

// -- Main App ----------------------------------------------------------------
const App = () => {
    const { openModal } = useModalStore();
    const activeModal = useModalStore(s => s.activeModal);

    const [userName, setUserName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('weedoo_user_name') || 'Seu Nome';
        }
        return 'Seu Nome';
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUserName(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('weedoo_user_name', value);
        }
    };

    const tasks = useTaskStore(s => s.tasks);
    const kanbanTasks = useKanbanStore(s => s.tasks);
    const notes = useNotesStore(s => s.notes);
    const groceryLists = useGroceryStore(s => s.lists);

    const pendingTasks = tasks.filter(t => !t.completed).length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'alta' && !t.completed).length;
    const kanbanTotal = kanbanTasks.length;
    const kanbanDone = kanbanTasks.filter(t => t.columnId === 'done' || t.columnId === 'concluido').length;
    const notesCount = notes.length;

    // Sum unchecked items across all lists
    const groceryPending = groceryLists.reduce((acc, list) => {
        return acc + list.items.filter(g => !g.checked).length;
    }, 0);

    const calendarEvents = useCalendarStore(s => s.events);

    // Combined upcoming items: tasks with dueDate + calendar events, sorted by date
    const now = new Date();
    const upcomingItems = [
        // Tasks with future/overdue due dates
        ...tasks
            .filter(t => !t.completed && t.dueDate)
            .map(t => ({
                id: t.id,
                title: t.title,
                date: new Date(t.dueDate!),
                dateStr: t.dueDate!,
                time: t.dueDate!.includes('T') ? t.dueDate!.substring(11, 16) : undefined,
                type: 'task' as const,
                priority: t.priority,
                color: '',
            })),
        // Calendar events from today onwards
        ...calendarEvents
            .filter(e => e.date >= format(now, 'yyyy-MM-dd'))
            .map(e => ({
                id: e.id,
                title: e.title,
                date: new Date(`${e.date}T${e.time ?? '00:00'}`),
                dateStr: e.date,
                time: e.time,
                type: 'event' as const,
                priority: undefined,
                color: e.color,
            })),
    ]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 4);

    const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

    const navItems = [
        { id: null, icon: Home, label: 'Home', onClick: () => useModalStore.getState().closeModal() },
        { id: 'tasks', icon: CheckSquare, label: 'Tarefas', onClick: () => openModal('tasks') },
        { id: 'groceries', icon: ShoppingCart, label: 'Lista', onClick: () => openModal('groceries') },
        { id: 'kanban', icon: Columns, label: 'Kanban', onClick: () => openModal('kanban') },
        { id: 'notes', icon: FileText, label: 'Notas', onClick: () => openModal('notes') },
        { id: 'calendar', icon: Calendar1, label: 'Agenda', onClick: () => openModal('calendar') },
    ] as const;

    return (
        <div className="flex flex-col h-screen overflow-hidden text-slate-800 dark:text-slate-100 font-sans sm:max-w-md sm:mx-auto sm:shadow-xl sm:border-x bg-slate-50 dark:bg-slate-900">

            {/* Header */}
            <header className="h-[56px] shrink-0 bg-wd-primary text-white px-4 flex items-center justify-between z-30 w-full">
                <div className="w-8" />
                <h1 className="text-xl font-bold tracking-wide">WeeDoo</h1>
                <ThemeToggle />
            </header>

            {/* Home Tab */}
            {!activeModal && (
                <main className="flex-1 overflow-y-auto overscroll-contain p-4 pb-28 space-y-4">

                    {/* Profile Card */}
                    <div className="wd-card-in bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                        <div className="bg-wd-primary-soft dark:bg-wd-primary-soft w-14 h-14 rounded-full flex items-center justify-center text-[#21434b] dark:text-wd-primary shrink-0">
                            <User size={28} />
                        </div>
                        <div className="min-w-0">
                            <input
                                type="text"
                                value={userName}
                                onChange={handleNameChange}
                                className="text-lg font-bold text-[#0c2f37] dark:text-slate-100 bg-transparent border-none outline-none focus:ring-2 focus:ring-wd-primary/20 rounded px-1 -ml-1 w-full max-w-[200px]"
                                placeholder="Seu Nome"
                            />
                            <p className="text-sm text-slate-400 dark:text-slate-500 capitalize">{today}</p>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">

                        <button onClick={() => openModal('tasks')}
                            className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-transform cursor-pointer"
                            style={{ animationDelay: '0.05s' }}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${highPriorityTasks > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-400' : 'bg-wd-primary-soft dark:bg-wd-primary-soft text-wd-primary'}`}>
                                    <AlertCircle size={20} />
                                </div>
                                <span className="text-[30px] font-bold text-[#0c2f37] dark:text-slate-100 leading-none">{pendingTasks}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                {highPriorityTasks > 0 ? `${highPriorityTasks} urgente${highPriorityTasks > 1 ? 's' : ''} pendente${highPriorityTasks > 1 ? 's' : ''}` : 'Tarefas pendentes'}
                            </span>
                        </button>

                        <button onClick={() => openModal('kanban')}
                            className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-transform cursor-pointer"
                            style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center gap-3">
                                <div className="bg-wd-primary-soft dark:bg-wd-primary-soft text-wd-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                    <Columns size={20} />
                                </div>
                                <span className="text-[30px] font-bold text-[#0c2f37] dark:text-slate-100 leading-none">{kanbanTotal}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                {kanbanTotal > 0 ? `${kanbanDone} conclu\u00eddo${kanbanDone !== 1 ? 's' : ''} de ${kanbanTotal}` : 'Cards Kanban'}
                            </span>
                        </button>

                        <button onClick={() => openModal('notes')}
                            className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-transform cursor-pointer"
                            style={{ animationDelay: '0.15s' }}>
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                    <StickyNote size={20} />
                                </div>
                                <span className="text-[30px] font-bold text-[#0c2f37] dark:text-slate-100 leading-none">{notesCount}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Total de notas</span>
                        </button>

                        <button onClick={() => openModal('groceries')}
                            className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-transform cursor-pointer"
                            style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-400 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                                    <ShoppingCart size={20} />
                                </div>
                                <span className="text-[30px] font-bold text-[#0c2f37] dark:text-slate-100 leading-none">{groceryPending}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Itens na lista</span>
                        </button>
                    </div>

                    {/* Upcoming: tasks + calendar events */}
                    {upcomingItems.length > 0 && (
                        <div className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm p-5" style={{ animationDelay: '0.25s' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[#0c2f37] dark:text-slate-100 font-bold text-base flex items-center gap-2">
                                    <Calendar1 size={18} className="text-wd-primary" />
                                    Pr&oacute;ximas datas
                                </h3>
                                <button onClick={() => openModal('calendar')}
                                    className="text-wd-primary text-xs font-semibold flex items-center gap-1 hover:opacity-70 active:scale-90 transition-all">
                                    Ver todas <ArrowRight size={13} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {upcomingItems.map(item => {
                                    const d = item.date;
                                    const isOverdue = item.type === 'task' && isBefore(
                                        item.time ? d : endOfDay(d), now
                                    );
                                    const dotColor = item.type === 'task'
                                        ? (item.priority === 'alta' ? 'bg-red-400' : item.priority === 'media' ? 'bg-orange-400' : 'bg-emerald-400')
                                        : item.color;
                                    const calBg = item.type === 'event'
                                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-500'
                                        : isOverdue ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-wd-primary-soft dark:bg-wd-primary-soft text-slate-700 dark:text-wd-primary';
                                    return (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center text-center ${calBg}`}>
                                                <span className="text-base font-bold leading-none">{format(d, 'd')}</span>
                                                <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{format(d, 'MMM', { locale: ptBR })}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isOverdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{item.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.time && <span className="text-xs text-slate-400">{item.time}</span>}
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${item.type === 'task'
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                                                        : 'bg-violet-50 dark:bg-violet-900/30 text-violet-500'
                                                        }`}>
                                                        {item.type === 'task' ? 'Tarefa' : 'Compromisso'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Acesso rapido */}
                    <div className="wd-card-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm p-5" style={{ animationDelay: '0.3s' }}>
                        <h3 className="text-slate-800 dark:text-slate-100 font-bold text-base mb-3 flex items-center gap-2">
                            <ClipboardList size={18} className="text-wd-primary" />
                            Acesso r&aacute;pido
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { label: 'Nova Tarefa', icon: CheckSquare, modal: 'tasks' as ModalType, color: 'bg-wd-primary-soft dark:bg-wd-primary-soft text-wd-primary' },
                                { label: 'Nova Nota', icon: FileText, modal: 'notes' as ModalType, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-400' },
                                { label: 'Kanban', icon: Columns, modal: 'kanban' as ModalType, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-400' },
                                { label: 'Lista', icon: ShoppingCart, modal: 'groceries' as ModalType, color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-400' },
                            ]).map(({ label, icon: Icon, modal, color }) => (
                                <button key={label} onClick={() => openModal(modal)}
                                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.03] active:scale-[0.96] transition-all text-left">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                </main>
            )}

            {/* Tab panels */}
            <ModalManager />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 sm:max-w-md sm:mx-auto pb-4 pt-3 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex justify-between items-center">
                    {navItems.map(({ id, icon, label, onClick }) => {
                        const active = id === null ? !activeModal : activeModal === id;
                        return (
                            <NavButton
                                key={label}
                                id={id as string}
                                icon={icon}
                                label={label}
                                active={active}
                                onClick={onClick}
                            />
                        );
                    })}
                </div>
            </nav>

        </div>
    );
};

export default App;
