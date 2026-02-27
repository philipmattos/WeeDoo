import React, { useMemo, useState } from 'react';
import { BaseModal } from './BaseModal';
import { useKanbanStore } from '../store/kanbanStore';
import { type Id, type KanbanColumn, type KanbanTask } from '../types/kanban';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const KanbanModal = () => {
    const { columns, tasks, setColumns, setTasks, addColumn, addTask, deleteColumn, deleteTask, updateTask } = useKanbanStore();

    const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
    const [newColumnTitle, setNewColumnTitle] = useState('');

    const displayColumns = useMemo(() => {
        const fixedIds = ['todo', 'doing', 'done'];
        const fixedTitles = ['a fazer', 'fazendo', 'concluído'];

        return [...columns].sort((a, b) => {
            const aTitle = (a.title as string).trim().toLowerCase();
            const bTitle = (b.title as string).trim().toLowerCase();

            let aIndex = fixedIds.indexOf(a.id as string);
            if (aIndex === -1) aIndex = fixedTitles.indexOf(aTitle);

            let bIndex = fixedIds.indexOf(b.id as string);
            if (bIndex === -1) bIndex = fixedTitles.indexOf(bTitle);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return 0;
        });
    }, [columns]);

    const columnsId = useMemo(() => displayColumns.map((col) => col.id), [displayColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // 10px before drag starts to allow clicking inside
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddColumn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColumnTitle.trim()) return;
        addColumn(newColumnTitle.trim());
        setNewColumnTitle('');
    };

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Column') {
            setActiveColumn(event.active.data.current.column);
            return;
        }
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveAColumn = active.data.current?.type === 'Column';
        if (!isActiveAColumn) return;

        const activeColumnIndex = displayColumns.findIndex((col) => col.id === activeId);
        const overColumnIndex = displayColumns.findIndex((col) => col.id === overId);

        setColumns(arrayMove(displayColumns, activeColumnIndex, overColumnIndex));
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveATask = active.data.current?.type === 'Task';
        const isOverATask = over.data.current?.type === 'Task';

        if (!isActiveATask) return;

        // Dropping Task over another Task
        if (isActiveATask && isOverATask) {
            useKanbanStore.setState((state) => {
                const activeIndex = state.tasks.findIndex((t) => t.id === activeId);
                const overIndex = state.tasks.findIndex((t) => t.id === overId);

                if (activeIndex === -1 || overIndex === -1) return state;

                if (state.tasks[activeIndex].columnId !== state.tasks[overIndex].columnId) {
                    const newTasks = [...state.tasks];
                    newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: state.tasks[overIndex].columnId };
                    return { tasks: arrayMove(newTasks, activeIndex, overIndex) };
                } else {
                    return { tasks: arrayMove(state.tasks, activeIndex, overIndex) };
                }
            });
        }

        // Dropping Task over a empty column area
        const isOverAColumn = over.data.current?.type === 'Column';
        if (isActiveATask && isOverAColumn) {
            useKanbanStore.setState((state) => {
                const activeIndex = state.tasks.findIndex((t) => t.id === activeId);
                if (activeIndex === -1) return state;

                const newTasks = [...state.tasks];
                newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: overId };
                return { tasks: arrayMove(newTasks, activeIndex, activeIndex) };
            });
        }
    }

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
    };

    return (
        <BaseModal id="kanban" title="Projetos">
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 -mx-4 px-4 pb-6 mt-2">

                {/* Add column Input */}
                <form onSubmit={handleAddColumn} className="flex items-center gap-2 mb-6 shrink-0 pt-2">
                    <Input
                        type="text"
                        placeholder="Nome da nova coluna..."
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="flex-1 h-12 rounded-full px-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus-visible:ring-[#3bbfa0]"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 bg-[#3bbfa0] hover:bg-[#2fa085] text-white rounded-full transition-transform hover:scale-105 shrink-0 shadow-sm"
                    >
                        <Plus size={24} />
                    </Button>
                </form>

                {/* Kanban Board Layout */}
                <div className="flex flex-1 overflow-x-auto pb-4 snap-x snap-mandatory gap-4 scrollbar-hide items-start">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onDragOver={onDragOver}
                    >
                        <SortableContext items={columnsId}>
                            {displayColumns.map((col) => (
                                <ColumnContainer
                                    key={col.id}
                                    column={col}
                                    columns={displayColumns}
                                    deleteColumn={deleteColumn}
                                    tasks={tasks.filter((task) => task.columnId === col.id)}
                                    addTask={addTask}
                                    deleteTask={deleteTask}
                                    updateTask={updateTask}
                                />
                            ))}
                        </SortableContext>

                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeColumn && (
                                <ColumnContainer
                                    column={activeColumn}
                                    columns={displayColumns}
                                    deleteColumn={deleteColumn}
                                    tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
                                    addTask={addTask}
                                    deleteTask={deleteTask}
                                    updateTask={updateTask}
                                />
                            )}
                            {activeTask && (
                                <TaskCard
                                    task={activeTask}
                                    columns={displayColumns}
                                    deleteTask={deleteTask}
                                    updateTask={updateTask}
                                />
                            )}
                        </DragOverlay>
                    </DndContext>
                </div>

            </div>
        </BaseModal>
    );
};

// --- Column Component ---

interface ColumnProps {
    column: KanbanColumn;
    columns: KanbanColumn[];
    deleteColumn: (id: Id) => void;
    tasks: KanbanTask[];
    addTask: (columnId: Id, content: string) => void;
    deleteTask: (id: Id) => void;
    updateTask: (id: Id, updates: Partial<KanbanTask>) => void;
}

function ColumnContainer({ column, columns, deleteColumn, tasks, addTask, deleteTask, updateTask }: ColumnProps) {
    const [inputValue, setInputValue] = useState('');

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        addTask(column.id, inputValue.trim());
        setInputValue('');
    };

    const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-40 border-2 border-[#3bbfa0] border-dashed shrink-0 snap-center w-[75vw] max-w-[288px] h-full max-h-[70vh] rounded-3xl flex flex-col"
            ></div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-slate-100 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600/60 rounded-3xl shrink-0 snap-center w-[75vw] max-w-[288px] max-h-full flex flex-col shadow-sm"
        >
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between p-4 cursor-grab active:cursor-grabbing border-b border-slate-200 dark:border-slate-600/50 bg-white dark:bg-slate-800/50 rounded-t-3xl"
            >
                <div className="flex items-center gap-2">
                    <GripVertical size={18} className="text-slate-400 dark:text-slate-500" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {column.title}
                        <span className="bg-slate-200 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
                            {tasks.length}
                        </span>
                    </h3>
                </div>
                {(() => {
                    const defaultIds = ['todo', 'doing', 'done'];
                    const defaultTitles = ['a fazer', 'fazendo', 'concluído'];
                    const isDefault = defaultIds.includes(column.id as string) || defaultTitles.includes((column.title as string).trim().toLowerCase());

                    return !isDefault && (
                        <button
                            onClick={() => deleteColumn(column.id)}
                            className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors p-1"
                        >
                            <Trash2 size={18} />
                        </button>
                    );
                })()}
            </div>

            {/* Tasks Container */}
            <div className="flex flex-col gap-3 p-3 flex-1 overflow-x-hidden overflow-y-auto">
                <SortableContext items={tasksIds}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            columns={columns} // Assuming we want the store columns, but they aren't directly available without passing them down or using store directly
                            deleteTask={deleteTask}
                            updateTask={updateTask}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Footer / Add card */}
            <form onSubmit={handleAddTask} className="p-3 bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-600/50 rounded-b-3xl">
                <div className="flex items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Adicionar card..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="h-10 text-sm border-slate-200 dark:border-slate-600 rounded-xl focus-visible:ring-[#3bbfa0] bg-white dark:bg-slate-800"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 shrink-0 bg-[#e2f5f1] text-[#3bbfa0] hover:bg-[#d0efe8] rounded-xl hover:scale-105 transition-transform"
                    >
                        <Plus size={20} />
                    </Button>
                </div>
            </form>
        </div>
    );
}

// --- Task Component ---

interface TaskCardProps {
    task: KanbanTask;
    columns?: KanbanColumn[];
    deleteTask: (id: Id) => void;
    updateTask: (id: Id, updates: Partial<KanbanTask>) => void;
}

function TaskCard({ task, columns, deleteTask, updateTask }: TaskCardProps) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditTitle, setIsEditTitle] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const [editDescription, setEditDescription] = useState(task.description || '');

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const handleSaveText = () => {
        if (editContent.trim()) {
            updateTask(task.id, {
                content: editContent.trim(),
                description: editDescription.trim()
            });
        }
    };

    const handleColorChange = (newColor: string) => {
        updateTask(task.id, { color: newColor });
    };

    const handleMoveColumn = (newColumnId: Id) => {
        updateTask(task.id, { columnId: newColumnId });
    };

    const handleDelete = () => {
        deleteTask(task.id);
        setIsDetailsOpen(false);
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-40 bg-white dark:bg-slate-800 border-2 border-[#3bbfa0] border-dashed rounded-2xl h-[80px] cursor-grabbing"
            />
        );
    }

    const taskColors = [
        { name: 'Padrão', color: 'bg-slate-200' },
        { name: 'Vermelho', color: 'bg-red-500' },
        { name: 'Laranja', color: 'bg-orange-500' },
        { name: 'Amarelo', color: 'bg-amber-400' },
        { name: 'Lima', color: 'bg-lime-500' },
        { name: 'Verde', color: 'bg-emerald-500' },
        { name: 'Ciano', color: 'bg-cyan-500' },
        { name: 'Azul', color: 'bg-blue-500' },
        { name: 'Roxo', color: 'bg-purple-500' },
        { name: 'Rosa', color: 'bg-pink-500' },
    ];

    const currentBadgeColor = task.color && task.color !== 'bg-white dark:bg-slate-800' ? task.color : 'bg-slate-200';

    return (
        <Dialog open={isDetailsOpen} onOpenChange={(open) => {
            setIsDetailsOpen(open);
            if (!open) handleSaveText();
        }}>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => setIsDetailsOpen(true)}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center group hover:shadow-md transition-shadow cursor-pointer active:cursor-grabbing hover:border-[#3bbfa0]/30"
            >
                {/* Color Badge */}
                {currentBadgeColor !== 'bg-slate-200' && (
                    <div className={`w-5 h-5 rounded-md shrink-0 mr-3 shadow-sm ${currentBadgeColor}`} />
                )}

                <div className="flex-1 w-full text-base font-medium text-slate-700 dark:text-slate-200 min-w-0">
                    <p className="truncate block">
                        {task.content}
                    </p>
                </div>
            </div>
            <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 p-6 shadow-xl w-[90vw] overflow-y-auto max-h-[90vh]">
                <DialogHeader className="mb-2 text-left">
                    <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Detalhes do Card</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-2">
                    <div className="flex flex-col gap-1 -mt-2">
                        <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Título</label>
                        {isEditTitle ? (
                            <Input
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onBlur={() => {
                                    handleSaveText();
                                    setIsEditTitle(false);
                                }}
                                className="w-full text-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600 rounded-xl px-4 h-12 outline-none focus-visible:ring-1 focus-visible:ring-[#3bbfa0] text-slate-800 dark:text-slate-100 font-bold"
                                placeholder="Título da tarefa"
                            />
                        ) : (
                            <h2
                                onClick={() => setIsEditTitle(true)}
                                className="text-xl font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 px-2 py-1 -mx-2 rounded-xl border border-transparent hover:border-slate-200 transition-colors"
                            >
                                {editContent || 'Sem título'}
                            </h2>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Comentários / Descrição</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            onBlur={handleSaveText}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-[#3bbfa0] focus:ring-1 focus:ring-[#3bbfa0] resize-y text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                            placeholder="Adicione mais detalhes..."
                        ></textarea>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cor</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm shrink-0"
                                    >
                                        <div className={`w-5 h-5 rounded-md ${currentBadgeColor}`}></div>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-auto p-3 rounded-2xl border-slate-100 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800">
                                    <div className="grid grid-cols-5 gap-2">
                                        {taskColors.map((tc) => (
                                            <button
                                                key={tc.color}
                                                type="button"
                                                onClick={() => handleColorChange(tc.color)}
                                                title={tc.name}
                                                className={`w-8 h-8 rounded-lg border-2 ${tc.color === currentBadgeColor ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'} flex items-center justify-center`}
                                            >
                                                <div className={`w-full h-full rounded-md ${tc.color}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-[40px]">Clique na cor para mudar</span>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Mover para coluna</label>
                        <div className="flex flex-wrap gap-2">
                            {columns?.map((col) => (
                                <Button
                                    key={col.id}
                                    type="button"
                                    variant={col.id === task.columnId ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleMoveColumn(col.id)}
                                    disabled={col.id === task.columnId}
                                    className={`rounded-full px-4 h-9 ${col.id === task.columnId ? 'bg-[#3bbfa0] text-white hover:bg-[#3bbfa0]' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#3bbfa0] hover:text-[#3bbfa0]'}`}
                                >
                                    {col.title}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex mt-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        className="w-full rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold border-0 transition-colors h-12 px-6 flex items-center gap-2 justify-center"
                    >
                        <Trash2 size={20} />
                        <span>Excluir Card</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
