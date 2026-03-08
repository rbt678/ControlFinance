'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '@/lib/store';

export default function IncomeExpenseChart() {
    const { filteredTransactions } = useFinance();

    const data = useMemo(() => {
        const grouped = new Map<string, { income: number; expense: number }>();

        for (const t of filteredTransactions) {
            const month = t.date.substring(0, 7);
            const entry = grouped.get(month) || { income: 0, expense: 0 };
            if (t.type === 'CREDIT') {
                entry.income += t.amount;
            } else {
                entry.expense += Math.abs(t.amount);
            }
            grouped.set(month, entry);
        }

        return Array.from(grouped.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, vals]) => ({
                month,
                Receita: Math.round(vals.income * 100) / 100,
                Despesa: Math.round(vals.expense * 100) / 100,
            }));
    }, [filteredTransactions]);

    if (data.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="chart-card">
            <h3 className="chart-title">Receita vs Despesa</h3>
            <div className="chart-wrapper" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                        <Tooltip
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                        />
                        <Bar dataKey="Receita" fill="var(--color-success)" radius={[4, 4, 0, 0]} animationDuration={800} />
                        <Bar dataKey="Despesa" fill="var(--color-danger)" radius={[4, 4, 0, 0]} animationDuration={800} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
