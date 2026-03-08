'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useFinance } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

type Grouping = 'day' | 'week' | 'month';

export default function TimelineChart() {
    const { filteredTransactions, setFilters } = useFinance();
    const [groupBy, setGroupBy] = useState<Grouping>('day');
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

    const data = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'DEBIT');
        const grouped = new Map<string, number>();

        for (const t of expenses) {
            let key: string;
            const d = new Date(t.date + 'T12:00:00');

            if (groupBy === 'day') {
                key = t.date;
            } else if (groupBy === 'week') {
                const weekStart = new Date(d);
                weekStart.setDate(d.getDate() - d.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = t.date.substring(0, 7);
            }

            grouped.set(key, (grouped.get(key) || 0) + Math.abs(t.amount));
        }

        return Array.from(grouped.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, total]) => ({
                date: groupBy === 'month' ? date : formatShortDate(date),
                rawDate: date,
                total: Math.round(total * 100) / 100,
            }));
    }, [filteredTransactions, groupBy]);

    if (data.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleDateClick = (rawDate: string) => {
        if (!rawDate) return;
        let dateStart = '';
        let dateEnd = '';

        if (groupBy === 'day') {
            dateStart = rawDate;
            dateEnd = rawDate;
        } else if (groupBy === 'week') {
            const startDate = new Date(rawDate + 'T12:00:00');
            dateStart = rawDate;
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            dateEnd = endDate.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
            const [yearStr, monthStr] = rawDate.split('-');
            const year = parseInt(yearStr, 10);
            const m = parseInt(monthStr, 10);
            const lastDay = new Date(year, m, 0).getDate();
            dateStart = `${rawDate}-01`;
            dateEnd = `${rawDate}-${lastDay.toString().padStart(2, '0')}`;
        }

        setFilters({
            dateStart,
            dateEnd,
            types: ['DEBIT']
        });
    };

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length) {
            handleDateClick(data.activePayload[0].payload.rawDate);
        }
    };

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3, delay: 0.2 }}
            >
                <div className="chart-header">
                    <h3 className="chart-title">Gastos ao Longo do Tempo</h3>
                    <div className="chart-controls">
                        <div className="chart-toggle">
                            {(['day', 'week', 'month'] as Grouping[]).map(g => (
                                <button key={g} className={`toggle-btn ${groupBy === g ? 'active' : ''}`} onClick={() => setGroupBy(g)}>
                                    {g === 'day' ? 'Dia' : g === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>
                        <div className="chart-toggle">
                            <button className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>
                                Barra
                            </button>
                            <button className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
                                Linha
                            </button>
                        </div>
                    </div>
                </div>
                <div className="chart-wrapper" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={data} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value))}
                                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text)' }}
                                    labelStyle={{ color: 'var(--color-text-secondary)' }}
                                />
                                <Bar dataKey="total" fill="var(--color-accent)" radius={[2, 2, 0, 0]} isAnimationActive={true} animationBegin={800} animationDuration={1200} animationEasing="ease-out" onClick={(data: any) => handleDateClick(data?.payload?.rawDate || data?.rawDate)} />
                            </BarChart>
                        ) : (
                            <LineChart data={data} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value))}
                                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text)' }}
                                />
                                <Line type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2} dot={{ fill: 'var(--color-accent)', r: 4 }} activeDot={{ onClick: (_e: any, payload: any) => handleDateClick(payload?.payload?.rawDate), cursor: 'pointer' }} isAnimationActive={true} animationBegin={800} animationDuration={1200} animationEasing="ease-out" />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function formatShortDate(d: string): string {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
}
