/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Sliders, LogOut, Sparkles, Check, HelpCircle, AlertTriangle, 
  CreditCard, Wallet 
} from 'lucide-react';
import { CustomCategory, UserSession } from '../types';

interface SettingsScreenProps {
  onClose: () => void;
  session: UserSession;
  customCategories: CustomCategory[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (id: string) => void;
  onClearTransactions: () => void;
  onLogout: () => void;
  onPreferredCurrencyChange: (currency: 'ARS' | 'USD') => void;
}

export default function SettingsScreen({
  onClose,
  session,
  customCategories,
  onAddCategory,
  onRemoveCategory,
  onClearTransactions,
  onLogout,
  onPreferredCurrencyChange
}: SettingsScreenProps) {
  const [newCatName, setNewCatName] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    // Validar duplicados básicos
    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleClearConfirm = () => {
    onClearTransactions();
    setShowConfirmClear(false);
    alert("Historial financiero de transacciones limpiado con éxito.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" id="settings-screen-modal">
      <motion.div 
        className="w-full max-w-lg bg-[#F2F2F7] text-[#1C1C1E] rounded-t-[32px] shadow-2xl p-7 overflow-y-auto max-h-[92vh] border-t border-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        id="settings-screen-content"
      >
        {/* Header section */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200" id="settings-header">
          <div className="flex items-center gap-2" id="settings-logo">
            <Sliders className="w-5 h-5 text-[#1C1C1E]" />
            <span className="font-display font-bold tracking-tight text-[#1C1C1E] text-base">Ajustes & Preferencias</span>
          </div>
          <button 
            type="button" 
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROFILE RESUME CARD */}
        <div className="my-5 p-5 bg-white border border-white/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex justify-between items-center" id="settings-profile-badge">
          <div className="flex items-center gap-3.5" id="profile-left">
            <div className="w-11 h-11 rounded-full bg-[#1C1C1E] text-white font-sans font-extrabold flex items-center justify-center text-sm shadow-sm" id="avatar">
              {session.name ? session.name.charAt(0) : 'U'}
            </div>
            <div>
              <p className="font-display font-bold text-[#1C1C1E] text-sm">{session.name || 'Usuario Plata'}</p>
              <p className="font-mono text-[10px] text-[#8E8E93] font-bold">{session.username || 'usuario@plata.ai'}</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-trigger-logout"
            onClick={onLogout}
            className="px-4 py-2 bg-[#F2F2F7] hover:bg-[#FF3B30]/10 text-[#8E8E93] hover:text-[#FF3B30] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> <span>Salir</span>
          </button>
        </div>

        {/* PREFERRED CURRENCY SELECTOR */}
        <div className="space-y-3 bg-white p-5 rounded-[24px] border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)]" id="settings-currency-section">
          <span className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider block pl-0.5">Moneda por Defecto del Dashboard</span>
          <p className="text-[11px] text-[#8E8E93] font-medium leading-relaxed pl-0.5">Seleccioná cómo querés que se totalicen tus balances primarios en la pantalla principal de tu billetera.</p>
          
          <div className="grid grid-cols-2 gap-2.5 pt-1" id="dashboard-currency-grid">
            <button
              type="button"
              id="pref-curr-ars"
              onClick={() => onPreferredCurrencyChange('ARS')}
              className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer active:scale-98 ${
                session.preferredCurrency === 'ARS' 
                  ? 'border-[#1C1C1E] bg-[#1C1C1E] text-white font-extrabold shadow' 
                  : 'border-[#E5E5EA] bg-white text-[#8E8E93] hover:bg-[#F2F2F7] font-semibold'
              }`}
            >
              Pesos Argentinos ($ ARS)
            </button>
            <button
              type="button"
              id="pref-curr-usd"
              onClick={() => onPreferredCurrencyChange('USD')}
              className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer active:scale-98 ${
                session.preferredCurrency === 'USD' 
                  ? 'border-[#1C1C1E] bg-[#1C1C1E] text-white font-extrabold shadow' 
                  : 'border-[#E5E5EA] bg-white text-[#8E8E93] hover:bg-[#F2F2F7] font-semibold'
              }`}
            >
              Dólares (u$s USD)
            </button>
          </div>
        </div>

        {/* CUSTOM CATEGORIES MANAGING */}
        <div className="space-y-3 bg-white p-5 rounded-[24px] border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] mt-45" id="settings-categories-section">
          <div className="flex justify-between items-center" id="categories-title">
            <span className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider pl-0.5">Categorías Personalizadas</span>
            <span className="text-[9px] bg-[#F2F2F7] text-[#1C1C1E] font-mono font-bold px-3 py-1 rounded-full border border-neutral-150 uppercase tracking-widest text-[8px]">Custom</span>
          </div>

          {/* Agregar categoria form */}
          <form onSubmit={handleAddCatSubmit} className="flex gap-2" id="add-category-form">
            <input 
              id="input-new-cat"
              type="text" 
              placeholder="Ej: Mascotas, Asados, Gimnasio" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#F2F2F7] border border-transparent rounded-xl text-neutral-800 placeholder-neutral-400 text-xs focus:outline-none focus:bg-white focus:border-[#1C1C1E]"
            />
            <button 
              type="submit"
              id="btn-add-cat"
              className="bg-[#1C1C1E] hover:bg-neutral-800 text-white p-3 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
              title="Añadir Categoría"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </form>

          {/* Listado de custom categories */}
          {customCategories.length === 0 ? (
            <p className="text-[11px] text-[#8E8E93] italic text-center py-2.5 font-sans pl-1">No agregaste ninguna categoría personalizada todavía.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1" id="custom-cat-list">
              {customCategories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="bg-[#F2F2F7] border border-transparent pl-3.5 pr-2 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-[#1C1C1E] font-bold font-sans"
                  id={`cat-custom-box-${cat.id}`}
                >
                  <span>{cat.name}</span>
                  <button 
                    type="button"
                    id={`btn-remove-custom-cat-${cat.id}`}
                    onClick={() => onRemoveCategory(cat.id)}
                    className="p-0.5 text-[#8E8E93] hover:text-[#FF3B30] rounded-full hover:bg-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CLEAR CORE DATABASE TRANSACTION STORAGE */}
        <div className="space-y-3 bg-white p-5 rounded-[24px] border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] mt-4" id="settings-database-section">
          <span className="text-xs font-extrabold text-[#1C1C1E] uppercase tracking-wider block pl-0.5">Almacenamiento Local</span>
          <p className="text-[11px] text-[#8E8E93] pl-0.5 leading-relaxed font-medium">
            Tus datos financieros de transacciones se almacenan directamente en la memoria local de tu navegador para máxima privacidad offline-first al estilo de Apple Health.
          </p>

          <AnimatePresence mode="wait">
            {!showConfirmClear ? (
              <button
                type="button"
                id="btn-clear-db-trigger"
                onClick={() => setShowConfirmClear(true)}
                className="w-full bg-[#FF3B30]/5 hover:bg-[#FF3B30]/10 text-[#FF3B30] py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Borrar todo el historial financiero
              </button>
            ) : (
              <motion.div 
                className="p-4 bg-[#FF3B30]/5 border border-[#FF3B30]/10 rounded-2xl space-y-3.5"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                id="clear-db-confirm-panel"
              >
                <div className="flex gap-2.5 text-rose-800 text-xs" id="clear-warn-text">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#FF3B30]" />
                  <div>
                    <p className="font-extrabold text-[#FF3B30]">¿Estás absolutamente seguro?</p>
                    <p className="mt-1 leading-relaxed text-neutral-600 font-medium">Esta acción vaciará por completo tu base local de datos personales de transacciones. No se puede deshacer.</p>
                  </div>
                </div>

                <div className="flex gap-2" id="clear-db-actions">
                  <button
                    type="button"
                    id="btn-clear-db-cancel"
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 bg-white hover:bg-neutral-105 border border-neutral-200 text-neutral-600 rounded-xl py-2 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    id="btn-clear-db-confirm-action"
                    onClick={onClearTransactions}
                    className="flex-1 bg-[#FF3B30] hover:bg-rose-600 text-white rounded-xl py-2 text-xs font-black cursor-pointer transition-colors shadow-sm"
                  >
                    Sí, limpiar base
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER INFO SYSTEM */}
        <div className="mt-8 flex flex-col items-center justify-center opacity-30 text-[8px] tracking-widest text-[#8E8E93] font-mono space-y-1" id="settings-footer">
          <p>SYSTEM PLATAFORMA PLATA AI v1.0.0-PRO-BETA</p>
          <p>POWERED BY GEMINI & VITE BUNDLER</p>
        </div>
      </motion.div>
    </div>
  );
}
