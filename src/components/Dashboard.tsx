/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Mic, FileText, Settings, Sparkles, TrendingUp, TrendingDown, 
  Wallet, Search, ArrowRight, ArrowLeftRight, CreditCard, ChevronRight,
  Filter, Calendar, ShoppingCart, HelpCircle, Utensils, Zap, HelpCircle as CircleIcon, Trash2, X
} from 'lucide-react';
import { Transaction, UserSession, Budget, BudgetPeriod, CurrencyType } from '../types';
import { formatCurrency, formatDate, CATEGORY_STYLES, DEFAULT_CATEGORY_STYLE } from '../utils';
import BudgetManager from './BudgetManager';

import * as Icons from 'lucide-react';

interface DashboardProps {
  session: UserSession;
  transactions: Transaction[];
  budgets: Budget[];
  onAddBudget: (category: string, limitAmount: number, period: BudgetPeriod, currency: CurrencyType) => void;
  onDeleteBudget: (id: string) => void;
  availableCategories: string[];
  onAddTransactionClicked: () => void;
  onVoiceLoggerClicked: () => void;
  onOcrLoggerClicked: () => void;
  onSettingsClicked: () => void;
  onDeleteTransaction: (id: string) => void;
}

export default function Dashboard({
  session,
  transactions,
  budgets,
  onAddBudget,
  onDeleteBudget,
  availableCategories,
  onAddTransactionClicked,
  onVoiceLoggerClicked,
  onOcrLoggerClicked,
  onSettingsClicked,
  onDeleteTransaction
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);

  // 1. Cálculos de balances consolidados (ARS y USD)
  const stats = useMemo(() => {
    let balanceARS = 0;
    let balanceUSD = 0;
    let totalIncomeARS = 0;
    let totalExpenseARS = 0;
    let totalIncomeUSD = 0;
    let totalExpenseUSD = 0;

    const categoryMap: Record<string, { ARS: number; USD: number }> = {};

    transactions.forEach(t => {
      const isExpense = t.type === 'expense';
      
      // Agrupar por categorías generales
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { ARS: 0, USD: 0 };
      }

      if (t.currency === 'ARS') {
        if (isExpense) {
          balanceARS -= t.amount;
          totalExpenseARS += t.amount;
          categoryMap[t.category].ARS += t.amount;
        } else {
          balanceARS += t.amount;
          totalIncomeARS += t.amount;
        }
      } else {
        if (isExpense) {
          balanceUSD -= t.amount;
          totalExpenseUSD += t.amount;
          categoryMap[t.category].USD += t.amount;
        } else {
          balanceUSD += t.amount;
          totalIncomeUSD += t.amount;
        }
      }
    });

    return {
      balanceARS,
      balanceUSD,
      totalIncomeARS,
      totalExpenseARS,
      totalIncomeUSD,
      totalExpenseUSD,
      categoryMap
    };
  }, [transactions]);

  // Conversión simulada orientativa para resumen unificado
  const EXCHANGE_RATE = 1100; // 1 USD = 1100 ARS (Simulación MEP / Blue)
  const unifiedBalance = useMemo(() => {
    if (session.preferredCurrency === 'ARS') {
      return stats.balanceARS + (stats.balanceUSD * EXCHANGE_RATE);
    } else {
      return stats.balanceUSD + (stats.balanceARS / EXCHANGE_RATE);
    }
  }, [stats, session.preferredCurrency]);

  const unifiedIncome = useMemo(() => {
    if (session.preferredCurrency === 'ARS') {
      return stats.totalIncomeARS + (stats.totalIncomeUSD * EXCHANGE_RATE);
    } else {
      return stats.totalIncomeUSD + (stats.totalIncomeARS / EXCHANGE_RATE);
    }
  }, [stats, session.preferredCurrency]);

  const unifiedExpense = useMemo(() => {
    if (session.preferredCurrency === 'ARS') {
      return stats.totalExpenseARS + (stats.totalExpenseUSD * EXCHANGE_RATE);
    } else {
      return stats.totalExpenseUSD + (stats.totalExpenseARS / EXCHANGE_RATE);
    }
  }, [stats, session.preferredCurrency]);

  // 2. Filtrado de listado histórico
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  // Lista única de categorías registradas en transacciones reales
  const uniqueCategories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category));
    return Array.from(set);
  }, [transactions]);

  // Renderizador dinámico de íconos según categoría (utilizando Lucide fallback)
  const renderCategoryIcon = (categoryName: string, className = "w-4 h-4") => {
    const styleObj = CATEGORY_STYLES[categoryName] || DEFAULT_CATEGORY_STYLE;
    const IconComponent = (Icons as any)[styleObj.icon] || Icons.CircleDot;
    return <IconComponent className={className} />;
  };

  // 3. Render de gráfico responsive puro en SVG (Evolución de egresos diarios últimos 7 días)
  const svgChartData = useMemo(() => {
    // Agrupar gastos últimos días
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb'];
    const values = days.map((day, ix) => {
      // Simular gastos con distribución según transacciones
      let argTotal = 0;
      transactions.forEach(t => {
        if (t.type === 'expense' && t.currency === 'ARS') {
          // Asocia un índice determinista para armar un gráfico con curvas interesante
          const dayIndex = new Date(t.date).getDay();
          if (dayIndex === ix) {
            argTotal += t.amount;
          }
        }
      });
      return { label: day, amount: argTotal || 1500 * (ix + 1) }; // fallback de curva si no hay datos
    });
    return values;
  }, [transactions]);

  const maxChartVal = useMemo(() => {
    const values = svgChartData.map(d => d.amount);
    return Math.max(...values, 1000);
  }, [svgChartData]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" id="dashboard-root">
      
      {/* 1. SECCIÓN GREETING / HEADER */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4" id="dashboard-header-block">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-[#8E8E93]">Personal Wealth</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E] font-display mt-1" id="greeting-text">
            ¡Hola, {session.name || 'Usuario'}! 👋
          </h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-medium">Viendo tu balance total en tiempo real.</p>
        </div>

        {/* Acciones de Ajustes e Inputs de Entrada Principal */}
        <div className="flex items-center gap-3.5" id="action-header-pills">
          <button
            type="button"
            id="btn-trigger-settings-sc"
            onClick={onSettingsClicked}
            className="p-3 bg-white border border-[#E5E5EA] text-[#1C1C1E] rounded-2xl hover:bg-[#F2F2F7] transition-all shadow-sm cursor-pointer active:scale-95"
            title="Ajustes de Plata AI"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            type="button"
            id="btn-trigger-audio-logger"
            onClick={onVoiceLoggerClicked}
            className="px-5 py-3.5 bg-[#1C1C1E] hover:bg-black text-white rounded-2xl transition-all shadow-md font-bold flex items-center gap-2.5 text-xs active:scale-95 cursor-pointer"
          >
            <Mic className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            <span>Dictar Movimiento</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE BALANCES ESTILO APPLE WALLET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="wealth-cards-grid">
        
        {/* balance Consolidado Unificado Principal */}
        <div 
          className="bg-black text-white rounded-[32px] p-6.5 border border-white/5 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[170px]" 
          id="main-unified-card"
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0)_60%)]" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-white/2 filter blur-xl" />

          <div className="flex justify-between items-start z-10" id="card-util">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-extrabold">Balance Unificado</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/5" id="wal-badge">
              <Wallet className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          <div className="mt-5 z-10" id="card-figures">
            <h3 className="text-3xl font-display font-bold tracking-tight text-white">
              {formatCurrency(unifiedBalance, session.preferredCurrency)}
            </h3>
            <p className="text-[10px] font-mono text-[#8E8E93] font-bold mt-1.5">
              {session.preferredCurrency === 'ARS' 
                ? `Conversión calculada MEP $ ${stats.balanceARS} ARS + u$s ${stats.balanceUSD} USD`
                : `Conversión calculada MEP u$s ${stats.balanceUSD.toFixed(1)} USD + $ ${stats.balanceARS} ARS`
              }
            </p>
          </div>
        </div>

        {/* Ingresos Totales del Período */}
        <div className="bg-white rounded-[32px] p-6.5 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[170px]" id="income-stats-card">
          <div className="flex justify-between items-start" id="inc-card-top">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-extrabold">Ingresos consolidados</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" id="inc-sub"><TrendingUp className="w-4 h-4" /></div>
          </div>

          <div className="mt-5" id="inc-card-bottom">
            <h3 className="text-2xl font-display font-bold tracking-tight text-[#1C1C1E]">
              {formatCurrency(unifiedIncome, session.preferredCurrency)}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8E8E93] font-bold mt-1.5" id="inc-desc">
              <span>$ {stats.totalIncomeARS} ARS</span>
              <span>·</span>
              <span>u$s {stats.totalIncomeUSD} USD</span>
            </div>
          </div>
        </div>

        {/* Egresos Totales del Período */}
        <div className="bg-white rounded-[32px] p-6.5 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[170px]" id="expense-stats-card">
          <div className="flex justify-between items-start" id="exp-card-top">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-extrabold">Egresos consolidados</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center" id="exp-sub"><TrendingDown className="w-4 h-4" /></div>
          </div>

          <div className="mt-5" id="exp-card-bottom">
            <h3 className="text-2xl font-display font-bold tracking-tight text-[#1C1C1E]">
              {formatCurrency(unifiedExpense, session.preferredCurrency)}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8E8E93] font-bold mt-1.5" id="exp-desc">
              <span>$ {stats.totalExpenseARS} ARS</span>
              <span>·</span>
              <span>u$s {stats.totalExpenseUSD} USD</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. BENTO GRID: GRÁFICO DIARIO DE GASTOS Y CATEGORÍAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="bento-visuals-grid">
        
        {/* Panel Izquierdo: Curva de Tendencias de egresos */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-7 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4" id="chart-panel-box">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-bold">Curvas de egresos</span>
            <h3 className="font-display font-bold text-[#1C1C1E] text-sm mt-0.5 pl-0.2">Distribución semanal de gastos ($)</h3>
          </div>

          {/* Gráfico SVG de Barras Interactivas sofisticado */}
          <div className="relative w-full h-44 flex items-end justify-between pt-6 px-2 border-b border-[#F2F2F7]" id="visual-svg-bars">
            {svgChartData.map((d, i) => {
              const barHeightPct = (d.amount / maxChartVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group" id={`bar-container-${i}`}>
                   {/* Tooltip on hover */}
                  <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C1C1E] text-white text-[10px] px-2.5 py-1.5 rounded-xl font-mono font-bold pointer-events-none mb-1 z-10" id="bar-tooltip">
                    {formatCurrency(d.amount, 'ARS')}
                  </div>
                  
                  {/* Interactive Fill Bar */}
                  <div className="w-7 md:w-9 bg-[#F2F2F7] rounded-t-lg overflow-hidden h-full flex items-end relative" id="bar shadow">
                    <motion.div 
                      className="w-full bg-[#1C1C1E] rounded-t-md group-hover:bg-neutral-800 transition-colors"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(barHeightPct, 6)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      id="actual-bar"
                    />
                  </div>

                  <span className="text-[10px] font-sans font-semibold text-[#8E8E93] mt-2">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Categorías Principales con porcentaje */}
        <div className="lg:col-span-5 bg-white rounded-[32px] p-7 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4" id="categories-donut-box">
          <div className="flex justify-between items-center" id="categories-info">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-bold">Gasto consolidado</span>
              <h3 className="font-display font-bold text-[#1C1C1E] text-sm mt-0.5">Top de Categorías</h3>
            </div>
            <span className="text-[9px] bg-[#F2F2F7] text-[#1C1C1E] font-mono font-bold px-2.5 py-1 rounded-full uppercase">ARS</span>
          </div>

          <div className="space-y-3.5 max-h-[175px] overflow-y-auto pr-1" id="categories-gague-list">
            {uniqueCategories.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-10 italic font-sans pl-1">Registrá gastos para agrupar tu progreso.</p>
            ) : (
              uniqueCategories.map((cat) => {
                const spending = stats.categoryMap[cat]?.ARS || 0;
                const totalSpent = stats.totalExpenseARS || 1;
                const percentage = Math.round((spending / totalSpent) * 100) || 0;
                
                const style = CATEGORY_STYLES[cat] || DEFAULT_CATEGORY_STYLE;

                return (
                  <div key={cat} className="space-y-1.5 pl-1" id={`gauge-box-${cat}`}>
                    <div className="flex justify-between items-center text-xs font-sans" id="gauge-numbers">
                      <div className="flex items-center gap-1.5" id="gauge-label">
                        <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`} id="icon-indicator">
                          {renderCategoryIcon(cat, "w-3.5 h-3.5")}
                        </div>
                        <span className="font-bold text-[#1C1C1E]">{cat}</span>
                      </div>
                      <span className="text-[#8E8E93] font-bold">{percentage}% ({formatCurrency(spending, 'ARS')})</span>
                    </div>

                    <div className="w-full bg-[#F2F2F7] rounded-full h-1.5 overflow-hidden font-sans">
                      <motion.div 
                        className={`h-full bg-[#1C1C1E]`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* GESTIÓN DE PRESUPUESTOS Y LÍMITES */}
      <BudgetManager 
        transactions={transactions}
        availableCategories={availableCategories}
        budgets={budgets}
        onAddBudget={onAddBudget}
        onDeleteBudget={onDeleteBudget}
        preferredCurrency={session.preferredCurrency}
      />

      {/* 4. HERRAMIENTAS DE CARGA RÁPIDA (BENTO SHORTCUTS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2" id="quick-actions-bento">
        
        <button
          type="button"
          id="btn-voice-shortcut"
          onClick={onVoiceLoggerClicked}
          className="p-5 bg-gradient-to-br from-amber-400 to-amber-300 text-neutral-950 rounded-[28px] transition-all shadow-md flex flex-col justify-between items-start h-28 group relative overflow-hidden active:scale-[0.98] cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 filter blur-sm scale-150"><Mic className="w-24 h-24 text-neutral-950" /></div>
          <div className="p-2 rounded-xl bg-white/30 text-neutral-950" id="mic-shortcut-icon">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display font-bold text-xs leading-none">Carga por Voz IA</p>
            <p className="text-[10px] text-neutral-800 mt-1 leading-none">Hablá naturalmente al depto</p>
          </div>
        </button>

        <button
          type="button"
          id="btn-ocr-shortcut"
          onClick={onOcrLoggerClicked}
          className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-[28px] transition-all shadow-md flex flex-col justify-between items-start h-28 group relative overflow-hidden active:scale-[0.98] cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 filter blur-sm scale-150"><FileText className="w-24 h-24 text-white" /></div>
          <div className="p-2 rounded-xl bg-white/20 text-white" id="ocr-shortcut-icon">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display font-bold text-xs text-white leading-none">Escanear Ticket OCR</p>
            <p className="text-[10px] text-indigo-100 mt-1 leading-none">Cargar con fotos de recibos</p>
          </div>
        </button>

        <button
          type="button"
          id="btn-manual-shortcut"
          onClick={onAddTransactionClicked}
          className="p-5 border border-[#E5E5EA] bg-white text-[#1C1C1E] rounded-[28px] transition-all shadow-sm flex flex-col justify-between items-start h-28 group hover:bg-neutral-50 active:scale-[0.98] col-span-2 md:col-span-1 cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-[#F2F2F7] text-neutral-800" id="man-shortcut-icon">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display font-bold text-xs text-[#1C1C1E] leading-none">Registro Tradicional</p>
            <p className="text-[10px] text-[#8E8E93] mt-1 leading-none">Formulario numérico clásico</p>
          </div>
        </button>
      </div>

      {/* 5. HISTORIAL DE MOVIMIENTOS Y FILTRADO */}
      <div className="bg-white rounded-[32px] p-7 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4" id="ledger-section">
        
        {/* Toolbar de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 pb-2 border-b border-[#F2F2F7]" id="ledger-controls">
          <div>
            <h3 className="font-display font-bold text-[#1C1C1E] text-base">Historial de Finanzas</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">Tenés registrados {transactions.length} movimientos en total.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto" id="ledger-search-filters">
            {/* Buscador */}
            <div className="relative flex-1 md:w-56 font-sans" id="search-box">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-input"
                type="text"
                placeholder="Buscar negocio, nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F2F2F7] border border-transparent rounded-full pl-9.5 pr-4 py-2.5 text-xs text-[#1C1C1E] placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-[#1C1C1E] transition-all font-sans"
              />
            </div>

            {/* Clasificacion de tipo */}
            <select
              id="filter-type-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#F2F2F7] border border-transparent rounded-full px-4 py-2.5 text-xs text-[#1C1C1E] font-bold focus:outline-none cursor-pointer hover:bg-[#E5E5EA]"
            >
              <option value="all">Tipos (Todos)</option>
              <option value="expense">Solo Egresos</option>
              <option value="income">Solo Ingresos</option>
            </select>
          </div>
        </div>

        {/* LISTADO DE ITEMS CON ANIMACIÓN */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1" id="ledger-list-box pl-1">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.length === 0 ? (
               <motion.div 
                className="py-12 flex flex-col items-center text-center space-y-2 text-neutral-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                id="empty-ledger"
              >
                <div className="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center text-neutral-400" id="empty-icon font-semibold">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-[#1C1C1E] font-sans">No se encontraron movimientos</p>
                  <p className="text-[10px] text-[#8E8E93] mt-1 font-medium">Prueba dictando uno por voz o cambiando los filtros.</p>
                </div>
              </motion.div>
            ) : (
              filteredTransactions.map((t) => {
                const isExpense = t.type === 'expense';
                const styleObj = CATEGORY_STYLES[t.category] || DEFAULT_CATEGORY_STYLE;

                return (
                  <motion.div
                    key={t.id}
                    layoutId={`tx-row-${t.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 bg-[#F2F2F7]/50 hover:bg-[#F2F2F7] border border-[#F2F2F7] rounded-2xl flex justify-between items-center group transition-all cursor-pointer"
                    onClick={() => setSelectedTxDetail(t)}
                    id={`tx-row-element-${t.id}`}
                  >
                    <div className="flex items-center gap-3.5" id="row-left">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styleObj.bg} ${styleObj.text} border ${styleObj.border}`} id="row-icon-container">
                        {renderCategoryIcon(t.category, "w-5 h-5")}
                      </div>

                      {/* Labels */}
                      <div>
                        <div className="flex items-center gap-2" id="row-merchant-row">
                          <span className="font-bold text-[#1C1C1E] text-xs font-sans tracking-tight">{t.merchant}</span>
                          <span className="text-[9px] text-neutral-400 font-mono">·</span>
                          <span className="text-[9px] text-[#8E8E93] font-mono font-bold uppercase tracking-wider">{formatDate(t.date)}</span>
                        </div>
                        <p className="text-[10px] text-[#8E8E93] font-semibold mt-0.5 font-sans truncate max-w-[190px] md:max-w-md">{t.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5" id="row-right">
                      {/* Figure */}
                      <div className="text-right" id="row-figure">
                        <span className={`font-sans font-bold text-xs block ${isExpense ? 'text-[#1C1C1E]' : 'text-[#34C759]'}`}>
                          {isExpense ? '-' : '+'} {formatCurrency(t.amount, t.currency)}
                        </span>
                        {/* Input Indicator badges */}
                        <span className="inline-block text-[8px] font-mono text-[#8E8E93] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-neutral-100/60 mt-1">
                          {t.rawInputType}
                        </span>
                      </div>

                      {/* Delete button wrapper */}
                      <button
                        type="button"
                        id={`btn-delete-row-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevenir trigger de panel detalle
                          onDeleteTransaction(t.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-[#FF3B30] rounded-lg hover:bg-neutral-200 cursor-pointer"
                        title="Borrar transacción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-neutral-300" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* DETALLE COMPACTO MODAL DE CONTROL DE TRANSACCION */}
      <AnimatePresence>
        {selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" id="detail-drawer">
            <motion.div
              className="bg-white rounded-[32px] p-7 w-full max-w-sm shadow-2xl border border-white/50 text-[#1C1C1E]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="detail-box-frame"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#F2F2F7]" id="detail-box-header">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8E8E93] font-bold">Detalle de transacción</span>
                <button 
                  type="button" 
                  id="btn-close-detail"
                  onClick={() => setSelectedTxDetail(null)}
                  className="p-1.5 hover:bg-[#F2F2F7] rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4" id="detail-contents font-sans">
                {/* Visual Circle Category */}
                <div className="flex flex-col items-center text-center space-y-2" id="detail-head-circle">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${CATEGORY_STYLES[selectedTxDetail.category]?.bg || DEFAULT_CATEGORY_STYLE.bg} ${CATEGORY_STYLES[selectedTxDetail.category]?.text || DEFAULT_CATEGORY_STYLE.text} text-xl border shadow-sm`} id="detail-icon">
                    {renderCategoryIcon(selectedTxDetail.category, "w-6 h-6")}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-[#1C1C1E] text-base leading-none">{selectedTxDetail.merchant}</h4>
                    <span className="inline-block mt-2 text-[10px] bg-[#F2F2F7] text-[#1C1C1E] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{selectedTxDetail.category}</span>
                  </div>
                </div>

                {/* Amount display highlight */}
                <div className="text-center py-4 bg-[#F2F2F7] rounded-2xl border border-transparent" id="detail-amt">
                  <span className={`text-3xl font-display font-bold ${selectedTxDetail.type === 'expense' ? 'text-[#1C1C1E]' : 'text-[#34C759]'}`}>
                    {selectedTxDetail.type === 'expense' ? '-' : '+'} {formatCurrency(selectedTxDetail.amount, selectedTxDetail.currency)}
                  </span>
                  <p className="text-[9px] font-mono text-[#8E8E93] tracking-widest mt-1.5 font-bold">TOTAL DE LA TRANSACCIÓN</p>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs font-sans pl-1" id="detail-meta-list">
                  <div className="flex justify-between" id="det-fecha">
                    <span className="text-[#8E8E93] font-semibold">Fecha registrada:</span>
                    <span className="text-[#1C1C1E] font-bold font-mono">{selectedTxDetail.date}</span>
                  </div>
                  <div className="flex justify-between" id="det-canal">
                    <span className="text-[#8E8E93] font-semibold">Método de ingreso:</span>
                    <span className="text-[#1C1C1E] font-mono uppercase tracking-widest text-[10px] font-bold bg-[#E5E5EA] px-2 py-0.5 rounded-full">{selectedTxDetail.rawInputType}</span>
                  </div>
                  <div className="flex flex-col pt-2 border-t border-[#F2F2F7]" id="det-nota">
                    <span className="text-[#8E8E93] font-semibold mb-1">Nota contextual:</span>
                    <p className="text-neutral-700 leading-relaxed bg-[#F2F2F7] p-3 rounded-2xl text-[11px] font-medium">{selectedTxDetail.description}</p>
                  </div>
                </div>
              </div>

              {/* Action delete of detail box */}
              <button
                type="button"
                id="btn-delete-from-detail"
                onClick={() => {
                  onDeleteTransaction(selectedTxDetail.id);
                  setSelectedTxDetail(null);
                }}
                className="w-full bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] py-3.5 rounded-2xl text-xs font-bold tracking-tight transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer active:scale-98"
              >
                <Trash2 className="w-4 h-4" /> Eliminar este registro
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
