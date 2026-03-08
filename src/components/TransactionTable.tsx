'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/store';

export default function TransactionTable() {
    const { filteredTransactions } = useFinance();
    const [sortKey, setSortKey] = useState<'date' | 'amount' | 'memo' | 'category'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(0);
    const [expandedMemos, setExpandedMemos] = useState<Set<string>>(new Set());
    const perPage = 20;

    const toggleMemo = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedMemos(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const sorted = useMemo(() => {
        const copy = [...filteredTransactions];
        copy.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'date': cmp = a.date.localeCompare(b.date); break;
                case 'amount': cmp = a.amount - b.amount; break;
                case 'memo': cmp = a.memo.localeCompare(b.memo); break;
                case 'category': cmp = a.category.name.localeCompare(b.category.name); break;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return copy;
    }, [filteredTransactions, sortKey, sortDir]);

    const paginated = sorted.slice(page * perPage, (page + 1) * perPage);
    const totalPages = Math.ceil(sorted.length / perPage);

    const handleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
        setPage(0);
    };

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const formatDate = (d: string) => {
        if (!d) return '-';
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const renderSortIcon = (key: typeof sortKey) => {
        const isActive = sortKey === key;
        const isAsc = sortDir === 'asc';

        return (
            <svg
                viewBox="0 0 24 24"
                style={{
                    width: 14,
                    height: 14,
                    marginLeft: 6,
                    stroke: isActive ? 'var(--color-text)' : 'var(--color-border)',
                    fill: 'none',
                    strokeWidth: 2,
                    verticalAlign: 'text-bottom'
                }}
            >
                {isActive ? (
                    isAsc ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />
                ) : (
                    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                )}
            </svg>
        );
    };

    if (filteredTransactions.length === 0) {
        return (
            <div className="empty-state fade-in stagger-3">
                <svg viewBox="0 0 24 24" style={{ width: 32, height: 32, stroke: 'var(--color-border)', fill: 'none', strokeWidth: 1.5, marginBottom: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                <p>Nenhuma transação encontrada</p>
            </div>
        );
    }

    return (
        <div className="table-container fade-in stagger-3">
            <div className="table-header-info">
                <span>{sorted.length} transaç{sorted.length !== 1 ? 'ões' : 'ão'}</span>
                <span>Página {page + 1} de {totalPages}</span>
            </div>
            <div className="table-scroll">
                <table className="transaction-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} className="sortable">Data{renderSortIcon('date')}</th>
                            <th onClick={() => handleSort('memo')} className="sortable">Descrição{renderSortIcon('memo')}</th>
                            <th onClick={() => handleSort('category')} className="sortable">Categoria{renderSortIcon('category')}</th>
                            <th onClick={() => handleSort('amount')} className="sortable" style={{ textAlign: 'right' }}>Valor{renderSortIcon('amount')}</th>
                            <th>Tipo</th>
                            <th>Conta</th>
                            <th>FITID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(t => (
                            <tr key={t.id} className={t.type === 'CREDIT' ? 'row-credit' : 'row-debit'}>
                                <td className="td-date" data-label="Data">{formatDate(t.date)}</td>
                                <td className={`td-memo ${expandedMemos.has(t.id) ? 'expanded' : ''}`} title={t.memo} data-label="Descrição" onClick={(e) => toggleMemo(t.id, e)}>
                                    <span className="memo-text">{t.memo}</span>
                                    {t.memo.length > 30 && (
                                        <span className="expand-hint">
                                            {expandedMemos.has(t.id) ? 'Menos' : 'Mais'}
                                        </span>
                                    )}
                                </td>
                                <td data-label="Categoria">
                                    <span
                                        className="category-badge"
                                        style={{ borderColor: t.category.color, color: t.category.color }}
                                    >
                                        <span style={{ filter: 'grayscale(100%)' }}>{t.category.emoji}</span> {t.category.name}
                                    </span>
                                </td>
                                <td className={`td-amount ${t.type === 'CREDIT' ? 'positive' : 'negative'}`} data-label="Valor">
                                    {formatCurrency(t.amount)}
                                </td>
                                <td data-label="Tipo">
                                    <span className={`type-badge ${t.type === 'CREDIT' ? 'type-credit' : 'type-debit'}`}>
                                        {t.type === 'CREDIT' ? 'Receita' : 'Despesa'}
                                    </span>
                                </td>
                                <td className="td-account" data-label="Conta">
                                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5, verticalAlign: 'text-bottom', marginRight: 4 }}>
                                        {t.accountType === 'CREDITCARD'
                                            ? <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
                                            : <><line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></>
                                        }
                                    </svg>
                                    {t.accountId === '34674923-9' || t.accountId === '346749239'
                                        ? 'Conta Corrente'
                                        : t.accountId === '5e586deb-3875-476d-b06b-37ff54dabbc4'
                                            ? 'Cartão de Crédito'
                                            : t.accountId.substring(0, 10)
                                    }
                                </td>
                                <td className="td-fitid" title={t.fitId} data-label="FITID">{t.fitId.substring(0, 8)}...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="btn-page" disabled={page === 0} onClick={() => setPage(0)}>««</button>
                    <button className="btn-page" disabled={page === 0} onClick={() => setPage(p => p - 1)}>«</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
                        const pg = startPage + i;
                        if (pg >= totalPages) return null;
                        return (
                            <button key={pg} className={`btn-page ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                                {pg + 1}
                            </button>
                        );
                    })}
                    <button className="btn-page" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>»</button>
                    <button className="btn-page" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»»</button>
                </div>
            )}
        </div>
    );
}
