/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'expense' | 'income';
export type CurrencyType = 'ARS' | 'USD';
export type RawInputType = 'manual' | 'voice' | 'ocr';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  category: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  description: string;
  rawInputType: RawInputType;
  createdAt: string; // ISO String
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string | null;
  name: string | null;
  preferredCurrency: CurrencyType;
}

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
}

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  currency: CurrencyType;
  period: BudgetPeriod;
  createdAt: string; // ISO String
}

export interface CategoryAnalysis {
  category: string;
  amount: number;
  currency: CurrencyType;
  percentage: number;
}

export interface AIAnalysis {
  summary: string;
  savingsTips: string[];
  funnyComment: string; // Chicana argentina graciosa pero motivadora
  timestamp: string;
}

export interface ProcessedInputResult {
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  category: string;
  merchant: string;
  date: string;
  description: string;
}
