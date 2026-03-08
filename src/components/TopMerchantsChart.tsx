'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopMerchantsChart() {
    const { filteredTransactions, setFilters } = useFinance();

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

    const handleMerchantClick = (name: string) => {
        setFilters({ search: name });
    };

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3, delay: 0.3 }}
            >
                <h3 className="chart-title">Top 10 Maiores Gastos (Merchant)</h3>
                <div className="merchant-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {data.items.map((item, i) => (
                        <motion.div
                            key={item.name}
                            className="merchant-item"
                            style={{ display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
                            onClick={() => handleMerchantClick(item.name)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i + 0.3, duration: 0.3 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.name} <span style={{ opacity: 0.5, marginLeft: 4 }}>({item.count}x)</span></span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{formatCurrency(item.total)}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(2, (item.total / data.maxTotal) * 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.8 + (i * 0.05) }}
                                    style={{
                                        height: '100%',
                                        background: 'var(--color-warning)',
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
