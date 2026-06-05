/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Budget, BudgetPeriod } from "./types";

/**
 * Checks if a YYYY-MM-DD date string belongs to the current calendar month.
 */
export function isDateInCurrentMonth(dateStr: string): boolean {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    const [tYear, tMonth] = dateStr.split("-").map(Number);
    if (!tYear || !tMonth) return false;

    return tYear === currentYear && (tMonth - 1) === currentMonth;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a YYYY-MM-DD date string is inside the current calendar week (Monday to Sunday).
 */
export function isDateInCurrentWeek(dateStr: string): boolean {
  try {
    const today = new Date();
    // Get day of week: 0 is Sunday, 1 is Monday...
    const currentDay = today.getDay();
    
    // Calculate distance to previous Monday
    // If today is Sunday (0), distance is 6. Otherwise day - 1.
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [tYear, tMonth, tDay] = dateStr.split("-").map(Number);
    if (!tYear || !tMonth || !tDay) return false;
    
    const checkDate = new Date(tYear, tMonth - 1, tDay);
    
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  } catch (e) {
    return false;
  }
}

/**
 * Utility to calculate total spent and percentage progress for a budget.
 */
export function getBudgetProgress(transactions: Transaction[], budget: Budget): { spent: number; pct: number } {
  let spent = 0;

  transactions.forEach((t) => {
    // Only count expenses of matching category and currency
    if (t.type !== "expense" || t.category !== budget.category || t.currency !== budget.currency) {
      return;
    }

    // Filter by period
    if (budget.period === "monthly" && isDateInCurrentMonth(t.date)) {
      spent += t.amount;
    } else if (budget.period === "weekly" && isDateInCurrentWeek(t.date)) {
      spent += t.amount;
    }
  });

  const pct = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
  return { spent, pct };
}

export interface BudgetAlert {
  category: string;
  type: '80' | '100';
  limitAmount: number;
  spent: number;
  currency: 'ARS' | 'USD';
  period: BudgetPeriod;
}


/**
 * Checks if adding newTx crosses any budget limits.
 * Returns a budget alert if crossed.
 */
export function checkBudgetTrigger(
  existingTransactions: Transaction[],
  newTx: Transaction,
  budgets: Budget[]
): BudgetAlert | null {
  if (newTx.type !== 'expense') return null;

  // Search for budgets matching this category and currency
  const matchedBudgets = budgets.filter(
    (b) => b.category === newTx.category && b.currency === newTx.currency
  );

  for (const budget of matchedBudgets) {
    // 1. Calculate spent before adding newTx
    let spentBefore = 0;
    existingTransactions.forEach((t) => {
      if (t.type !== "expense" || t.category !== budget.category || t.currency !== budget.currency) {
        return;
      }
      if (budget.period === "monthly" && isDateInCurrentMonth(t.date)) {
        spentBefore += t.amount;
      } else if (budget.period === "weekly" && isDateInCurrentWeek(t.date)) {
        spentBefore += t.amount;
      }
    });

    // 2. Spent after adding newTx
    const spentAfter = spentBefore + newTx.amount;

    const pctBefore = budget.limitAmount > 0 ? (spentBefore / budget.limitAmount) * 100 : 0;
    const pctAfter = budget.limitAmount > 0 ? (spentAfter / budget.limitAmount) * 100 : 0;

    // Check crossed thresholds:
    // Crossed 100%
    if (pctBefore < 100 && pctAfter >= 100) {
      return {
        category: budget.category,
        type: '100',
        limitAmount: budget.limitAmount,
        spent: spentAfter,
        currency: budget.currency,
        period: budget.period,
      };
    }
    
    // Crossed 80%
    if (pctBefore < 80 && pctAfter >= 80) {
      return {
        category: budget.category,
        type: '80',
        limitAmount: budget.limitAmount,
        spent: spentAfter,
        currency: budget.currency,
        period: budget.period,
      };
    }
  }

  return null;
}

export interface PredictionAlert {
  budgetId: string;
  category: string;
  period: BudgetPeriod;
  dailyPace: number;
  projectedSpent: number;
  limitAmount: number;
  currency: 'ARS' | 'USD';
  willExceed: boolean;
  exceedsOnDayName?: string; // e.g. "jueves", "el día 22 del mes"
  daysRemainingBeforeBreach?: number;
}

/**
 * Runs a simple predictive simulator over the user's current budgets
 * based on transactions logged during the active period (week / month).
 */
export function getBudgetPredictions(transactions: Transaction[], budgets: Budget[]): PredictionAlert[] {
  const predictions: PredictionAlert[] = [];
  const today = new Date();
  
  // Calculate days passed in current week
  // Sunday is 0, Monday is 1, ..., Saturday is 6
  const currentDayIndex = today.getDay();
  const daysPassedInWeek = currentDayIndex === 0 ? 7 : currentDayIndex;

  // Calculate days passed in current month
  const daysPassedInMonth = today.getDate();

  // Total days in current month
  const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const daysOfWeekNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  budgets.forEach((budget) => {
    const { spent } = getBudgetProgress(transactions, budget);
    
    // If no spending, we cannot predict pace
    if (spent <= 0) {
      return;
    }

    const daysPassed = budget.period === 'weekly' ? daysPassedInWeek : daysPassedInMonth;
    const totalDays = budget.period === 'weekly' ? 7 : totalDaysInMonth;

    // Daily speed/pace of expenses for this categories and currency
    const dailyPace = spent / daysPassed;
    if (dailyPace <= 0) return;

    const projectedSpent = dailyPace * totalDays;
    const willExceed = projectedSpent > budget.limitAmount;

    let exceedsOnDayName = '';
    let daysRemainingBeforeBreach = 0;

    if (willExceed) {
      // If we already exceeded, we don't need a predictive day
      if (spent >= budget.limitAmount) {
        exceedsOnDayName = 'Ya superado';
        daysRemainingBeforeBreach = 0;
      } else {
        const dayNumberDouble = budget.limitAmount / dailyPace;
        const breachDayNumber = Math.ceil(dayNumberDouble);

        if (budget.period === 'weekly') {
          if (breachDayNumber <= 7) {
            exceedsOnDayName = daysOfWeekNames[breachDayNumber - 1] || 'fin de semana';
            daysRemainingBeforeBreach = Math.max(0, breachDayNumber - daysPassed);
          } else {
            exceedsOnDayName = 'la próxima semana';
            daysRemainingBeforeBreach = Math.max(0, breachDayNumber - daysPassed);
          }
        } else {
          // monthly
          if (breachDayNumber <= totalDaysInMonth) {
            exceedsOnDayName = `el día ${breachDayNumber} del mes`;
            daysRemainingBeforeBreach = Math.max(0, breachDayNumber - daysPassed);
          } else {
            exceedsOnDayName = 'el próximo mes';
            daysRemainingBeforeBreach = Math.max(0, breachDayNumber - daysPassed);
          }
        }
      }
    }

    predictions.push({
      budgetId: budget.id,
      category: budget.category,
      period: budget.period,
      dailyPace,
      projectedSpent,
      limitAmount: budget.limitAmount,
      currency: budget.currency as 'ARS' | 'USD',
      willExceed,
      exceedsOnDayName,
      daysRemainingBeforeBreach
    });
  });

  return predictions;
}

