'use client';

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

function Dashboard() {
  const { state } = useFinance();

  return (
    <div className="app">
      <Header />
      <DuplicateModal />

      <main className="main-content">
        <FileUploader />

        {state.parsedFiles.length > 0 && (
          <>
            {state.activeTab === 'dashboard' && (
              <div className="dashboard-view fade-in">
                <AccountSummary />
                <FilterBar />
                <div className="charts-grid">
                  <CategoryChart />
                  <IncomeExpenseChart />
                </div>
                <TimelineChart />
                <TopMerchantsChart />
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
          </>
        )}

        {state.parsedFiles.length === 0 && (
          <div className="welcome-state fade-in">
            <div className="welcome-card">
              <span className="welcome-icon">📊</span>
              <h2>Bem-vindo ao ControlFinance</h2>
              <p>Carregue seus arquivos OFX para começar a analisar suas finanças.</p>
              <div className="welcome-features">
                <div className="welcome-feature">
                  <span>💳</span>
                  <span>Cartão de Crédito</span>
                </div>
                <div className="welcome-feature">
                  <span>🏦</span>
                  <span>Conta Corrente</span>
                </div>
                <div className="welcome-feature">
                  <span>📈</span>
                  <span>Gráficos Interativos</span>
                </div>
                <div className="welcome-feature">
                  <span>🏷️</span>
                  <span>Categorização Automática</span>
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
