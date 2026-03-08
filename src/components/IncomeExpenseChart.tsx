'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function IncomeExpenseChart() {
    const { filteredTransactions, setFilters } = useFinance();

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

    const handleBarClick = (data: any) => {
        if (!data || !data.activePayload || !data.activePayload.length) return;
        const payload = data.activePayload[0].payload;
        const month = payload.month; // e.g., '2023-01'
        const clickedBar = data.activeTooltipIndex;

        // Since recharts onClick returns the data tied to the bar:
        // By examining activePayload, we can determine if Receita or Despesa was clicked if we knew which bar, 
        // but simple click on the group can filter by the month.
        // Actually, Recharts onClick on the whole BarChart gives `data.activePayload`.
        // To precisely know if click was on 'Receita' or 'Despesa', it's better to put onClick on the `<Bar>` itself.
    };

    const handleBarItemClick = (entry: any, index: number, type: 'CREDIT' | 'DEBIT') => {
        const month = entry.month;

        // Month format is YYYY-MM. 
        // Find the last day of the month
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        const lastDay = new Date(year, m, 0).getDate();

        const dateStart = `${month}-01`;
        const dateEnd = `${month}-${lastDay.toString().padStart(2, '0')}`;

        setFilters({
            types: [type],
            dateStart,
            dateEnd,
        });
    };

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3, delay: 0.1 }}
            >
                <h3 className="chart-title">Receita vs Despesa</h3>
                <div className="chart-wrapper" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                            <Tooltip
                                formatter={(value) => formatCurrency(Number(value))}
                                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text)' }}
                            />
                            <Bar dataKey="Receita" fill="var(--color-success)" radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={700} animationDuration={1200} animationEasing="ease-out" style={{ cursor: 'pointer' }} onClick={(entry, index) => handleBarItemClick(entry, index, 'CREDIT')} />
                            <Bar dataKey="Despesa" fill="var(--color-danger)" radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={700} animationDuration={1200} animationEasing="ease-out" style={{ cursor: 'pointer' }} onClick={(entry, index) => handleBarItemClick(entry, index, 'DEBIT')} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
