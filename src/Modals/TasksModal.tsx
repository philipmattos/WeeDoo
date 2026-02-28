import React, { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { BaseModal } from './BaseModal';
import { useTaskStore } from '../store/taskStore';
import type { Task, TaskPriority } from '../types/task';
import { Plus, CheckSquare, Trash2, Calendar1, X } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

type FilterType = 'todos' | 'pendentes' | 'concluidos' | 'alta';

// ─── Date/Time Picker Popover ───────────────────────────────────────────
interface DatePickerProps {
    taskId: string;
    dueDate?: string;
    onSave: (id: string, iso: string | undefined) => void;
}

const DatePicker = ({ taskId, dueDate, onSave }: DatePickerProps) => {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        dueDate ? new Date(dueDate) : undefined
    );
    const [timeStr, setTimeStr] = useState(
        dueDate ? format(new Date(dueDate), 'HH:mm') : ''
    );

    const handleApply = () => {
        if (!selectedDate) {
            onSave(taskId, undefined);
            setOpen(false);
            return;
        }
        const d = new Date(selectedDate);
        if (timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            d.setHours(h || 0, m || 0, 0, 0);
        } else {
            d.setHours(0, 0, 0, 0);
        }
        onSave(taskId, d.toISOString());
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSave(taskId, undefined);
        setSelectedDate(undefined);
        setTimeStr('');
    };

    // Sync when dueDate changes externally
    useEffect(() => {
        setSelectedDate(dueDate ? new Date(dueDate) : undefined);
        setTimeStr(dueDate ? format(new Date(dueDate), 'HH:mm') : '');
    }, [dueDate]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Adicionar data e hora"
                    className={`w-8 h-8 rounded-lg transition-colors ${dueDate
                        ? 'bg-wd-primary/15 text-wd-primary hover:bg-wd-primary/25'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-500'
                        }`}
                >
                    <Calendar1 size={16} />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                side="top"
                className="w-auto p-0 rounded-2xl border-slate-200 dark:border-slate-600 shadow-xl bg-white dark:bg-slate-800 overflow-hidden"
            >
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Selecionar data</span>
                    {selectedDate && (
                        <button
                            type="button"
                            onClick={() => { setSelectedDate(undefined); setTimeStr(''); }}
                            className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                            title="Limpar data"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    initialFocus
                    className="rounded-none"
                />

                <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Hora (opcional)
                    </label>
                    <Input
                        type="time"
                        value={timeStr}
                        onChange={(e) => setTimeStr(e.target.value)}
                        className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 focus-visible:ring-wd-primary"
                    />
                    <div className="flex gap-2 mt-1">
                        {dueDate && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                                className="flex-1 rounded-full text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 text-xs h-8"
                            >
                                Remover data
                            </Button>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleApply}
                            className="flex-1 rounded-full bg-wd-primary hover:bg-wd-primary-dark text-white text-xs h-8"
                        >
                            {selectedDate ? 'Confirmar' : 'Fechar'}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

// ─── Format due date for display ─────────────────────────────────────────
function formatDueDate(iso: string): string {
    const d = new Date(iso);
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    if (hasTime) {
        return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    return format(d, "dd/MM/yyyy", { locale: ptBR });
}

// ─── Main Modal ──────────────────────────────────────────────────────────
export const TasksModal = () => {
    const { tasks, addTask, toggleTaskCompletion, updateTaskTitle, updateTaskDueDate, deleteTask, getCategories } = useTaskStore();

    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('baixa');
    const [category, setCategory] = useState('');

    const [currentFilter, setCurrentFilter] = useState<FilterType>('todos');
    const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const categories = getCategories();

    const handleAddTask = (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        addTask(title.trim(), priority, category.trim());
        setTitle('');
        setPriority('baixa');
        setCategory('');
    };

    const startEditing = (task: Task) => {
        if (task.completed) return;
        setEditingId(task.id);
        setEditTitle(task.title);
    };

    const saveEdit = () => {
        if (editingId && editTitle.trim()) {
            updateTaskTitle(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    let filteredTasks = [...tasks];
    if (currentFilter === 'pendentes') filteredTasks = filteredTasks.filter(t => !t.completed);
    if (currentFilter === 'concluidos') filteredTasks = filteredTasks.filter(t => t.completed);
    if (currentFilter === 'alta') filteredTasks = filteredTasks.filter(t => t.priority === 'alta' && !t.completed);
    if (currentCategoryFilter) {
        filteredTasks = filteredTasks.filter(t => t.category === currentCategoryFilter);
    }

    const priorityBgColors = {
        alta: 'bg-red-500',
        media: 'bg-orange-500',
        baixa: 'bg-emerald-500'
    };

    return (
        <>
            <BaseModal id="tasks" title="Minhas Tarefas">

                {/* ADD TASK SECTION */}
                <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Nova Tarefa</h2>
                    <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Digite o título da tarefa..."
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 h-11 rounded-full px-4 text-sm focus-visible:ring-wd-primary"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="h-11 w-11 bg-wd-primary text-white rounded-full hover:bg-wd-primary-dark hover:scale-105 transition-transform shrink-0 shadow-md font-bold"
                            >
                                <Plus size={26} strokeWidth={3} />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-full px-4 focus:ring-wd-primary w-[130px] shadow-sm">
                                    <SelectValue placeholder="Prioridade" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800">
                                    <SelectItem value="baixa" className="rounded-xl cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">Baixa</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="media" className="rounded-xl cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-orange-500" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">Média</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="alta" className="rounded-xl cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">Alta</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="text"
                                placeholder="Categoria (opcional)"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                list="category-suggestions"
                                className="flex-1 h-11 rounded-full px-4 text-sm focus-visible:ring-wd-primary"
                            />
                            <datalist id="category-suggestions">
                                {categories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
                        </div>
                    </form>
                </section>

                {/* FILTERS SECTION */}
                <section className="mb-6 space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(['todos', 'pendentes', 'concluidos', 'alta'] as FilterType[]).map(filter => (
                            <Button
                                key={filter}
                                variant="outline"
                                onClick={() => setCurrentFilter(filter)}
                                className={`px-4 py-1.5 h-8 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${currentFilter === filter
                                    ? 'bg-wd-primary-soft text-[#0c2f37] border-wd-primary hover:bg-[#d0efe8]'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-wd-primary hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1).replace('idos', 'ídos')}
                            </Button>
                        ))}
                    </div>

                    <select
                        value={currentCategoryFilter}
                        onChange={(e) => setCurrentCategoryFilter(e.target.value)}
                        className="w-full sm:max-w-xs h-10 border border-slate-200 dark:border-slate-600 rounded-xl px-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                    >
                        <option value="">Todas as categorias</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </section>

                {/* TASKS LIST */}
                <section className="space-y-4 pb-10">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <CheckSquare size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Nenhuma tarefa encontrada</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Adicione uma nova tarefa ou ajuste os filtros</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div
                                key={task.id}
                                className={`flex items-stretch gap-3 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-md ${task.completed ? 'opacity-70' : ''}`}
                            >
                                {/* Priority Indicator */}
                                <div className={`shrink-0 w-2.5 rounded-full my-0.5 ${priorityBgColors[task.priority]}`}></div>

                                {/* Task Content Container */}
                                <div className="flex-1 min-w-0 flex flex-col py-0.5">

                                    <div className="flex items-start gap-3">
                                        {/* Checkbox */}
                                        <Checkbox
                                            checked={task.completed}
                                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                                            className="mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 transition-colors data-[state=checked]:bg-wd-primary data-[state=checked]:border-wd-primary data-[state=unchecked]:border-slate-300 hover:border-wd-primary"
                                        />

                                        {/* Title */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            {editingId === task.id ? (
                                                <input
                                                    ref={editInputRef}
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onBlur={saveEdit}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                    className="w-full text-base font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded outline-none border border-slate-200 dark:border-slate-600 inline-block focus:border-wd-primary"
                                                />
                                            ) : (
                                                <h4
                                                    onClick={() => startEditing(task)}
                                                    className={`text-base font-medium transition-all cursor-text ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}
                                                >
                                                    {task.title}
                                                </h4>
                                            )}

                                            {/* Due Date display */}
                                            {task.dueDate && (
                                                <p className="text-xs text-wd-primary font-semibold mt-1 flex items-center gap-1">
                                                    <Calendar1 size={11} />
                                                    {formatDueDate(task.dueDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta & Actions */}
                                    <div className="mt-4 ml-9 flex items-center justify-between">
                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                                            {task.category}
                                        </Badge>

                                        <div className="flex gap-2">
                                            <DatePicker
                                                taskId={task.id}
                                                dueDate={task.dueDate}
                                                onSave={updateTaskDueDate}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setTaskToDelete(task.id)}
                                                title="Deletar Tarefa"
                                                className="w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))
                    )}
                </section>

            </BaseModal>

            {/* ── Confirm Delete Dialog ── */}
            <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 p-6 shadow-xl w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Excluir Tarefa</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600 dark:text-slate-300">Tem certeza que deseja excluir essa tarefa? Essa ação não pode ser desfeita.</p>
                    </div>
                    <div className="flex flex-row gap-2 justify-end mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTaskToDelete(null)}
                            className="rounded-full font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (taskToDelete) deleteTask(taskToDelete);
                                setTaskToDelete(null);
                            }}
                            className="rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
                        >
                            Excluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
