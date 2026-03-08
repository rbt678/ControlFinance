'use client';

import { useFinance } from '@/lib/store';

export default function Header() {
    const { state, setActiveTab, clearAll } = useFinance();
    const tabs: { key: typeof state.activeTab; label: string; icon: string }[] = [
        { key: 'dashboard', label: 'Dashboard', icon: '📊' },
        { key: 'transactions', label: 'Transações', icon: '📋' },
        { key: 'raw', label: 'Dados Raw', icon: '🔍' },
    ];

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <span className="logo-icon">💰</span>
                    <h1 className="logo-text">ControlFinance</h1>
                </div>
                <span className="header-badge">
                    {state.parsedFiles.length} arquivo{state.parsedFiles.length !== 1 ? 's' : ''} · {state.transactions.length} transaç{state.transactions.length !== 1 ? 'ões' : 'ão'}
                </span>
            </div>
            <nav className="header-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`nav-tab ${state.activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
            <div className="header-right">
                {state.parsedFiles.length > 0 && (
                    <button className="btn-clear" onClick={clearAll} title="Limpar todos os dados">
                        🗑️ Limpar
                    </button>
                )}
            </div>
        </header>
    );
}
