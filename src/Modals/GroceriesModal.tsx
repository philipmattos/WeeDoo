import type { FormEvent } from 'react';
import React, { useState } from 'react';
import { BaseModal } from './BaseModal';
import { useGroceryStore } from '../store/groceryStore';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const GroceriesModal = () => {
    const { items, addItem, toggleItem, removeItem, clearChecked } = useGroceryStore();
    const [inputValue, setInputValue] = useState('');

    const handleAddItem = (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        addItem(inputValue.trim());
        setInputValue('');
    };

    const checkedItems = items.filter(i => i.checked).length;
    const totalItems = items.length;

    return (
        <BaseModal id="groceries" title="Minha Lista">

            {/* Header / Input Section */}
            <section className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[#3bbfa0]" />
                        Compras
                    </h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {checkedItems} / {totalItems}
                    </span>
                </div>

                <form onSubmit={handleAddItem} className="flex items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Adicionar produto..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 h-12 rounded-full px-5 text-base focus-visible:ring-[#3bbfa0]"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 bg-[#3bbfa0] hover:bg-[#2fa085] text-white rounded-full transition-transform hover:scale-105 shrink-0 shadow-md"
                    >
                        <Plus size={24} />
                    </Button>
                </form>
            </section>

            {/* List Section */}
            <section className="pb-10">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <ShoppingCart size={48} className="text-slate-200 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">A lista está vazia</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Coloque os itens que precisa comprar.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden text-slate-800 dark:text-slate-100">
                        {/* Seção header interno */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Ítens</h3>
                            {checkedItems > 0 && (
                                <button
                                    onClick={clearChecked}
                                    className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"
                                >
                                    Limpar Marcados
                                </button>
                            )}
                        </div>

                        {/* Itens */}
                        <div className="flex flex-col">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-4 transition-all ${index !== items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                                        } ${item.checked ? 'bg-slate-50 dark:bg-slate-900 opacity-60' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <Checkbox
                                            checked={item.checked}
                                            onCheckedChange={() => toggleItem(item.id)}
                                            className="h-6 w-6 rounded-md border-2 data-[state=checked]:bg-[#3bbfa0] data-[state=checked]:border-[#3bbfa0] data-[state=unchecked]:border-slate-300"
                                        />
                                        <span
                                            onClick={() => toggleItem(item.id)}
                                            className={`text-base flex-1 cursor-pointer transition-all ${item.checked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'
                                                }`}
                                        >
                                            {item.text}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                        title="Remover"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </BaseModal>
    );
};
