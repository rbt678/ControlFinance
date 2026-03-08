'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '@/lib/store';
import { CATEGORIES } from '@/lib/categories';

export default function CategoryChart() {
    const { filteredTransactions } = useFinance();

    const data = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'DEBIT');
        const byCategory = new Map<string, number>();

        for (const t of expenses) {
            const current = byCategory.get(t.category.id) || 0;
            byCategory.set(t.category.id, current + Math.abs(t.amount));
        }

        return Array.from(byCategory.entries())
            .map(([id, value]) => {
                const cat = CATEGORIES.find(c => c.id === id)!;
                return { name: `${cat.emoji} ${cat.name}`, value: Math.round(value * 100) / 100, color: cat.color };
            })
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    if (data.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="chart-card">
            <h3 className="chart-title">Gastos por Categoria</h3>
            <div className="chart-wrapper" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
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
                    <div key={i} className="category-list-item">
                        <div className="category-dot" style={{ background: item.color }} />
                        <span className="category-item-name">{item.name}</span>
                        <span className="category-item-value">{formatCurrency(item.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
