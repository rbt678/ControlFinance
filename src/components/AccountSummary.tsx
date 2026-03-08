'use client';

import { useFinance } from '@/lib/store';

export default function AccountSummary() {
    const { state, filteredTransactions } = useFinance();

    if (state.parsedFiles.length === 0) return null;

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = totalIncome - totalExpense;

    const avgDailyExpense = (() => {
        const dates = new Set(filteredTransactions.filter(t => t.type === 'DEBIT').map(t => t.date));
        return dates.size > 0 ? totalExpense / dates.size : 0;
    })();

    const biggestExpense = filteredTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max, { amount: 0, memo: '-' } as { amount: number; memo: string });

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const cards = [
        {
            label: 'Receitas',
            value: formatCurrency(totalIncome),
            icon: '📈',
            color: 'var(--color-success)',
            sub: `${filteredTransactions.filter(t => t.type === 'CREDIT').length} entradas`,
        },
        {
            label: 'Despesas',
            value: formatCurrency(totalExpense),
            icon: '📉',
            color: 'var(--color-danger)',
            sub: `${filteredTransactions.filter(t => t.type === 'DEBIT').length} saídas`,
        },
        {
            label: 'Balanço',
            value: formatCurrency(balance),
            icon: balance >= 0 ? '✅' : '⚠️',
            color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            sub: balance >= 0 ? 'Positivo' : 'Negativo',
        },
        {
            label: 'Gasto Médio/Dia',
            value: formatCurrency(avgDailyExpense),
            icon: '📅',
            color: 'var(--color-accent)',
            sub: `em ${new Set(filteredTransactions.filter(t => t.type === 'DEBIT').map(t => t.date)).size} dias`,
        },
        {
            label: 'Maior Despesa',
            value: formatCurrency(Math.abs(biggestExpense.amount)),
            icon: '🔥',
            color: 'var(--color-warning)',
            sub: biggestExpense.memo.substring(0, 30),
        },
        {
            label: 'Total Transações',
            value: filteredTransactions.length.toString(),
            icon: '🔢',
            color: 'var(--color-info)',
            sub: `${state.parsedFiles.length} arquivo(s)`,
        },
    ];

    return (
        <div className="summary-grid">
            {cards.map((card, i) => (
                <div key={i} className="summary-card" style={{ '--card-accent': card.color } as React.CSSProperties}>
                    <div className="summary-card-header">
                        <span className="summary-card-icon">{card.icon}</span>
                        <span className="summary-card-label">{card.label}</span>
                    </div>
                    <div className="summary-card-value">{card.value}</div>
                    <div className="summary-card-sub">{card.sub}</div>
                </div>
            ))}

            {/* Per-account saldo cards */}
            {state.parsedFiles.map(f => (
                <div key={f.fileName} className="summary-card account-card">
                    <div className="summary-card-header">
                        <span className="summary-card-icon">{f.account.acctType === 'CREDITCARD' ? '💳' : '🏦'}</span>
                        <span className="summary-card-label">
                            {f.account.acctType === 'CREDITCARD' ? 'Cartão de Crédito' : 'Conta Corrente'}
                        </span>
                    </div>
                    <div className="summary-card-value" style={{ color: f.ledgerBalance.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatCurrency(f.ledgerBalance.amount)}
                    </div>
                    <div className="summary-card-sub">
                        Saldo em {f.ledgerBalance.asOfDate} · {f.account.org || 'Banco'}
                    </div>
                </div>
            ))}
        </div>
    );
}
