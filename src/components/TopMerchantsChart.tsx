'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/store';

export default function TopMerchantsChart() {
    const { filteredTransactions } = useFinance();

    const data = useMemo(() => {
        const expenses = filteredTransactions.filter((t) => t.type === 'DEBIT');
        const byMerchant = new Map<string, { total: number; count: number }>();
        let maxTotal = 0;

        for (const t of expenses) {
            let name = t.memo.split(' - ')[0].trim();
            if (name.length > 25) name = name.substring(0, 25) + '…';

            const entry = byMerchant.get(name) || { total: 0, count: 0 };
            entry.total += Math.abs(t.amount);
            entry.count += 1;
            byMerchant.set(name, entry);
        }

        const sorted = Array.from(byMerchant.entries())
            .map(([name, vals]) => {
                if (vals.total > maxTotal) maxTotal = vals.total;
                return {
                    name,
                    total: Math.round(vals.total * 100) / 100,
                    count: vals.count,
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return { items: sorted, maxTotal };
    }, [filteredTransactions]);

    if (data.items.length === 0) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="chart-card fade-in stagger-4">
            <h3 className="chart-title">Top 10 Maiores Gastos (Merchant)</h3>
            <div className="merchant-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {data.items.map((item, i) => (
                    <div key={i} className="merchant-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.name} <span style={{ opacity: 0.5, marginLeft: 4 }}>({item.count}x)</span></span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{formatCurrency(item.total)}</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    width: `${Math.max(2, (item.total / data.maxTotal) * 100)}%`,
                                    background: 'var(--color-warning)',
                                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
