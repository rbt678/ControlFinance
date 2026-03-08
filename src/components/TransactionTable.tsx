'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/store';

export default function TransactionTable() {
    const { filteredTransactions } = useFinance();
    const [sortKey, setSortKey] = useState<'date' | 'amount' | 'memo' | 'category'>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(0);
    const perPage = 20;

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

    const sortIcon = (key: typeof sortKey) => {
        if (sortKey !== key) return ' ↕';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    if (filteredTransactions.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>Nenhuma transação encontrada</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <div className="table-header-info">
                <span>{sorted.length} transaç{sorted.length !== 1 ? 'ões' : 'ão'}</span>
                <span>Página {page + 1} de {totalPages}</span>
            </div>
            <div className="table-scroll">
                <table className="transaction-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('date')} className="sortable">
                                Data{sortIcon('date')}
                            </th>
                            <th onClick={() => handleSort('memo')} className="sortable">
                                Descrição{sortIcon('memo')}
                            </th>
                            <th onClick={() => handleSort('category')} className="sortable">
                                Categoria{sortIcon('category')}
                            </th>
                            <th onClick={() => handleSort('amount')} className="sortable">
                                Valor{sortIcon('amount')}
                            </th>
                            <th>Tipo</th>
                            <th>Conta</th>
                            <th>FITID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(t => (
                            <tr key={t.id} className={t.type === 'CREDIT' ? 'row-credit' : 'row-debit'}>
                                <td className="td-date">{formatDate(t.date)}</td>
                                <td className="td-memo" title={t.memo}>{t.memo}</td>
                                <td>
                                    <span
                                        className="category-badge"
                                        style={{ borderColor: t.category.color, color: t.category.color }}
                                    >
                                        {t.category.emoji} {t.category.name}
                                    </span>
                                </td>
                                <td className={`td-amount ${t.type === 'CREDIT' ? 'positive' : 'negative'}`}>
                                    {formatCurrency(t.amount)}
                                </td>
                                <td>
                                    <span className={`type-badge ${t.type === 'CREDIT' ? 'type-credit' : 'type-debit'}`}>
                                        {t.type === 'CREDIT' ? 'Receita' : 'Despesa'}
                                    </span>
                                </td>
                                <td className="td-account">
                                    {t.accountType === 'CREDITCARD' ? '💳' : '🏦'} {t.accountId.substring(0, 10)}
                                </td>
                                <td className="td-fitid" title={t.fitId}>{t.fitId.substring(0, 8)}...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-page"
                        disabled={page === 0}
                        onClick={() => setPage(0)}
                    >
                        ««
                    </button>
                    <button
                        className="btn-page"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        «
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
                        const pg = startPage + i;
                        if (pg >= totalPages) return null;
                        return (
                            <button
                                key={pg}
                                className={`btn-page ${pg === page ? 'active' : ''}`}
                                onClick={() => setPage(pg)}
                            >
                                {pg + 1}
                            </button>
                        );
                    })}
                    <button
                        className="btn-page"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        »
                    </button>
                    <button
                        className="btn-page"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(totalPages - 1)}
                    >
                        »»
                    </button>
                </div>
            )}
        </div>
    );
}
