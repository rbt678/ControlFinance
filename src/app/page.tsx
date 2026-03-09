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
import IntegrationsSection from '@/components/IntegrationsSection';
import { motion, AnimatePresence } from 'framer-motion';

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
      {state.parsedFiles.length > 0 && <Header />}
      <DuplicateModal />

      <main
        className="main-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {state.parsedFiles.length > 0 && (
          <AnimatePresence mode="wait">
            {state.activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="dashboard-view"
              >
                <AccountSummary />
                <FilterBar />
                <div className="charts-grid-top">
                  <CategoryChart />
                  <IncomeExpenseChart />
                </div>
                <div className="charts-grid-bottom">
                  <TimelineChart />
                  <TopMerchantsChart />
                </div>
              </motion.div>
            )}

            {state.activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="transactions-view"
              >
                <FilterBar />
                <TransactionTable />
              </motion.div>
            )}

            {state.activeTab === 'raw' && (
              <motion.div
                key="raw"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="raw-view"
              >
                <RawDataViewer />
              </motion.div>
            )}

            {state.activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="settings-view"
              >
                <SettingsTab />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {state.parsedFiles.length === 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="welcome-container-wrapper"
            >
              <div className="welcome-layout">
                {/* Left Column: Branding & Features */}
                <div className="welcome-hero">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="system-status-badge"
                  >
                    <span className="status-dot"></span>
                    SISTEMA ATIVO & PRONTO
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    Control <span>Finance</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="hero-subtitle"
                  >
                    Plataforma de inteligência financeira. Importe seus arquivos OFX para iniciar o processamento de sinais e visualização de dados com Control Finance.
                  </motion.p>

                  <div className="welcome-features-grid">
                    {[
                      {
                        title: 'Fluxo de Caixa',
                        desc: 'Análise granular de entradas e saídas.',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      },
                      {
                        title: 'DRE Automático',
                        desc: 'Demonstrativo de resultados em tempo real.',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                      },
                      {
                        title: 'Mapeamento',
                        desc: 'Categorização inteligente via regex.',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                      },
                      {
                        title: 'Segurança Local',
                        desc: 'Seus dados nunca saem do navegador.',
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      }
                    ].map((feature, i) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="welcome-feature-card"
                      >
                        {feature.icon}
                        <h3>{feature.title}</h3>
                        <p>{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Upload & Integrations */}
                <div className="welcome-actions">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="action-card"
                  >
                    <FileUploader />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="action-card"
                  >
                    <IntegrationsSection />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
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
