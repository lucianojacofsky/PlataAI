/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from "./types";

// Genera un ID único simple
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Formateador de moneda argentina o americana con diseño ultra-limpio
export function formatCurrency(amount: number, currency: 'ARS' | 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } else {
    // Pesos Argentinos
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    // Cambiar la separación por algo más estético e idéntico a Apple Wallet
    return formatted.replace("ARS", "$");
  }
}

// Formateador de fechas elegante
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hoy";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  }

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

// Datos de semilla para que el dashboard no empiece vacío
export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    type: "expense",
    amount: 15400,
    currency: "ARS",
    category: "Supermercado",
    merchant: "Carrefour Express",
    date: "2026-05-21",
    description: "Carga de mercadería semanal y gaseosas",
    rawInputType: "voice",
    createdAt: new Date("2026-05-21T09:30:00Z").toISOString(),
  },
  {
    id: "tx-2",
    type: "income",
    amount: 550,
    currency: "USD",
    category: "Freelance",
    merchant: "Upwork Global",
    date: "2026-05-20",
    description: "Pago de desarrollo Frontend de landing page",
    rawInputType: "voice",
    createdAt: new Date("2026-05-20T18:45:00Z").toISOString(),
  },
  {
    id: "tx-3",
    type: "expense",
    amount: 8500,
    currency: "ARS",
    category: "Comida",
    merchant: "Kentucky Pizzería",
    date: "2026-05-20",
    description: "Muzza grande y fainá con amigos",
    rawInputType: "manual",
    createdAt: new Date("2026-05-20T21:15:00Z").toISOString(),
  },
  {
    id: "tx-4",
    type: "expense",
    amount: 32000,
    currency: "ARS",
    category: "Servicios",
    merchant: "Edesur SA",
    date: "2026-05-18",
    description: "Boleta mensual de luz de depto",
    rawInputType: "ocr",
    createdAt: new Date("2026-05-18T11:00:00Z").toISOString(),
  },
  {
    id: "tx-5",
    type: "expense",
    amount: 14.99,
    currency: "USD",
    category: "Suscripciones",
    merchant: "Netflix",
    date: "2026-05-15",
    description: "Débito automático plan familiar UHD",
    rawInputType: "manual",
    createdAt: new Date("2026-05-15T01:10:00Z").toISOString(),
  },
  {
    id: "tx-6",
    type: "income",
    amount: 950000,
    currency: "ARS",
    category: "Sueldo",
    merchant: "Tech Solution S.A.",
    date: "2026-05-01",
    description: "Cobro de haberes mensuales rel. dependecia",
    rawInputType: "manual",
    createdAt: new Date("2026-05-01T08:00:00Z").toISOString(),
  }
];

// Colores sofisticados para categorías al estilo Apple de alta costura
export const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  "Supermercado": { bg: "bg-blue-50/70", text: "text-blue-700", border: "border-blue-100", icon: "ShoppingCart" },
  "Comida": { bg: "bg-orange-50/70", text: "text-orange-700", border: "border-orange-100", icon: "Utensils" },
  "Transporte": { bg: "bg-indigo-50/70", text: "text-indigo-700", border: "border-indigo-100", icon: "Car" },
  "Suscripciones": { bg: "bg-purple-50/70", text: "text-purple-700", border: "border-purple-100", icon: "Tv" },
  "Alquiler": { bg: "bg-neutral-100/70", text: "text-neutral-800", border: "border-neutral-200", icon: "Home" },
  "Salud": { bg: "bg-red-50/70", text: "text-red-700", border: "border-red-100", icon: "HeartPulse" },
  "Entretenimiento": { bg: "bg-pink-50/70", text: "text-pink-700", border: "border-pink-100", icon: "Sparkles" },
  "Inversiones": { bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-100", icon: "TrendingUp" },
  "Freelance": { bg: "bg-cyan-50/70", text: "text-cyan-700", border: "border-cyan-100", icon: "Laptop" },
  "Sueldo": { bg: "bg-teal-50/70", text: "text-teal-700", border: "border-teal-100", icon: "Wallet" },
  "Transferencias": { bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-100", icon: "ArrowLeftRight" },
  "Tarjeta": { bg: "bg-slate-50/70", text: "text-slate-700", border: "border-slate-100", icon: "CreditCard" },
  "Servicios": { bg: "bg-yellow-50/70", text: "text-yellow-700", border: "border-yellow-105", icon: "Zap" },
};

export const DEFAULT_CATEGORY_STYLE = { bg: "bg-gray-50/70", text: "text-gray-700", border: "border-gray-100", icon: "Circle" };
