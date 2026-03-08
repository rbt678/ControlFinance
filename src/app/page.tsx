'use client';

import { useState } from 'react';
import { FinanceProvider, useFinance } from '@/lib/store';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import DuplicateModal from '@/components/DuplicateModal';
import AccountSummary from '@/components/AccountSummary';
import FilterBar from '@/components/FilterBar';
import TransactionTable from '@/components/TransactionTable';
import CategoryChart from '@/components/CategoryChart';
import TimelineChart from '@/components/TimelineChart';
import IncomeExpenseChart from '@/components/IncomeExpenseChart';
import TopMerchantsChart from '@/components/TopMerchantsChart';
import RawDataViewer from '@/components/RawDataViewer';
import SettingsTab from '@/components/SettingsTab';

function Dashboard() {
  const { state, setActiveTab } = useFinance();

  const tabs = ['dashboard', 'transactions', 'raw', 'settings'] as const;
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(state.activeTab as typeof tabs[number]);
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  return (
    <div className="app">
      <Header />
      <DuplicateModal />

      <main
        className="main-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <FileUploader />

        {state.parsedFiles.length > 0 && (
          <>
            {state.activeTab === 'dashboard' && (
              <div className="dashboard-view fade-in">
                <AccountSummary />
                <FilterBar />
                <div className="charts-grid-top fade-in stagger-3">
                  <CategoryChart />
                  <IncomeExpenseChart />
                </div>
                <div className="charts-grid-bottom fade-in stagger-4">
                  <TimelineChart />
                  <TopMerchantsChart />
                </div>
              </div>
            )}

            {state.activeTab === 'transactions' && (
              <div className="transactions-view fade-in">
                <FilterBar />
                <TransactionTable />
              </div>
            )}

            {state.activeTab === 'raw' && (
              <div className="raw-view fade-in">
                <RawDataViewer />
              </div>
            )}

            {state.activeTab === 'settings' && (
              <div className="settings-view fade-in">
                <SettingsTab />
              </div>
            )}
          </>
        )}

        {state.parsedFiles.length === 0 && (
          <div className="welcome-state fade-in stagger-2">
            <div className="welcome-card">
              <svg className="welcome-icon" viewBox="0 0 24 24" style={{ width: 48, height: 48, stroke: 'var(--color-accent)', fill: 'none', strokeWidth: 1.5, marginBottom: 24 }}>
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <h2>Signal Control</h2>
              <p>O sistema foi ativado. Inicialize a importação de dados arrastando um arquivo <code>.ofx</code> para a zona demarcada.</p>
              <div className="welcome-features">
                <div className="welcome-feature fade-in stagger-3">
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--color-primary)', fill: 'none', strokeWidth: 1.5 }}>
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>Crédito</span>
                </div>
                <div className="welcome-feature fade-in stagger-3" style={{ animationDelay: '150ms' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--color-primary)', fill: 'none', strokeWidth: 1.5 }}>
                    <line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" />
                  </svg>
                  <span>Corrente</span>
                </div>
                <div className="welcome-feature fade-in stagger-3" style={{ animationDelay: '250ms' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--color-primary)', fill: 'none', strokeWidth: 1.5 }}>
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>Análise DRE</span>
                </div>
                <div className="welcome-feature fade-in stagger-3" style={{ animationDelay: '350ms' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--color-primary)', fill: 'none', strokeWidth: 1.5 }}>
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>Mapeamento</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  );
}
