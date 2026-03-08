'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoryChart() {
    const { filteredTransactions, state: { categories }, setFilters } = useFinance();

    const data = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'DEBIT');
        const byCategory = new Map<string, number>();

        for (const t of expenses) {
            if (t.categories.length === 0) continue;
            const splitAmount = Math.abs(t.amount) / t.categories.length;
            for (const c of t.categories) {
                const current = byCategory.get(c.id) || 0;
                byCategory.set(c.id, current + splitAmount);
            }
        }

        return Array.from(byCategory.entries())
            .map(([id, value]) => {
                const cat = categories.find(c => c.id === id)!;
                return { name: cat.name, emoji: cat.emoji, value: Math.round(value * 100) / 100, color: cat.color, id };
            })
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categories]);

    if (data.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleCategoryClick = (categoryId: string) => {
        setFilters({ categories: [categoryId] });
    };

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
            >
                <h3 className="chart-title">Gastos por Categoria</h3>
                <div className="chart-wrapper" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                nameKey="name"
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={110}
                                paddingAngle={3}
                                isAnimationActive={true}
                                animationBegin={600}
                                animationDuration={1200}
                                animationEasing="ease-out"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} stroke="transparent" style={{ cursor: 'pointer', outline: 'none' }} onClick={() => handleCategoryClick(entry.id)} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => formatCurrency(Number(value))}
                                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text)' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value: string) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="category-list">
                    {data.map((item, i) => (
                        <motion.div
                            key={item.id}
                            className="category-list-item"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCategoryClick(item.id)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.3 }}
                        >
                            <div className="category-dot" style={{ background: item.color }} />
                            <span className="category-item-name">
                                <span style={{ filter: 'grayscale(100%)', marginRight: '4px' }}>{item.emoji}</span>
                                {item.name}
                            </span>
                            <span className="category-item-value">{formatCurrency(item.value)}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
