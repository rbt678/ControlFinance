import { EnrichedTransaction } from './store';

export interface RecurringOccurrence {
  month: string; // 'YYYY-MM'
  amount: number;
  date: string;
  memo: string;      // Stripped version (before full normalization)
  fullMemo: string;  // Raw version (exactly as in OFX)
}

export interface RecurringExpense {
  id: string;
  normalizedKey: string;       // signature used for grouping
  displayName: string;         // user-editable name
  categoryIds: string[];
  confidence: number;          // 0–1
  averageAmount: number;
  occurrences: RecurringOccurrence[];
  status: 'candidate' | 'confirmed' | 'dismissed' | 'manual';
  addedAt: number;
  searchKeyword?: string;
  excludeKeyword?: string;
  baseAmount?: number;
}



// Refreshes occurrences for manual and existing confirmed expenses based on transactions
export function refreshManualRecurring(
  existing: RecurringExpense[],
  transactions: EnrichedTransaction[] = []
): RecurringExpense[] {
  const merged: RecurringExpense[] = [];

  for (const e of existing) {
    if (e.status === 'manual' || e.status === 'confirmed') {
      if (e.searchKeyword) {
        const searchKeywords = e.searchKeyword.split(',').map(k => k.trim().toUpperCase()).filter(k => k.length > 0);
        const excludeKeywords = e.excludeKeyword ? e.excludeKeyword.split(',').map(k => k.trim().toUpperCase()).filter(k => k.length > 0) : [];

        const matched = transactions.filter(t => {
          if (t.type !== 'DEBIT' || t.amount >= 0) return false;
          const memoUpper = t.memo.toUpperCase();
          
          // Must match ALL search keywords (AND)
          if (searchKeywords.length > 0 && !searchKeywords.every(k => memoUpper.includes(k))) return false;
          
          // Must NOT match ANY exclude keyword (OR)
          if (excludeKeywords.length > 0 && excludeKeywords.some(k => memoUpper.includes(k))) return false;
          
          return true;
        });

        if (matched.length > 0) {
          const totalAmount = matched.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          const uniqueMonths = new Set(matched.map(t => t.date.slice(0, 7))).size;
          const averageAmount = uniqueMonths > 0 ? totalAmount / uniqueMonths : 0;

          const occurrences: RecurringOccurrence[] = matched.map(t => ({
            month: t.date.slice(0, 7),
            amount: Math.abs(t.amount),
            date: t.date,
            memo: t.memo, // since generic suffix stripping is removed, we just use raw memo
            fullMemo: t.memo,
          })).sort((a, b) => a.month.localeCompare(b.month));

          merged.push({
            ...e,
            occurrences,
            averageAmount,
            baseAmount: e.baseAmount ?? e.averageAmount
          });
          continue;
        }
      }

      // Fallback: no keyword, or no matches found
      merged.push({
        ...e,
        occurrences: [],
        averageAmount: e.baseAmount ?? e.averageAmount,
        baseAmount: e.baseAmount ?? e.averageAmount
      });
    } else {
      // we only care about manual/confirmed now, candidate/dismissed are excluded
      // this avoids pushing legacy dismissed/candidate ones
    }
  }

  return merged;
}

// Calculates the total monthly commitment from confirmed recurring expenses
export function calcMonthlyCommitment(confirmed: RecurringExpense[]): number {
  return confirmed.reduce((sum, e) => sum + e.averageAmount, 0);
}

// Groups occurrences by month, summing their amounts
export function groupOccurrencesByMonth(occurrences: RecurringOccurrence[]) {
  const byMonth = new Map<string, { amount: number; count: number }>();
  for (const o of occurrences) {
    const existing = byMonth.get(o.month) ?? { amount: 0, count: 0 };
    byMonth.set(o.month, { amount: existing.amount + o.amount, count: existing.count + 1 });
  }
  return Array.from(byMonth.entries())
    .map(([month, data]) => ({ month, amount: data.amount, count: data.count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Detects if a recurring expense's latest monthly amount changed significantly vs previous month
export function detectVariation(expense: RecurringExpense): { hasVariation: boolean; percent: number; direction: 'up' | 'down' | 'none' } {
  const sorted = groupOccurrencesByMonth(expense.occurrences);
  if (sorted.length < 2) return { hasVariation: false, percent: 0, direction: 'none' };

  const last = sorted[sorted.length - 1].amount;
  const prev = sorted[sorted.length - 2].amount;
  if (prev === 0) return { hasVariation: false, percent: 0, direction: 'none' };

  const percent = ((last - prev) / prev) * 100;
  const hasVariation = Math.abs(percent) >= 5;
  return {
    hasVariation,
    percent: Math.round(Math.abs(percent)),
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'none',
  };
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
