'use client';

import { useFinance } from '@/lib/store';
import { CATEGORIES } from '@/lib/categories';
import { useState } from 'react';

export default function FilterBar() {
    const { state, setFilters, resetFilters } = useFinance();
    const { filters } = state;
    const [isExpanded, setIsExpanded] = useState(false);

    if (state.parsedFiles.length === 0) return null;

    const accounts = Array.from(new Set(state.transactions.map(t => t.accountId)));

    const handleDateChange = (type: 'dateStart' | 'dateEnd', value: string) => {
        setFilters({ [type]: value || '' });
    };

    const handleAmountChange = (type: 'amountMin' | 'amountMax', value: string) => {
        setFilters({ [type]: value || '' });
    };

    const toggleType = (type: 'CREDIT' | 'DEBIT') => {
        const types = filters.types.includes(type)
            ? filters.types.filter(t => t !== type)
            : [...filters.types, type];
        setFilters({ types });
    };

    const toggleCategory = (categoryId: string) => {
        const categories = filters.categories.includes(categoryId)
            ? filters.categories.filter(c => c !== categoryId)
            : [...filters.categories, categoryId];
        setFilters({ categories });
    };

    const toggleAccount = (accountId: string) => {
        const newAccounts = filters.accounts.includes(accountId)
            ? filters.accounts.filter(a => a !== accountId)
            : [...filters.accounts, accountId];
        setFilters({ accounts: newAccounts });
    };

    const activeFilterCount =
        (filters.search ? 1 : 0) +
        (filters.dateStart || filters.dateEnd ? 1 : 0) +
        (filters.amountMin || filters.amountMax ? 1 : 0) +
        (filters.types.length > 0 ? 1 : 0) +
        filters.categories.length +
        filters.accounts.length;

    return (
        <div className={`filter-bar fade-in stagger-2 ${isExpanded ? 'expanded' : ''}`}>
            <div className="filter-bar-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="filter-header-left">
                    <svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    <h3>Filtros {activeFilterCount > 0 && <span style={{ color: 'var(--color-accent)' }}>({activeFilterCount})</span>}</h3>
                </div>
                {activeFilterCount > 0 && (
                    <button
                        className="btn-reset-filters"
                        onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                    >
                        Limpar Filtros
                    </button>
                )}
            </div>

            <div className="filter-body" style={{ display: isExpanded ? 'block' : 'none' }}>
                <div className="filter-grid">
                    <div className="filter-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Buscar por descrição..."
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Data Início</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filters.dateStart || ''}
                            onChange={(e) => handleDateChange('dateStart', e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Data Fim</label>
                        <input
                            type="date"
                            className="filter-input"
                            value={filters.dateEnd || ''}
                            onChange={(e) => handleDateChange('dateEnd', e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Valor Mínimo</label>
                        <input
                            type="number"
                            className="filter-input"
                            placeholder="R$ 0,00"
                            value={filters.amountMin || ''}
                            onChange={(e) => handleAmountChange('amountMin', e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Valor Máximo</label>
                        <input
                            type="number"
                            className="filter-input"
                            placeholder="R$ 99999"
                            value={filters.amountMax || ''}
                            onChange={(e) => handleAmountChange('amountMax', e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-chips-section">
                    <label>Tipo</label>
                    <div className="filter-chips">
                        <button
                            className={`filter-chip ${filters.types.includes('CREDIT') ? 'active credit' : ''}`}
                            onClick={() => toggleType('CREDIT')}
                        >
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                            Receita
                        </button>
                        <button
                            className={`filter-chip ${filters.types.includes('DEBIT') ? 'active debit' : ''}`}
                            onClick={() => toggleType('DEBIT')}
                        >
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
                            Despesa
                        </button>
                    </div>
                </div>

                <div className="filter-chips-section">
                    <label>Categorias</label>
                    <div className="filter-chips">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`filter-chip ${filters.categories.includes(cat.id) ? 'active' : ''}`}
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <span style={{ filter: 'grayscale(100%)' }}>{cat.emoji}</span> {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-chips-section">
                    <label>Contas</label>
                    <div className="filter-chips">
                        {accounts.map(acct => {
                            const file = state.parsedFiles.find(f => f.account.acctId === acct);
                            const icon = file?.account.acctType === 'CREDITCARD' ? <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> : <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></svg>;
                            return (
                                <button
                                    key={acct}
                                    className={`filter-chip ${filters.accounts.includes(acct) ? 'active' : ''}`}
                                    onClick={() => toggleAccount(acct)}
                                >
                                    {icon} {acct.substring(0, 12)}...
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
