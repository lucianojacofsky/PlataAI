/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Sparkles, Wallet, Shield, LayoutDashboard, Settings as SettingsIcon, 
  HelpCircle, CreditCard, LogOut, Bell, X
} from 'lucide-react';

import { Transaction, CustomCategory, UserSession, Budget, BudgetPeriod } from './types';
import { SEED_TRANSACTIONS } from './utils';
import { checkBudgetTrigger, BudgetAlert } from './budgetUtils';

// Componentes
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import AudioLogger from './components/AudioLogger';
import OcrLogger from './components/OcrLogger';
import ManualLogger from './components/ManualLogger';
import SettingsScreen from './components/SettingsScreen';

export default function App() {
  // 1. Estados principales (Persistencia en LocalStorage)
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('plata_ai_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      isAuthenticated: false,
      username: null,
      name: null,
      preferredCurrency: 'ARS'
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('plata_ai_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return SEED_TRANSACTIONS;
  });

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem('plata_ai_custom_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  // Estado del overlay modal activo
  const [activeModal, setActiveModal] = useState<'none' | 'voice' | 'ocr' | 'manual' | 'settings'>('none');

  // Guardar sesión en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('plata_ai_session', JSON.stringify(session));
  }, [session]);

  // Guardar transacciones en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('plata_ai_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Guardar categorías personalizadas en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('plata_ai_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  // 1.1 Presupuestos creados por el usuario
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('plata_ai_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const [activeAlert, setActiveAlert] = useState<BudgetAlert | null>(null);

  // Guardar presupuestos en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('plata_ai_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Solicitar permisos de notificación push Web estándar al iniciar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (e) {
        // Safe check
      }
    }
  }, []);

  // 2. Universo de categorías unificadas (Estándar + Personalizadas)
  const availableCategories = React.useMemo(() => {
    const standard = [
      'Supermercado',
      'Comida',
      'Transporte',
      'Suscripciones',
      'Alquiler',
      'Salud',
      'Entretenimiento',
      'Inversiones',
      'Freelance',
      'Sueldo',
      'Transferencias',
      'Tarjeta',
      'Servicios'
    ];
    const customNames = customCategories.map(c => c.name);
    return [...standard, ...customNames];
  }, [customCategories]);

  // 3. Manejadores de acciones claves
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession({
      isAuthenticated: false,
      username: null,
      name: null,
      preferredCurrency: 'ARS'
    });
    // Limpiamos solo los estados de sesión, mantenemos las transacciones
    setActiveModal('none');
  };

  const handleSaveTransaction = (newTx: Transaction) => {
    // 1. Verificar si este nuevo gasto cruza límites de presupuestos
    if (newTx.type === 'expense') {
      const alertTriggered = checkBudgetTrigger(transactions, newTx, budgets);
      if (alertTriggered) {
        setActiveAlert(alertTriggered);
        
        // Auto-cerrar la notificación flotante iOS tras 7 segundos
        const timer = setTimeout(() => {
          setActiveAlert(null);
        }, 7000);

        // Disparar una notificación Push Web nativa si se otorgó permiso
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const bodyText = alertTriggered.type === '100'
              ? `¡Límite alcanzado! Llegaste al 100% de tu presupuesto de ${alertTriggered.category}. Consumido: ${alertTriggered.spent}.`
              : `¡Atención! Alcanzaste el 80% de tu presupuesto para ${alertTriggered.category}.`;
            new Notification('Alerta de Presupuesto Plata AI 🔔', {
              body: bodyText
            });
          } catch (e) {
            // Error pasivo en sandbox iFrame
          }
        }
      }
    }

    setTransactions(prev => [newTx, ...prev]);
    setActiveModal('none');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddBudget = (category: string, limitAmount: number, period: BudgetPeriod, currency: 'ARS' | 'USD') => {
    const newBudget: Budget = {
      id: "bud-" + Math.random().toString(36).substring(2, 9),
      category,
      limitAmount,
      currency,
      period,
      createdAt: new Date().toISOString()
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const handlePreferredCurrencyChange = (newCurrency: 'ARS' | 'USD') => {
    setSession(prev => ({
      ...prev,
      preferredCurrency: newCurrency
    }));
  };

  const handleAddCategory = (name: string) => {
    // Evitar duplicados no importando mayúsculas/minúsculas
    const exists = availableCategories.some(cat => cat.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("Esa categoría ya existe en la lista.");
      return;
    }

    const newCat: CustomCategory = {
      id: "cat-" + Math.random().toString(36).substring(2, 9),
      name,
      type: 'expense'
    };
    setCustomCategories(prev => [...prev, newCat]);
  };

  const handleRemoveCategory = (id: string) => {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col font-sans antialiased text-[#1C1C1E] selection:bg-[#1C1C1E] selection:text-white" id="applet-primary-layout">
      
      {/* iOS-Style Floating Banner Notification */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-50 bg-white/95 backdrop-blur-md border border-[#E5E5EA] p-4.5 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] flex gap-3.5 items-start pointer-events-auto"
            id="ios-notification-banner"
          >
            {/* Notification icon badge */}
            <div className={`p-2.5 rounded-2xl ${activeAlert.type === '100' ? 'bg-[#FF3B30]/15 text-[#FF3B30]' : 'bg-[#FF9500]/15 text-[#FF9500]'} shadow-sm mt-0.5`} id="notification-icon-wrapper">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>

            {/* Notification content */}
            <div className="flex-1 font-sans" id="notification-text">
              <div className="flex justify-between items-center" id="notif-brand-row">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#8E8E93] font-extrabold">Alerta de Límite</span>
                <span className="text-[8px] text-[#8E8E93] font-bold font-mono">Ahora mismo</span>
              </div>
              <h4 className="font-display font-black text-xs text-[#1C1C1E] mt-1">
                {activeAlert.type === '100' ? '¡LÍMITE EXCEDIDO! 🚨' : '¡PRESUPUESTO AL 80%! ⚠️'}
              </h4>
              <p className="text-xs text-[#55555A] font-bold mt-1 leading-relaxed">
                {activeAlert.type === '100' 
                  ? `Has alcanzado el 100% o del límite para "${activeAlert.category}".`
                  : `Has comprometido el 80% o más de tu límite para "${activeAlert.category}".`
                }
              </p>
              <div className="text-[9px] font-mono text-[#8E8E93] mt-2 bg-[#F2F2F7] px-2.5 py-1 rounded-md inline-block font-extrabold border border-white">
                Margen asignado: {activeAlert.currency === 'ARS' ? '$' : 'u$s'} {activeAlert.limitAmount}
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              id="btn-close-notification"
              onClick={() => setActiveAlert(null)}
              className="p-1.5 hover:bg-[#F2F2F7] text-[#8E8E93] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER PRINCIPAL SEGÚN SESIÓN */}
      <AnimatePresence mode="wait">
        {!session.isAuthenticated ? (
          
          /* A. PANTALLA DE LOG CON TRATAMIENTO DE ESTILO PREMIUM */
          <motion.div
            key="auth-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
            id="auth-view-root"
          >
            <AuthScreen onLoginSuccess={handleLoginSuccess} />
          </motion.div>

        ) : (

          /* B. WORKSPACE DEL CONTENIDO DASHBOARD DE FINANZAS */
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col pb-16"
            id="workspace-view-root"
          >
            {/* Header del Top Navbar para Mobile/Web integration */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6">
              <header className="bg-white/80 backdrop-blur-md border border-white/60 py-4 px-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex justify-between items-center" id="workspace-header">
                <div className="flex items-center gap-3.5" id="header-branding">
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center font-display font-bold text-base shadow-sm" id="branding-badge">
                    P
                  </div>
                  <div>
                    <span className="font-display font-bold tracking-tight text-[#1C1C1E] block text-sm md:text-base leading-none">Plata AI</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-semibold block mt-1">Sleek Apple Wallet Banker</span>
                  </div>
                </div>

                {/* Preferences profile pill quick info */}
                <div className="flex items-center gap-4" id="nav-actions">
                  {/* Visual indicator of secure session */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8E8E93] font-bold" id="secure-indicator">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34C759] animate-pulse" />
                    <span>Syncing & Secure</span>
                  </div>

                  <button
                    type="button"
                    id="btn-nav-trigger-settings"
                    onClick={() => setActiveModal('settings')}
                    className="px-4 py-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-transparent rounded-full transition-all text-xs font-bold tracking-tight text-[#1C1C1E] flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <SettingsIcon className="w-4 h-4 text-[#1C1C1E]" />
                    <span>Ajustes</span>
                  </button>
                </div>
              </header>
            </div>

            {/* DASHBOARD PRINCIPAL */}
            <main className="flex-1" id="workspace-main">
              <Dashboard 
                session={session}
                transactions={transactions}
                budgets={budgets}
                onAddBudget={handleAddBudget}
                onDeleteBudget={handleDeleteBudget}
                availableCategories={availableCategories}
                onAddTransactionClicked={() => setActiveModal('manual')}
                onVoiceLoggerClicked={() => setActiveModal('voice')}
                onOcrLoggerClicked={() => setActiveModal('ocr')}
                onSettingsClicked={() => setActiveModal('settings')}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY DE MODALS EN BASE A SELECCIÓN (AUDIO, OCR, MANUAL, AJUSTES) */}
      <AnimatePresence>
        
        {/* Modal: Dictador por voz Inteligente */}
        {activeModal === 'voice' && (
          <AudioLogger 
            onClose={() => setActiveModal('none')}
            onSave={handleSaveTransaction}
            availableCategories={availableCategories}
          />
        )}

        {/* Modal: Escáner Óptico de Tickets (OCR) */}
        {activeModal === 'ocr' && (
          <OcrLogger 
            onClose={() => setActiveModal('none')}
            onSave={handleSaveTransaction}
            availableCategories={availableCategories}
          />
        )}

        {/* Modal: Registrar manual en formulario */}
        {activeModal === 'manual' && (
          <ManualLogger 
            onClose={() => setActiveModal('none')}
            onSave={handleSaveTransaction}
            availableCategories={availableCategories}
          />
        )}

        {/* Modal: Ajustes y Categorización custom */}
        {activeModal === 'settings' && (
          <SettingsScreen 
            onClose={() => setActiveModal('none')}
            session={session}
            customCategories={customCategories}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
            onClearTransactions={handleClearTransactions}
            onLogout={handleLogout}
            onPreferredCurrencyChange={handlePreferredCurrencyChange}
          />
        )}

      </AnimatePresence>

    </div>
  );
}
