import type { FormEvent } from 'react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseModal } from './BaseModal';
import { useGroceryStore, type GroceryList } from '../store/groceryStore';
import {
    Plus, Trash2, ShoppingCart, Cloud, DownloadCloud,
    ChevronLeft, Save, Copy, Loader2, RefreshCw, CloudOff, CheckCircle2, AlertCircle
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { fetchListRecord, createListRecord, updateListRecord } from '../services/airtable';

// ── Simple in-app Toast ──────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const show = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    return { toasts, show };
};

const ToastContainer = ({ toasts }: { toasts: Toast[] }) => (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[90vw] sm:max-w-sm pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white animate-in slide-in-from-top-2 duration-300
                ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-slate-700'}`}>
                {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
                {t.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
                {t.type === 'info' && <Cloud size={18} className="shrink-0" />}
                {t.message}
            </div>
        ))}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const GroceriesModal = () => {
    const {
        lists, createList, deleteList, updateListMeta,
        addItem, toggleItem, removeItem, clearChecked, setListItems
    } = useGroceryStore();

    const { toasts, show: showToast } = useToast();

    // UI States
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    // Form states
    const [newListTitle, setNewListTitle] = useState('');
    const [newItemText, setNewItemText] = useState('');
    const [importId, setImportId] = useState('');

    // Loading states
    const [isLoadingInit, setIsLoadingInit] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncingDown, setIsSyncingDown] = useState(false);

    // Polling state
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const activeList = lists.find(l => l.id === activeListId) ?? null;

    // ── Smart merge: preserves unchanged item references → no flicker ────────
    const syncFromCloud = useCallback(async (list: GroceryList, silent = false) => {
        if (!list.airtableId) return;
        try {
            const record = await fetchListRecord(list.airtableId);
            if (record?.fields.ItemsData) {
                const remoteItems = JSON.parse(record.fields.ItemsData);

                // Get the latest local items directly from store (avoids stale closure)
                const currentItems = useGroceryStore.getState().lists
                    .find(l => l.id === list.id)?.items ?? [];

                const localById = new Map(currentItems.map(i => [i.id, i]));

                let hasChanges = false;
                const merged = remoteItems.map((remote: typeof remoteItems[0]) => {
                    const local = localById.get(remote.id);
                    if (!local) { hasChanges = true; return remote; } // new item
                    if (local.checked !== remote.checked || local.text !== remote.text) {
                        hasChanges = true; return remote; // changed item
                    }
                    return local; // unchanged — same reference, React skips re-render
                });

                // Check for deletions
                if (merged.length !== currentItems.length) hasChanges = true;

                if (hasChanges) {
                    setListItems(list.id, merged);
                }
                setLastSyncedAt(new Date());
                if (!silent) showToast('Lista atualizada da nuvem!', 'success');
            }
        } catch {
            if (!silent) showToast('Erro ao sincronizar com a nuvem.', 'error');
        }
    }, [setListItems, showToast]);


    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);

        if (activeList?.airtableId) {
            pollRef.current = setInterval(() => {
                syncFromCloud(activeList, true);
            }, POLL_INTERVAL_MS);
        }

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeList?.id, activeList?.airtableId, syncFromCloud]);

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleCreateList = (e: FormEvent) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;
        const newList = createList(newListTitle.trim());
        setNewListTitle('');
        setActiveListId(newList.id);
    };

    const handleImportList = async () => {
        if (!importId.trim()) return;
        setIsLoadingInit(true);
        try {
            const record = await fetchListRecord(importId.trim());
            if (record) {
                const title = record.fields.Title || 'Lista Importada';
                const itemsData = record.fields.ItemsData ? JSON.parse(record.fields.ItemsData) : [];
                const newList = createList(title, record.id, itemsData);
                setActiveListId(newList.id);
                setImportId('');
                setIsImportDialogOpen(false);
                showToast('Lista importada com sucesso!', 'success');
            } else {
                showToast('ID n\u00e3o encontrado no Airtable.', 'error');
            }
        } catch {
            showToast('Erro ao importar lista. Verifique o ID.', 'error');
        } finally {
            setIsLoadingInit(false);
        }
    };

    // "Salvar como" — cria NOVO registro no Airtable (novo ID)
    const handleSaveAs = async () => {
        if (!activeList) return;
        setIsSaving(true);
        try {
            const newRecord = await createListRecord(activeList.title, JSON.stringify(activeList.items));
            updateListMeta(activeList.id, { airtableId: newRecord.id });
            setLastSyncedAt(new Date());
            showToast('Lista salva na nuvem! ID gerado.', 'success');
        } catch {
            showToast('Erro ao salvar lista na nuvem.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // "Salvar" — atualiza o registro EXISTENTE (mesmo ID)
    const handleSave = async () => {
        if (!activeList?.airtableId) return;
        setIsSaving(true);
        try {
            await updateListRecord(activeList.airtableId, activeList.title, JSON.stringify(activeList.items));
            setLastSyncedAt(new Date());
            showToast('Lista salva na nuvem!', 'success');
        } catch {
            showToast('Erro ao salvar lista.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // "Sincronizar" — BAIXA do Airtable, sobrescreve local
    const handleSyncDown = async () => {
        if (!activeList) return;
        setIsSyncingDown(true);
        await syncFromCloud(activeList, false);
        setIsSyncingDown(false);
    };

    const handleCopyId = () => {
        if (activeList?.airtableId) {
            navigator.clipboard.writeText(activeList.airtableId);
            showToast('ID copiado!', 'info');
        }
    };

    const handleAddItem = (e: FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !activeList) return;
        addItem(activeList.id, newItemText.trim());
        setNewItemText('');
    };

    // ── Format last sync time ─────────────────────────────────────────────────
    const syncLabel = lastSyncedAt
        ? `Sincronizado \u00e0s ${lastSyncedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : null;

    // ── Views ─────────────────────────────────────────────────────────────────

    const renderListView = () => (
        <div className="flex flex-col gap-6">
            <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                <form onSubmit={handleCreateList} className="flex items-center gap-2 mb-4">
                    <Input
                        type="text"
                        placeholder="Nome da nova lista..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        className="flex-1 h-12 rounded-full px-5 text-base bg-white dark:bg-slate-800 border-slate-200 focus-visible:ring-wd-primary"
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 bg-wd-primary hover:bg-wd-primary-dark text-white rounded-full shrink-0 shadow-md">
                        <Plus size={24} />
                    </Button>
                </form>

                <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(true)}
                    className="w-full rounded-2xl h-12 border-dashed border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-wd-primary hover:border-wd-primary bg-transparent hover:bg-teal-50 dark:hover:bg-teal-900/20"
                >
                    <DownloadCloud size={20} className="mr-2" />
                    Importar lista via ID
                </Button>
            </section>

            <section className="flex flex-col gap-3 pb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">Minhas Listas</h3>

                {lists.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <ShoppingCart size={40} className="mx-auto mb-3 text-slate-400" />
                        <p className="text-slate-500">Nenhuma lista criada</p>
                    </div>
                ) : (
                    lists.map(list => (
                        <div
                            key={list.id}
                            className="group relative flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-wd-primary cursor-pointer transition-all active:scale-[0.98]"
                            onClick={() => setActiveListId(list.id)}
                        >
                            <div className="flex items-center gap-4 truncate pr-16 w-full">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-wd-primary flex items-center justify-center shrink-0">
                                    <ShoppingCart size={20} />
                                </div>
                                <div className="truncate">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{list.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span>{list.items.filter(i => i.checked).length}/{list.items.length} itens</span>
                                        {list.airtableId && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1 text-emerald-500">
                                                    <Cloud size={10} /> Na nuvem
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                                className="absolute right-4 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </section>
        </div>
    );

    const renderDetailView = () => {
        if (!activeList) return null;
        const checkedItems = activeList.items.filter(i => i.checked).length;
        const totalItems = activeList.items.length;
        const hasSynced = !!activeList.airtableId;

        return (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between mb-5 gap-2">
                    <button
                        onClick={() => setActiveListId(null)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full shrink-0"
                    >
                        <ChevronLeft size={18} /> Voltar
                    </button>

                    <div className="flex gap-2 shrink-0">
                        {/* Copy ID — only when synced */}
                        {hasSynced && (
                            <Button variant="outline" size="sm" onClick={handleCopyId}
                                className="h-9 rounded-full px-3 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600">
                                <Copy size={14} className="mr-1.5" /> ID
                            </Button>
                        )}

                        {/* Sincronizar (pull) — only when synced */}
                        {hasSynced && (
                            <Button variant="outline" size="sm" onClick={handleSyncDown} disabled={isSyncingDown}
                                className="h-9 rounded-full px-3 text-blue-500 border-blue-200 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20">
                                {isSyncingDown ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
                                {!isSyncingDown && 'Sincronizar'}
                            </Button>
                        )}

                        {/* Salvar (update same ID) — only when synced */}
                        {hasSynced && (
                            <Button size="sm" onClick={handleSave} disabled={isSaving}
                                className="h-9 rounded-full px-4 bg-blue-500 hover:bg-blue-600 text-white">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1.5" />}
                                {!isSaving && 'Salvar'}
                            </Button>
                        )}

                        {/* Salvar como (create new) — always visible */}
                        {!hasSynced && (
                            <Button size="sm" onClick={handleSaveAs} disabled={isSaving}
                                className="h-9 rounded-full px-4 bg-wd-primary hover:bg-wd-primary-dark text-white">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} className="mr-1.5" />}
                                {!isSaving && 'Salvar como'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sync status badge */}
                {syncLabel && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full mb-4 w-fit">
                        <Cloud size={12} /> {syncLabel}
                    </div>
                )}
                {!hasSynced && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full mb-4 w-fit">
                        <CloudOff size={12} /> Somente local
                    </div>
                )}

                {/* Input */}
                <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm mb-5 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate pr-4">{activeList.title}</h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium shrink-0">{checkedItems} / {totalItems}</span>
                    </div>
                    <form onSubmit={handleAddItem} className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Adicionar produto..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            className="flex-1 h-12 rounded-full px-5 text-base focus-visible:ring-wd-primary"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 bg-wd-primary hover:bg-wd-primary-dark text-white rounded-full hover:scale-105 transition-transform shrink-0 shadow-md">
                            <Plus size={24} />
                        </Button>
                    </form>
                </section>

                {/* Items */}
                <section className="pb-10 flex-1">
                    {isSyncingDown ? (
                        // Skeleton enquanto sincroniza da nuvem
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-4 p-4">
                                        <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                                        <Skeleton className="h-4 flex-1 rounded-full" style={{ width: `${55 + i * 12}%` }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeList.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                            <ShoppingCart size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">A lista est\u00e1 vazia</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Itens</h3>
                                {checkedItems > 0 && (
                                    <button onClick={() => clearChecked(activeList.id)}
                                        className="text-xs text-red-500 font-medium hover:underline">
                                        Limpar Marcados
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col">
                                {activeList.items.map((item, index) => (
                                    <div key={item.id}
                                        className={`flex items-center justify-between p-4 transition-all
                                            ${index !== activeList.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}
                                            ${item.checked ? 'bg-slate-50 dark:bg-slate-900 opacity-60' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <Checkbox
                                                checked={item.checked}
                                                onCheckedChange={() => toggleItem(activeList.id, item.id)}
                                                className="h-6 w-6 rounded-md border-2 data-[state=checked]:bg-wd-primary data-[state=checked]:border-wd-primary data-[state=unchecked]:border-slate-300"
                                            />
                                            <span
                                                onClick={() => toggleItem(activeList.id, item.id)}
                                                className={`text-base flex-1 cursor-pointer transition-all ${item.checked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}
                                            >
                                                {item.text}
                                            </span>
                                        </div>
                                        <button onClick={() => removeItem(activeList.id, item.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        );
    };

    return (
        <>
            <ToastContainer toasts={toasts} />

            <BaseModal id="groceries" title={activeListId ? (activeList?.title ?? 'Lista') : 'Listas de Compras'}>
                <div className="h-full pt-2">
                    {activeListId ? renderDetailView() : renderListView()}
                </div>

                {/* Importar Dialog */}
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogContent className="w-[80vw] sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="text-slate-800 dark:text-slate-100">Importar Lista</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                Cole o ID compartilhado com você para carregar a lista da nuvem.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {isLoadingInit ? (
                                // Skeleton enquanto importa da nuvem
                                <div className="flex flex-col gap-3">
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                    <div className="flex flex-col gap-2 mt-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                                                <Skeleton className="h-4 rounded-full" style={{ width: `${50 + i * 15}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Input
                                    placeholder="ex: recXYZ123456789"
                                    value={importId}
                                    onChange={(e) => setImportId(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                    onKeyDown={(e) => e.key === 'Enter' && handleImportList()}
                                />
                            )}
                        </div>
                        <div className="flex flex-row gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)} className="rounded-full">
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleImportList} disabled={isLoadingInit || !importId.trim()}
                                className="rounded-full bg-wd-primary hover:bg-wd-primary-dark text-white">
                                {isLoadingInit ? <Loader2 size={16} className="animate-spin" /> : 'Importar'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </BaseModal>
        </>
    );
};
