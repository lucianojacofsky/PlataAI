/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Calendar, ShieldAlert, Sparkles, 
  X, Check, AlertCircle, TrendingUp, HelpCircle
} from 'lucide-react';
import { Budget, BudgetPeriod, CurrencyType, Transaction } from '../types';
import { getBudgetProgress, getBudgetPredictions } from '../budgetUtils';
import { formatCurrency, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from '../utils';
import * as Icons from 'lucide-react';

interface BudgetManagerProps {
  transactions: Transaction[];
  availableCategories: string[];
  budgets: Budget[];
  onAddBudget: (category: string, limitAmount: number, period: BudgetPeriod, currency: CurrencyType) => void;
  onDeleteBudget: (id: string) => void;
  preferredCurrency: CurrencyType;
}

export default function BudgetManager({
  transactions,
  availableCategories,
  budgets,
  onAddBudget,
  onDeleteBudget,
  preferredCurrency
}: BudgetManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [category, setCategory] = useState(availableCategories[0] || 'Supermercado');
  const [limitStr, setLimitStr] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [currency, setCurrency] = useState<CurrencyType>(preferredCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitStr);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Ingresá un monto de límite válido mayor a cero.');
      return;
    }

    // Check if a budget for this category and period already exists
    const exists = budgets.some(b => b.category === category && b.period === period);
    if (exists) {
      alert(`Ya tenés un presupuesto asignado para ${category} en período ${period === 'monthly' ? 'Mensual' : 'Semanal'}.`);
      return;
    }

    onAddBudget(category, parsedLimit, period, currency);
    setLimitStr('');
    setIsAdding(false);
  };

  // Render Category Icon fallback
  const renderCatIcon = (categoryName: string, className = "w-4 h-4") => {
    const styleObj = CATEGORY_STYLES[categoryName] || DEFAULT_CATEGORY_STYLE;
    const IconComponent = (Icons as any)[styleObj.icon] || Icons.CircleDot;
    return <IconComponent className={className} />;
  };

  // Calculate prediction data
  const predictions = useMemo(() => {
    return getBudgetPredictions(transactions, budgets);
  }, [transactions, budgets]);

  // Calculate stats for each budget
  const budgetData = useMemo(() => {
    return budgets.map(budget => {
      const { spent, pct } = getBudgetProgress(transactions, budget);
      const isOver80 = pct >= 80 && pct < 100;
      const isOver100 = pct >= 100;
      
      let statusColor = "bg-[#34C759]"; // Green
      let statusText = "Encima del límite";
      let statusType: 'normal' | 'warn' | 'danger' = 'normal';

      if (isOver100) {
        statusColor = "bg-[#FF3B30]"; // Red
        statusText = "Excedido";
        statusType = 'danger';
      } else if (isOver80) {
        statusColor = "bg-[#FF9500]"; // Amber
        statusText = "Próximo al límite (80%+)";
        statusType = 'warn';
      } else {
        statusText = "Controlado";
        statusType = 'normal';
      }

      return {
        ...budget,
        spent,
        pct: Math.min(pct, 100), // Cap pct at 100 for purely visual filling
        realPct: Math.round(pct),
        statusText,
        statusColor,
        statusType
      };
    });
  }, [budgets, transactions]);

  return (
    <div className="w-full bg-white rounded-[32px] p-7 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6" id="budget-manager-root">
      
      {/* Header and Toggle Button */}
      <div className="flex justify-between items-center" id="budget-header">
        <div className="flex items-center gap-2.5" id="budget-title">
          <div className="w-9 h-9 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] flex items-center justify-center font-bold text-base shadow-sm" id="budget-icon">
            <Calendar className="w-4.5 h-4.5 text-[#34C759]" />
          </div>
          <div>
            <span className="font-display font-black text-[#1C1C1E] tracking-tight block text-sm">Presupuestos y Límites</span>
            <span className="text-[9px] font-mono uppercase text-[#8E8E93] tracking-widest font-bold">Planificación Activa</span>
          </div>
        </div>

        {!isAdding ? (
          <button
            type="button"
            id="btn-add-budget-toggle"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Límite</span>
          </button>
        ) : (
          <button
            type="button"
            id="btn-add-budget-close"
            onClick={() => setIsAdding(false)}
            className="p-2 hover:bg-[#F2F2F7] rounded-full text-[#8E8E93] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Slide-Down Form for Adding a Budget */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            id="add-budget-form-container"
          >
            <form onSubmit={handleSubmit} className="bg-[#F2F2F7] p-5 rounded-[24px] border border-transparent space-y-4 shadow-inner" id="add-budget-form">
              <span className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black pl-0.5 mb-1">
                Configurar Nuevo Límite
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="budget-fields-row1">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5 pl-1">Categoría</label>
                  <select
                    id="select-budget-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-transparent rounded-xl px-3.5 py-2.5 text-xs text-[#1C1C1E] font-bold focus:outline-none focus:border-[#1C1C1E]"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period Selector (monthly or weekly) */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5 pl-1">Período de Alerta</label>
                  <div className="grid grid-cols-2 p-1 bg-white rounded-xl border border-white/60" id="period-tabs">
                    <button
                      type="button"
                      id="btn-period-weekly"
                      onClick={() => setPeriod('weekly')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === 'weekly' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      id="btn-period-monthly"
                      onClick={() => setPeriod('monthly')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === 'monthly' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                    >
                      Mensual
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="budget-fields-row2">
                {/* Limit Amount */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5 pl-1">Monto Límite</label>
                  <div className="relative flex items-center" id="budget-amount-input-group">
                    <span className="absolute left-3.5 text-xs font-bold text-[#8E8E93]">
                      {currency === 'ARS' ? '$' : 'u$s'}
                    </span>
                    <input
                      id="input-budget-limit"
                      type="number"
                      placeholder="0"
                      min="1"
                      value={limitStr}
                      onChange={(e) => setLimitStr(e.target.value)}
                      className="w-full pl-8.5 pr-4 py-2.5 bg-white border border-transparent rounded-xl text-[#1C1C1E] placeholder-neutral-400 text-xs focus:outline-none focus:border-[#1C1C1E] font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Currency Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1C1E] mb-1.5 pl-1">Moneda</label>
                  <div className="grid grid-cols-2 p-1 bg-white rounded-xl border border-white/60" id="currency-tabs-budget">
                    <button
                      type="button"
                      id="btn-currency-ars-budget"
                      onClick={() => setCurrency('ARS')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currency === 'ARS' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                    >
                      ARS ($)
                    </button>
                    <button
                      type="button"
                      id="btn-currency-usd-budget"
                      onClick={() => setCurrency('USD')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${currency === 'USD' ? 'bg-[#1C1C1E] text-white shadow' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="btn-save-budget"
                className="w-full bg-[#1C1C1E] hover:bg-black text-white font-display font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow active:scale-[0.98] cursor-pointer mt-2"
              >
                <Check className="w-4 h-4 text-[#34C759]" />
                <span>Registrar Presupuesto</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budgets Visual List */}
      <div className="space-y-4" id="budget-items-list">
        {budgetData.length === 0 ? (
          <div className="text-center py-8 bg-[#F2F2F7]/40 rounded-2xl border border-dashed border-[#E5E5EA] text-[#8E8E93] font-sans" id="empty-budgets-view">
            <ShieldAlert className="w-8 h-8 text-neutral-300 mx-auto mb-2 animate-pulse" />
            <p className="text-xs font-bold text-[#1C1C1E]">No hay presupuestos activos</p>
            <p className="text-[10px] text-[#8E8E93] mt-1 pr-4 pl-4 font-medium max-w-xs mx-auto">
              Crea metas limitadoras para cuidar tus ahorros. El sistema te alertará automáticamente al llegar al 80% y 100%.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="budget-items-grid">
            <AnimatePresence mode="popLayout">
              {budgetData.map((budget) => {
                const styleObj = CATEGORY_STYLES[budget.category] || DEFAULT_CATEGORY_STYLE;

                return (
                  <motion.div
                    key={budget.id}
                    layoutId={`budget-card-${budget.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5.5 bg-[#F2F2F7]/50 border border-[#F2F2F7] rounded-[24px] flex flex-col justify-between hover:bg-[#F2F2F7] transition-all relative group"
                    id={`budget-card-element-${budget.id}`}
                  >
                    <div id="card-top">
                      {/* Title & Icon Header */}
                      <div className="flex justify-between items-start" id="bct-head">
                        <div className="flex items-center gap-3" id="bct-left">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styleObj.bg} ${styleObj.text} border ${styleObj.border}`} id="bct-icon-box">
                            {renderCatIcon(budget.category, "w-4.5 h-4.5")}
                          </div>
                          <div>
                            <span className="font-bold text-[#1C1C1E] text-xs font-sans tracking-tight block">
                              {budget.category}
                            </span>
                            <span className="text-[8px] font-mono tracking-widest font-extrabold text-[#8E8E93] uppercase block mt-0.5">
                              {budget.period === 'monthly' ? 'Mensual' : 'Semanal'}
                            </span>
                          </div>
                        </div>

                        {/* Delete button (hidden on non-hover by default in desktop, visible on mobile) */}
                        <button
                          type="button"
                          id={`btn-delete-budget-${budget.id}`}
                          onClick={() => onDeleteBudget(budget.id)}
                          className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-neutral-200/50 rounded-full cursor-pointer transition-colors"
                          title="Borrar presupuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Spend vs Limit figures */}
                      <div className="mt-4 flex justify-between items-baseline" id="bct-figures">
                        <span className="text-xs font-semibold text-[#8E8E93] font-sans">Gastado</span>
                        <div className="text-right" id="bct-figure-box">
                          <span className="text-sm font-black text-[#1C1C1E] font-sans">
                            {formatCurrency(budget.spent, budget.currency)}
                          </span>
                          <span className="text-[10px] text-[#8E8E93] font-bold">
                            {' '}de {formatCurrency(budget.limitAmount, budget.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Sleek Progress Bar */}
                      <div className="mt-3.5 space-y-2" id="bct-bar-block">
                        <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-white/50 relative shadow-inner">
                          <motion.div 
                            className={`h-full ${budget.statusColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${budget.pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            id="filled-progress-bar"
                          />
                        </div>

                        {/* Alert Badges */}
                        <div className="flex justify-between items-center text-[9px] font-mono" id="bct-badges">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            budget.statusType === 'danger' 
                              ? 'bg-[#FF3B30]/10 text-[#FF3B30]' 
                              : budget.statusType === 'warn'
                                ? 'bg-[#FF9500]/10 text-[#FF9500]'
                                : 'bg-[#34C759]/10 text-[#34C759]'
                          }`}>
                            {budget.statusText}
                          </span>
                          <span className="font-extrabold text-[#1C1C1E]">
                            {budget.realPct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Intelligent AI Predictions Sub-Panel */}
      {budgets.length > 0 && (
        <div className="pt-5.5 border-t border-neutral-100 space-y-3.5" id="budget-predictions-panel">
          <div className="flex items-center gap-2" id="predictions-title">
            <Sparkles className="w-4 h-4 text-[#34C759] animate-pulse" />
            <h4 className="text-[10px] font-black tracking-widest text-[#1C1C1E] font-mono uppercase">Predicciones de Consumo Inteligente</h4>
          </div>

          <div className="space-y-2.5" id="predictions-list">
            {predictions.map((p) => {
              const formattedPace = formatCurrency(p.dailyPace, p.currency);
              const formattedProjected = formatCurrency(p.projectedSpent, p.currency);
              const formattedLimit = formatCurrency(p.limitAmount, p.currency);

              return (
                <div 
                  key={`pred-${p.budgetId}`}
                  className={`p-4 rounded-2xl border text-xs font-sans transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    p.willExceed 
                      ? 'bg-[#FF3B30]/5 border-[#FF3B30]/10 text-[#1C1C1E]' 
                      : 'bg-[#34C759]/5 border-[#34C759]/10 text-[#1C1C1E]'
                  }`}
                  id={`pred-item-${p.budgetId}`}
                >
                  <div className="flex items-start gap-2.5" id={`pred-body-left-${p.budgetId}`}>
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${p.willExceed ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#34C759]/10 text-[#34C759]'}`}>
                      {p.willExceed ? <AlertCircle className="w-4.5 h-4.5" /> : <TrendingUp className="w-4.5 h-4.5" />}
                    </div>
                    <div>
                      <p className="font-black text-[#1C1C1E] flex items-center gap-1.5 text-xs">
                        <span>{p.category}</span>
                        <span className="text-[8px] font-mono uppercase bg-neutral-200/50 px-1.5 py-0.5 rounded-md text-[#8E8E93] font-black">
                          {p.period === 'weekly' ? 'Semanal' : 'Mensual'}
                        </span>
                      </p>
                      
                      {p.willExceed ? (
                        <p className="text-[11px] text-[#55555A] mt-1 font-medium leading-relaxed">
                          Si seguís gastando a un ritmo de <strong className="font-bold text-[#1C1C1E]">{formattedPace} por día</strong>, vas a superar tu límite de {formattedLimit} <strong className="text-[#FF3B30] font-black leading-none">{p.exceedsOnDayName === 'Ya superado' ? '¡ya mismo! (límite superado)' : `el próximo ${p.exceedsOnDayName}`}</strong>.
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#55555A] mt-1 font-medium leading-relaxed">
                          ¡Vas a un ritmo excelente! Tu promedio diario es de <strong className="font-bold text-[#1C1C1E]">{formattedPace}</strong>, proyectando un gasto total de {formattedProjected} al terminar el período (por debajo de tu límite de {formattedLimit}).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Micro indicator badge */}
                  <div className="text-right shrink-0 font-mono text-[9px]" id={`pred-badge-right-${p.budgetId}`}>
                    <span className={`px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                      p.willExceed 
                        ? 'bg-[#FF3B30]/10 text-[#FF3B30]' 
                        : 'bg-[#34C759]/10 text-[#34C759]'
                    }`}>
                      {p.willExceed ? 'Alerta Ritmo' : 'Ritmo Sano'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
