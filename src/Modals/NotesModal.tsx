import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BaseModal } from './BaseModal';
import { useNotesStore } from '../store/notesStore';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowLeft, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, ChevronDown, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

import type { Note } from '../types/notes';

// ─── BUG FIX: MenuBar subscribes to editor transactions for accurate isActive state ───
const MenuBar = ({ editor }: { editor: Editor | null }) => {
    const [sizeOpen, setSizeOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);
    // Force re-render on every editor transaction so isActive() is always fresh
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        if (!editor) return;
        const update = () => forceUpdate(n => n + 1);
        editor.on('transaction', update);
        editor.on('selectionUpdate', update);
        return () => {
            editor.off('transaction', update);
            editor.off('selectionUpdate', update);
        };
    }, [editor]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setSizeOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!editor) return null;

    const isH1 = editor.isActive('heading', { level: 1 });
    const isH2 = editor.isActive('heading', { level: 2 });
    const isH3 = editor.isActive('heading', { level: 3 });
    const isH4 = editor.isActive('heading', { level: 4 });
    const isHeading = isH1 || isH2 || isH3 || isH4;
    const isBold = editor.isActive('bold');
    const isItalic = editor.isActive('italic');
    const isUnderline = editor.isActive('underline');
    const isBullet = editor.isActive('bulletList');
    const isOrdered = editor.isActive('orderedList');

    const getCurrentSizeLabel = () => {
        if (isH1) return 'Título 1';
        if (isH2) return 'Título 2';
        if (isH3) return 'Título 3';
        if (isH4) return 'Título 4';
        return 'Corpo';
    };

    const sizeOptions = [
        { label: 'Corpo', action: () => editor.chain().focus().setParagraph().run(), isActive: !isHeading },
        { label: 'Título 1', action: () => editor.chain().focus().setHeading({ level: 1 }).run(), isActive: isH1 },
        { label: 'Título 2', action: () => editor.chain().focus().setHeading({ level: 2 }).run(), isActive: isH2 },
        { label: 'Título 3', action: () => editor.chain().focus().setHeading({ level: 3 }).run(), isActive: isH3 },
        { label: 'Título 4', action: () => editor.chain().focus().setHeading({ level: 4 }).run(), isActive: isH4 },
    ];

    const activeBtn = 'bg-wd-primary/15 text-wd-primary font-extrabold ring-1 ring-wd-primary/40';
    const inactiveBtn = 'text-slate-500 dark:text-slate-400 hover:text-wd-primary hover:bg-slate-100 dark:hover:bg-slate-600';

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-600 rounded-t-2xl">
            {/* Tamanhos dropdown */}
            <div className="relative" ref={dropRef}>
                <button
                    type="button"
                    onClick={() => setSizeOpen(v => !v)}
                    className={`flex items-center gap-1 px-3 h-8 rounded-full text-sm font-semibold transition-all border ${isHeading
                        ? 'bg-wd-primary/15 text-wd-primary border-wd-primary/30 ring-1 ring-wd-primary/30'
                        : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                >
                    {getCurrentSizeLabel()}
                    <ChevronDown size={13} className={`transition-transform ${sizeOpen ? 'rotate-180' : ''}`} />
                </button>
                {sizeOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-xl overflow-hidden min-w-[140px] py-1">
                        {sizeOptions.map(opt => (
                            <button
                                key={opt.label}
                                type="button"
                                onClick={() => { opt.action(); setSizeOpen(false); }}
                                className={`w-full text-left px-4 py-2 transition-colors ${opt.isActive
                                    ? 'bg-wd-primary/10 text-wd-primary'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {/* Preview each size visually */}
                                {opt.label === 'Corpo' && <span className="text-sm font-normal leading-tight">Corpo</span>}
                                {opt.label === 'Título 1' && <span className="text-[18px] font-bold leading-tight block">Título 1</span>}
                                {opt.label === 'Título 2' && <span className="text-[16px] font-bold leading-tight block">Título 2</span>}
                                {opt.label === 'Título 3' && <span className="text-[14px] font-bold leading-tight block">Título 3</span>}
                                {opt.label === 'Título 4' && <span className="text-[13px] font-semibold leading-tight block">Título 4</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            <Button type="button" variant="ghost" size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`transition-all h-8 w-8 p-0 rounded-full ${isBold ? activeBtn : inactiveBtn}`}
                title="Negrito (**texto**)"
            >
                <Bold size={16} />
            </Button>
            <Button type="button" variant="ghost" size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`transition-all h-8 w-8 p-0 rounded-full ${isItalic ? activeBtn : inactiveBtn}`}
                title="Itálico (*texto*)"
            >
                <Italic size={16} />
            </Button>
            <Button type="button" variant="ghost" size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`transition-all h-8 w-8 p-0 rounded-full ${isUnderline ? activeBtn : inactiveBtn}`}
                title="Sublinhado"
            >
                <UnderlineIcon size={16} />
            </Button>

            <div className="w-[1px] h-5 bg-slate-200 mx-1" />

            <Button type="button" variant="ghost" size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`transition-all h-8 w-8 p-0 rounded-full ${isBullet ? activeBtn : inactiveBtn}`}
                title="Lista"
            >
                <List size={16} />
            </Button>
            <Button type="button" variant="ghost" size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`transition-all h-8 w-8 p-0 rounded-full ${isOrdered ? activeBtn : inactiveBtn}`}
                title="Lista numerada"
            >
                <ListOrdered size={16} />
            </Button>
        </div>
    );
};

// ─── Helper: extract title from first block element ───
function extractTitle(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const firstBlock = temp.firstElementChild;
    const text = (firstBlock?.textContent || '').trim();
    if (!text) return 'Nova Nota Sem Título';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
}

// ─── Tiptap Extensions ───
const editorExtensions = [
    StarterKit.configure({
        // Disable all markdown input rules (no auto-formatting on typing)
        bold: { HTMLAttributes: {} },
        italic: { HTMLAttributes: {} },
        heading: {
            levels: [1, 2, 3, 4],
            HTMLAttributes: {},
        },
    }),
    Underline,
];

export const NotesModal = () => {
    const { notes, addNote, updateNote, deleteNote } = useNotesStore();

    const [view, setView] = useState<'list' | 'editor'>('list');
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    // ─── BUG FIX: use ref to avoid stale closure in onUpdate ───
    const activeNoteRef = useRef<Note | null>(null);
    activeNoteRef.current = activeNote;

    const editor = useEditor({
        extensions: editorExtensions,
        enableInputRules: false,   // disables all markdown shortcuts like *text*, **text**, # heading
        enablePasteRules: false,   // also disables paste auto-formatting
        content: '',
        onUpdate: ({ editor }) => {
            const note = activeNoteRef.current;
            if (!note) return;
            const html = editor.getHTML();
            const title = extractTitle(html);
            updateNote(note.id, { content: html, title });
            setActiveNote(prev => prev ? { ...prev, content: html, title } : null);
        },
        editorProps: {
            attributes: {
                // Custom class: avoid 'prose' which sizes H1 at 2.25em vs H2 at 1.5em (too large a gap).
                // Instead use our own heading style rules defined below.
                class: 'notes-editor focus:outline-none min-h-[45vh] p-6 text-slate-700 dark:text-slate-200 leading-relaxed outline-none w-full',
            },
        },
    });

    // Load note content into editor when switching notes
    useEffect(() => {
        if (editor && activeNote) {
            // setContent only if content actually differs (avoid infinite loop)
            const current = editor.getHTML();
            if (activeNote.content !== current) {
                editor.commands.setContent(activeNote.content || '');
            }
            setTimeout(() => editor.commands.focus(), 80);
        }
    }, [activeNote?.id]); // Only trigger on note id change

    const handleCreateNote = useCallback(() => {
        const stub = {
            title: 'Nova Nota',
            content: '',
        };
        const newNote = addNote(stub);
        setActiveNote(newNote);
        setView('editor');
    }, [addNote]);

    const handleOpenNote = useCallback((note: Note) => {
        setActiveNote(note);
        setView('editor');
    }, []);

    const handleBackToList = useCallback(() => {
        const note = activeNoteRef.current;
        if (note && (note.content === '<p></p>' || note.content === '')) {
            deleteNote(note.id);
        }
        setActiveNote(null);
        setView('list');
    }, [deleteNote]);

    return (
        <BaseModal id="notes" title={view === 'list' ? 'Minhas Anotações' : 'Editar Nota'}>

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300 pt-2 pb-24 gap-4">
                    <div className="flex justify-start">
                        <Button
                            onClick={handleCreateNote}
                            className="w-auto px-6 rounded-full bg-wd-primary text-white hover:bg-wd-primary-dark h-11 font-bold text-sm shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <Plus size={22} strokeWidth={3} />
                            Adicionar notas
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                        {notes.length === 0 ? (
                            <div className="text-center py-14 flex flex-col items-center gap-2 opacity-50">
                                <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Nenhuma nota ainda.</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500">Clique acima para criar a primeira.</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => handleOpenNote(note)}
                                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-4 flex items-center justify-between group hover:border-wd-primary/40 transition-colors cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{note.title || 'Sem título'}</h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNoteToDelete(note.id as string);
                                        }}
                                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full h-9 w-9 shrink-0"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── EDITOR VIEW ── */}
            {view === 'editor' && (
                <div className="flex flex-col absolute inset-0 bg-white dark:bg-slate-800 z-10 animate-in slide-in-from-right-8 duration-300 rounded-3xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBackToList}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full h-9 w-9 shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex-1 truncate font-bold text-slate-800 dark:text-slate-100">
                            {activeNote?.title || 'Escrevendo...'}
                        </div>
                    </div>

                    {/* Editor area */}
                    <div className="flex-1 overflow-y-auto w-full p-4 overflow-x-hidden">
                        <div className="mx-auto w-full border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
                            <MenuBar editor={editor} />
                            <EditorContent editor={editor} />
                        </div>

                        {/* Close / Save button below editor */}
                        <div className="mt-4 pb-24">
                            <Button
                                type="button"
                                onClick={handleBackToList}
                                className="w-full rounded-full h-12 bg-wd-primary hover:bg-wd-primary-dark text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01]"
                            >
                                <Save size={18} />
                                Salvar e Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 p-6 shadow-xl w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Excluir Nota</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600 dark:text-slate-300">Tem certeza que deseja apagar essa nota? Essa ação não pode ser desfeita.</p>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setNoteToDelete(null)}
                            className="rounded-full font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                if (noteToDelete) deleteNote(noteToDelete);
                                setNoteToDelete(null);
                            }}
                            className="rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
                        >
                            Excluir Nota
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </BaseModal>
    );
};
