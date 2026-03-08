'use client';

import { useFinance } from '@/lib/store';

export default function AccountSummary() {
    const { state, filteredTransactions, setFilters } = useFinance();

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
            icon: <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
            color: 'var(--color-success)',
            sub: `${filteredTransactions.filter(t => t.type === 'CREDIT').length} entradas`,
            onClick: () => {
                setFilters({ types: ['CREDIT'] });
            }
        },
        {
            label: 'Despesas',
            value: formatCurrency(totalExpense),
            icon: <svg viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
            color: 'var(--color-text)',
            sub: `${filteredTransactions.filter(t => t.type === 'DEBIT').length} saídas`,
            onClick: () => {
                setFilters({ types: ['DEBIT'] });
            }
        },
        {
            label: 'Balanço',
            value: formatCurrency(balance),
            icon: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
            color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            sub: balance >= 0 ? 'STATUS: POSITIVO' : 'STATUS: NEGATIVO',
        },
        {
            label: 'Gasto Médio/Dia',
            value: formatCurrency(avgDailyExpense),
            icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
            color: 'var(--color-accent)',
            sub: `em ${new Set(filteredTransactions.filter(t => t.type === 'DEBIT').map(t => t.date)).size} dias ativos`,
        },
        {
            label: 'Maior Despesa',
            value: formatCurrency(Math.abs(biggestExpense.amount)),
            icon: <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
            color: 'var(--color-warning)',
            sub: biggestExpense.memo.substring(0, 25),
        },
        {
            label: 'Total Transações',
            value: filteredTransactions.length.toString(),
            icon: <svg viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
            color: 'var(--color-info)',
            sub: `${state.parsedFiles.length} ARQUIVOS OFX`,
        },
    ];

    // Per-account saldo cards, grouped by account ID using latest balance
    const uniqueAccountsMap = new Map<string, typeof state.parsedFiles[0]>();
    state.parsedFiles.forEach(f => {
        const existing = uniqueAccountsMap.get(f.account.acctId);
        if (!existing || new Date(f.ledgerBalance.asOfDate) > new Date(existing.ledgerBalance.asOfDate)) {
            uniqueAccountsMap.set(f.account.acctId, f);
        }
    });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    return (
        <div className="summary-grid">
            {cards.map((card, i) => (
                <div key={i} className={`summary-card fade-in stagger-${(i % 4) + 1}`} style={{ '--card-accent': card.color, cursor: card.onClick ? 'pointer' : 'default' } as React.CSSProperties} onClick={card.onClick}>
                    <div className="summary-card-header">
                        <span className="summary-card-label">{card.label}</span>
                        <span className="summary-card-icon">{card.icon}</span>
                    </div>
                    <div className="summary-card-value" style={{ color: card.color }}>{card.value}</div>
                    <div className="summary-card-sub">
                        {card.sub.toUpperCase()}
                    </div>
                </div>
            ))}

            {/* Per-account saldo cards */}
            {uniqueAccounts.map((f, i) => (
                <div key={f.account.acctId} className={`summary-card fade-in stagger-${((i + 6) % 4) + 1}`} style={{ '--card-accent': f.ledgerBalance.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)', cursor: 'pointer' } as React.CSSProperties} onClick={() => { setFilters({ accounts: [f.account.acctId] }); }}>
                    <div className="summary-card-header">
                        <span className="summary-card-label">
                            {f.account.acctType === 'CREDITCARD' ? 'CARTÃO DE CRÉDITO' : 'CONTA CORRENTE'}
                        </span>
                        <span className="summary-card-icon">
                            {f.account.acctType === 'CREDITCARD'
                                ? <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                : <svg viewBox="0 0 24 24"><line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></svg>
                            }
                        </span>
                    </div>
                    <div className="summary-card-value">
                        {formatCurrency(f.ledgerBalance.amount)}
                    </div>
                    <div className="summary-card-sub" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>REF: {f.ledgerBalance.asOfDate.substring(0, 10).split('-').reverse().join('/')}</span>
                        <span>{f.account.org || 'BANCO'}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
