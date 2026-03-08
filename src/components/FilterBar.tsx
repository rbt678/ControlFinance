'use client';

import { useFinance } from '@/lib/store';
import { CATEGORIES } from '@/lib/categories';

export default function FilterBar() {
    const { state, setFilters, resetFilters } = useFinance();
    const { filters } = state;

    const accounts = Array.from(new Set(state.transactions.map(t => t.accountId)));

    const hasActiveFilters = filters.dateStart || filters.dateEnd || filters.categories.length > 0 ||
        filters.types.length > 0 || filters.accounts.length > 0 || filters.amountMin ||
        filters.amountMax || filters.search;

    const toggleCategory = (catId: string) => {
        const current = filters.categories;
        setFilters({
            categories: current.includes(catId)
                ? current.filter(c => c !== catId)
                : [...current, catId],
        });
    };

    const toggleType = (type: 'CREDIT' | 'DEBIT') => {
        const current = filters.types;
        setFilters({
            types: current.includes(type)
                ? current.filter(t => t !== type)
                : [...current, type],
        });
    };

    const toggleAccount = (accountId: string) => {
        const current = filters.accounts;
        setFilters({
            accounts: current.includes(accountId)
                ? current.filter(a => a !== accountId)
                : [...current, accountId],
        });
    };

    return (
        <div className="filter-bar">
            <div className="filter-bar-header">
                <h3>🔍 Filtros</h3>
                {hasActiveFilters && (
                    <button className="btn-reset-filters" onClick={resetFilters}>
                        Limpar filtros
                    </button>
                )}
            </div>

            <div className="filter-grid">
                {/* Search */}
                <div className="filter-group">
                    <label>Buscar</label>
                    <input
                        type="text"
                        placeholder="Buscar por descrição..."
                        value={filters.search}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        className="filter-input"
                    />
                </div>

                {/* Date Range */}
                <div className="filter-group">
                    <label>Data início</label>
                    <input
                        type="date"
                        value={filters.dateStart}
                        onChange={(e) => setFilters({ dateStart: e.target.value })}
                        className="filter-input"
                    />
                </div>
                <div className="filter-group">
                    <label>Data fim</label>
                    <input
                        type="date"
                        value={filters.dateEnd}
                        onChange={(e) => setFilters({ dateEnd: e.target.value })}
                        className="filter-input"
                    />
                </div>

                {/* Amount Range */}
                <div className="filter-group">
                    <label>Valor mínimo</label>
                    <input
                        type="number"
                        placeholder="R$ 0,00"
                        value={filters.amountMin}
                        onChange={(e) => setFilters({ amountMin: e.target.value })}
                        className="filter-input"
                        step="0.01"
                    />
                </div>
                <div className="filter-group">
                    <label>Valor máximo</label>
                    <input
                        type="number"
                        placeholder="R$ 99999"
                        value={filters.amountMax}
                        onChange={(e) => setFilters({ amountMax: e.target.value })}
                        className="filter-input"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Transaction Type */}
            <div className="filter-chips-section">
                <label>Tipo</label>
                <div className="filter-chips">
                    <button
                        className={`filter-chip ${filters.types.includes('CREDIT') ? 'active credit' : ''}`}
                        onClick={() => toggleType('CREDIT')}
                    >
                        📈 Receita
                    </button>
                    <button
                        className={`filter-chip ${filters.types.includes('DEBIT') ? 'active debit' : ''}`}
                        onClick={() => toggleType('DEBIT')}
                    >
                        📉 Despesa
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="filter-chips-section">
                <label>Categorias</label>
                <div className="filter-chips">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-chip ${filters.categories.includes(cat.id) ? 'active' : ''}`}
                            onClick={() => toggleCategory(cat.id)}
                            style={filters.categories.includes(cat.id) ? { borderColor: cat.color, background: cat.color + '22' } : {}}
                        >
                            {cat.emoji} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accounts */}
            {accounts.length > 1 && (
                <div className="filter-chips-section">
                    <label>Contas</label>
                    <div className="filter-chips">
                        {accounts.map(acct => {
                            const file = state.parsedFiles.find(f => f.account.acctId === acct);
                            const icon = file?.account.acctType === 'CREDITCARD' ? '💳' : '🏦';
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
            )}
        </div>
    );
}
