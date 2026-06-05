/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Landmark, ShoppingBag, Truck, Calendar, Tag, DollarSign, PenTool } from 'lucide-react';
import { Transaction, TransactionType, CurrencyType } from '../types';
import { generateId } from '../utils';

interface ManualLoggerProps {
  onClose: () => void;
  onSave: (result: Transaction) => void;
  availableCategories: string[];
}

export default function ManualLogger({ onClose, onSave, availableCategories }: ManualLoggerProps) {
  // Estados de carga de datos
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyType>('ARS');
  const [category, setCategory] = useState(availableCategories[0] || 'Supermercado');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, ingresá un monto válido mayor a cero.");
      return;
    }

    const newTx: Transaction = {
      id: "manual-tx-" + generateId(),
      type,
      amount,
      currency,
      category,
      merchant: merchant.trim() || (type === 'expense' ? 'Gasto Manual' : 'Ingreso Manual'),
      date,
      description: description.trim() || 'Movimiento clásico registrado de manera manual',
      rawInputType: 'manual',
      createdAt: new Date().toISOString(),
    };

    onSave(newTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md" id="manual-logger-modal">
      <motion.div 
        className="w-full max-w-lg bg-[#F2F2F7] text-[#1C1C1E] rounded-t-[32px] shadow-2xl p-7 overflow-y-auto max-h-[92vh] border-t border-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        id="manual-logger-content"
      >
        {/* Top Control Bar */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200" id="manual-header">
          <span className="font-display font-extrabold text-[#1C1C1E] tracking-tight text-base">Nuevo Movimiento Manual</span>
          <button 
            type="button" 
            id="btn-close-manual"
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5" id="manual-form">
          
          {/* Segmented control: Expense or Income */}
          <div className="grid grid-cols-2 p-1 bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl" id="manual-type-selector">
            <button
              type="button"
              id="btn-manual-expense"
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${type === 'expense' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
            >
              Gasto (Egreso)
            </button>
            <button
              type="button"
              id="btn-manual-income"
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${type === 'income' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
            >
              Ingreso (Entrada)
            </button>
          </div>

          {/* Amount Display */}
          <div className="text-center py-2 bg-white rounded-[24px] border border-white/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.01)]" id="manual-amount-box">
            <label className="block text-[10px] font-mono tracking-widest text-[#8E8E93] uppercase font-extrabold mb-1.5">Monto de transacción</label>
            <div className="relative inline-flex items-center justify-center pt-1" id="amount-input-group">
              <span className={`text-3xl font-extrabold mr-1.5 ${type === 'expense' ? 'text-[#1C1C1E]' : 'text-[#34C759]'}`}>
                {currency === 'ARS' ? '$' : 'u$s'}
              </span>
              <input
                id="input-manual-amount"
                type="number"
                step="any"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`text-4xl font-sans font-black text-center bg-transparent focus:outline-none w-48 border-b-2 border-transparent focus:border-neutral-200 focus:placeholder-transparent transition-all placeholder-neutral-300 ${type === 'expense' ? 'text-[#1C1C1E]' : 'text-[#34C759]'}`}
                required
                autoFocus
              />
            </div>

            {/* Sub currency toggle */}
            <div className="flex justify-center gap-2 mt-4" id="manual-currency-tabs">
              <button
                type="button"
                id="tab-manual-ars"
                onClick={() => setCurrency('ARS')}
                className={`px-4.5 py-1.5 text-xs font-bold rounded-full transition-all border cursor-pointer ${
                  currency === 'ARS' 
                    ? 'border-[#1C1C1E] bg-[#1C1C1E] text-white' 
                    : 'border-[#E5E5EA] bg-white text-[#8E8E93] hover:bg-[#F2F2F7]'
                }`}
              >
                Pesos ($ ARS)
              </button>
              <button
                type="button"
                id="tab-manual-usd"
                onClick={() => setCurrency('USD')}
                className={`px-4.5 py-1.5 text-xs font-bold rounded-full transition-all border cursor-pointer ${
                  currency === 'USD' 
                    ? 'border-[#1C1C1E] bg-[#1C1C1E] text-white' 
                    : 'border-[#E5E5EA] bg-white text-[#8E8E93] hover:bg-[#F2F2F7]'
                }`}
              >
                Dólares ($ USD)
              </button>
            </div>
          </div>

          {/* Direct Category selector grids */}
          <div className="space-y-2.5" id="manual-category-section">
            <span className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider pl-1">Seleccionar Categoría</span>
            <div className="flex flex-wrap gap-2 pl-0.5" id="manual-categories-grid">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  id={`cat-badge-${cat}`}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    category === cat
                      ? 'bg-[#1C1C1E] text-white border-transparent shadow'
                      : 'bg-white hover:bg-[#E5E5EA] text-[#8E8E93] border-white/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rest of the Inputs */}
          <div className="space-y-4 border-t border-neutral-200 pt-5" id="manual-details-section">
            <div className="grid grid-cols-2 gap-3" id="details-grid">
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] mb-1.5 pl-1">Negocio o Destinatario</label>
                <input
                  id="input-manual-merchant"
                  type="text"
                  placeholder="Ej: Carrefour, Freelance, Nafta"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-transparent rounded-xl text-[#1C1C1E] placeholder-neutral-400 text-xs focus:outline-none focus:border-[#1C1C1E] focus:bg-white transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8E8E93] mb-1.5 pl-1">Fecha</label>
                <input
                  id="input-manual-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-transparent rounded-xl text-[#1C1C1E] text-xs focus:outline-none focus:border-[#1C1C1E] focus:bg-white transition-all font-sans font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8E8E93] mb-1.5 pl-1">Nota o Comentario (Opcional)</label>
              <input
                id="input-manual-desc"
                type="text"
                placeholder="Ej: Compra de regalos para cumple de mamá"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-transparent rounded-xl text-[#1C1C1E] placeholder-neutral-400 text-xs focus:outline-none focus:border-[#1C1C1E] focus:bg-white transition-all font-sans"
              />
            </div>
          </div>

          {/* Save Buttons */}
          <button
            type="submit"
            id="btn-save-manual-tx"
            className="w-full bg-[#1C1C1E] hover:bg-neutral-800 text-white font-display font-black py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] mt-4 cursor-pointer"
          >
            <Check className="w-4.5 h-4.5" /> <span>Registrar en Plata</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
