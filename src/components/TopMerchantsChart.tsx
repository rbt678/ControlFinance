'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '@/lib/store';

export default function TopMerchantsChart() {
    const { filteredTransactions } = useFinance();

    const data = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'DEBIT');
        const byMerchant = new Map<string, { total: number; count: number }>();

        for (const t of expenses) {
            // Normalize merchant name (take first meaningful part)
            let name = t.memo.split(' - ')[0].trim();
            if (name.length > 25) name = name.substring(0, 25) + '…';

            const entry = byMerchant.get(name) || { total: 0, count: 0 };
            entry.total += Math.abs(t.amount);
            entry.count += 1;
            byMerchant.set(name, entry);
        }

        return Array.from(byMerchant.entries())
            .map(([name, vals]) => ({
                name,
                total: Math.round(vals.total * 100) / 100,
                count: vals.count,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [filteredTransactions]);

    if (data.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="chart-card">
            <h3 className="chart-title">Top 10 Maiores Gastos (Merchant)</h3>
            <div className="chart-wrapper" style={{ height: Math.max(300, data.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={160}
                            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        />
                        <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, _: any, props: any) =>
                                [`${formatCurrency(Number(value))} (${props?.payload?.count || 0}x)`, 'Total']
                            }
                            contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                        />
                        <Bar dataKey="total" fill="var(--color-warning)" radius={[0, 4, 4, 0]} animationDuration={800} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
