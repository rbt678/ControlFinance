'use client';

import { useEffect, useState } from 'react';
import { useFinance } from '@/lib/store';

export default function Header() {
    const { state, setActiveTab } = useFinance();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 15);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const tabs: { key: typeof state.activeTab; label: string; icon: React.ReactNode }[] = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
        },
        {
            key: 'transactions',
            label: 'Transações',
            icon: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        },
        {
            key: 'raw',
            label: 'Dados Raw',
            icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        },
        {
            key: 'settings',
            label: 'Configurações',
            icon: <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        },
    ];

    return (
        <header className={`header-container fade-in ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-topbar">
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </span>
                        <h1 className="logo-text">ControlFinance</h1>
                    </div>
                    <span className="header-badge">
                        {state.parsedFiles.length} arquivo{state.parsedFiles.length !== 1 ? 's' : ''} · {state.transactions.length} txs
                    </span>
                </div>
                <nav className="header-nav desktop-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`nav-tab ${state.activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="header-right">
                </div>
            </div>

            <nav className="header-nav mobile-nav">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`nav-tab ${state.activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <div className="tab-content">
                            {tab.icon}
                            <span>{tab.label}</span>
                        </div>
                        <div className="tab-indicator" />
                    </button>
                ))}
            </nav>
        </header>
    );
}
