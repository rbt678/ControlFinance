'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/lib/store';
import { RecurringExpense, detectVariation, groupOccurrencesByMonth } from '@/lib/recurring';

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(mo) - 1]}/${y.slice(2)}`;
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>;

  const w = 80;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
    </svg>
  );
}


// ─── Month pill row ───────────────────────────────────────────────────────────

function MonthPills({ occurrences, allMonths }: { occurrences: RecurringExpense['occurrences']; allMonths: string[] }) {
  const present = new Set(occurrences.map(o => o.month));
  return (
    <div className="recurring-month-pills">
      {allMonths.map(m => (
        <span key={m} className={`month-pill ${present.has(m) ? 'active' : 'absent'}`} title={fmtMonth(m)}>
          {fmtMonth(m)}
        </span>
      ))}
    </div>
  );
}

// ─── Manual Add Form ──────────────────────────────────────────────────────────

function ManualAddForm({ 
  onAdd, 
  onCancel,
  initialExpense 
}: { 
  onAdd: (name: string, amount: number, searchKeyword?: string, excludeKeyword?: string) => void; 
  onCancel: () => void;
  initialExpense?: RecurringExpense;
}) {
  const [name, setName] = useState(initialExpense ? initialExpense.displayName : '');
  const [amount, setAmount] = useState(initialExpense ? (initialExpense.baseAmount ?? initialExpense.averageAmount).toString() : '');
  const [search, setSearch] = useState(initialExpense?.searchKeyword || '');
  const [exclude, setExclude] = useState(initialExpense?.excludeKeyword || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(v) || v <= 0) return;
    onAdd(name.trim(), v, search.trim() || undefined, exclude.trim() || undefined);
  };

  return (
    <motion.form
      className="recurring-manual-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        <input
          id="recurring-manual-name"
          className="recurring-input"
          placeholder="Ex: Aluguel, Academia, Plano de Saúde…"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus={!initialExpense}
        />
        <input
          id="recurring-manual-amount"
          className="recurring-input"
          type="number"
          placeholder="Valor base mensal (R$)"
          min={0}
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        <input
          id="recurring-manual-search"
          className="recurring-input"
          placeholder="Palavras-chave (separadas por vírgula, busca AND)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          id="recurring-manual-exclude"
          className="recurring-input"
          placeholder="Ignorar se contiver (separadas por vírgula, busca OR)"
          value={exclude}
          onChange={e => setExclude(e.target.value)}
        />
      </div>
      <div className="recurring-form-actions">
        <button type="submit" className="recurring-btn-confirm" disabled={!name || !amount}>
          {initialExpense ? 'Salvar Edição' : 'Adicionar'}
        </button>
        <button type="button" className="recurring-btn-dismiss" onClick={onCancel}>Cancelar</button>
      </div>
    </motion.form>
  );
}


// ─── Confirmed Row ────────────────────────────────────────────────────────────

function ConfirmedRow({ expense, onDelete, onEdit }: { expense: RecurringExpense; onDelete: () => void; onEdit?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const grouped = useMemo(() => groupOccurrencesByMonth(expense.occurrences), [expense.occurrences]);
  const values = grouped.map(o => o.amount);
  const variation = detectVariation(expense);
  const isManual = expense.status === 'manual';

  return (
    <motion.div
      className={`recurring-confirmed-row ${expanded ? 'expanded' : ''}`}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="recurring-row-toggle" onClick={() => setExpanded(v => !v)}>
        <div className="recurring-row-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="recurring-row-icon">{isManual ? '✎' : '↻'}</span>
            <span className="recurring-row-name">{expense.displayName}</span>
            {isManual && <span className="recurring-manual-tag">manual</span>}
            {variation.hasVariation && (
              <span className={`recurring-variation-badge ${variation.direction}`}>
                {variation.direction === 'up' ? '↑' : '↓'} {variation.percent}%
              </span>
            )}
          </div>
          {isManual && (expense.searchKeyword || expense.excludeKeyword) && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Busca: {expense.searchKeyword || '*'} {expense.excludeKeyword ? `(Exceto: ${expense.excludeKeyword})` : ''}
            </span>
          )}
        </div>
        <div className="recurring-row-right">
          <Sparkline values={values} color={variation.hasVariation && variation.direction === 'up' ? 'var(--danger)' : 'var(--accent)'} />
          <span className="recurring-row-amount">{fmt(expense.averageAmount)}</span>
          <span className="recurring-row-chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="recurring-row-detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {expense.occurrences.length > 0 ? (
              <div className="recurring-occurrence-list">
                {[...expense.occurrences].sort((a, b) => b.month.localeCompare(a.month)).map((o, i) => (
                  <div key={`${o.month}-${i}`} className="recurring-occurrence-item">
                    <span className="occ-month">{fmtMonth(o.month)}</span>
                    <span className="occ-memo">{o.memo}</span>
                    <span className="occ-amount">{fmt(o.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0 12px 12px' }}>
                Nenhuma ocorrência associada ainda.
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', padding: '0 12px 12px' }}>
              {onEdit && (
                <button
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={onEdit}
                >
                  ✎ Editar Regra
                </button>
              )}
              <button className="recurring-delete-btn" onClick={onDelete}>
                🗑 Remover
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecurringTab() {
  const { state, addManualRecurring, updateRecurring, deleteRecurring, refreshRecurring } = useFinance();
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // We add an effect to recalculate manually edited ones whenever we save a rule.
  // Actually, handleAddManual creates a base one, then we can trigger a refresh manually.
  
  const confirmed = useMemo(() => {
    const all = state.recurringExpenses;
    return all.filter(e => e.status === 'confirmed' || e.status === 'manual');
  }, [state.recurringExpenses]);

  const allMonths = useMemo(() => {
    const months = new Set(state.transactions.map(t => t.date.slice(0, 7)));
    return [...months].sort();
  }, [state.transactions]);

  // Monthly income estimate (average monthly credits)
  const monthlyIncome = useMemo(() => {
    if (state.transactions.length === 0) return 0;
    const credits = state.transactions.filter(t => t.type === 'CREDIT' && t.amount > 0);
    if (credits.length === 0) return 0;
    const byMonth = new Map<string, number>();
    for (const t of credits) {
      const m = t.date.slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + t.amount);
    }
    const totals = [...byMonth.values()];
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }, [state.transactions]);

  const totalCommitment = useMemo(() =>
    confirmed.reduce((sum, e) => sum + e.averageAmount, 0),
    [confirmed]
  );

  const commitmentPct = monthlyIncome > 0 ? Math.min((totalCommitment / monthlyIncome) * 100, 100) : 0;

  const handleAddManual = (name: string, amount: number, searchKeyword?: string, excludeKeyword?: string) => {
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    addManualRecurring({
      id,
      normalizedKey: name.toUpperCase(),
      displayName: name,
      categoryIds: [],
      confidence: 1,
      averageAmount: amount, // will be overridden by refresh if keyword matches
      baseAmount: amount,
      searchKeyword,
      excludeKeyword,
      occurrences: [],
      status: 'manual',
      addedAt: Date.now(),
    });
    setShowManualForm(false);
  };

  const handleEditManual = (id: string, name: string, amount: number, searchKeyword?: string, excludeKeyword?: string) => {
    const expense = confirmed.find(e => e.id === id);
    if (!expense) return;
    updateRecurring({
      ...expense,
      displayName: name,
      normalizedKey: name.toUpperCase(),
      averageAmount: amount, // will be overridden by store reducer if keyword matches
      baseAmount: amount,
      searchKeyword,
      excludeKeyword,
      status: 'manual',
    });
    setEditingExpenseId(null);
  };

  if (state.transactions.length === 0) {
    return (
      <div className="recurring-empty-state">
        <div className="recurring-empty-icon">↻</div>
        <h3>Nenhuma transação importada</h3>
        <p>Importe seus arquivos OFX para detectar gastos recorrentes automaticamente.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="recurring-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Section B: Commitment Map ─────────────────────────────────── */}
      <section className="recurring-section">
        <div className="recurring-section-header">
          <div>
            <h2 className="recurring-section-title">Mapa de Comprometimento</h2>
            <p className="recurring-section-subtitle">
              Gastos fixos confirmados vs. renda mensal estimada
            </p>
          </div>
          <div className="recurring-commitment-total">
            <span className="commitment-value">{fmt(totalCommitment)}</span>
            <span className="commitment-label">/mês comprometido</span>
          </div>
        </div>

        <div className="commitment-bar-wrapper">
          <div className="commitment-bar-track">
            <motion.div
              className={`commitment-bar-fill ${commitmentPct > 80 ? 'danger' : commitmentPct > 60 ? 'warning' : 'safe'}`}
              initial={{ width: 0 }}
              animate={{ width: `${commitmentPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          <div className="commitment-bar-labels">
            <span>{commitmentPct.toFixed(0)}% da renda estimada</span>
            {monthlyIncome > 0 && <span>Renda: {fmt(monthlyIncome)}/mês</span>}
          </div>
        </div>

        {/* Confirmed list */}
        {confirmed.length === 0 && !showManualForm && (
          <p className="recurring-empty-hint">
            Nenhum gasto confirmado ainda. Confirme candidatos abaixo ou adicione manualmente.
          </p>
        )}

        <div className="recurring-confirmed-list">
          <AnimatePresence>
            {confirmed.map(e => (
              editingExpenseId === e.id ? (
                <motion.div key={`edit-${e.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: '12px', marginBottom: '8px' }}>
                  <ManualAddForm 
                    initialExpense={e}
                    onAdd={(name, amount, search, exclude) => handleEditManual(e.id, name, amount, search, exclude)}
                    onCancel={() => setEditingExpenseId(null)}
                  />
                </motion.div>
              ) : (
                <ConfirmedRow
                  key={e.id}
                  expense={e}
                  onDelete={() => deleteRecurring(e.id)}
                  onEdit={() => setEditingExpenseId(e.id)}
                />
              )
            ))}
          </AnimatePresence>
        </div>

        <div className="recurring-add-manual-row">
          <AnimatePresence>
            {showManualForm && (
              <ManualAddForm onAdd={handleAddManual} onCancel={() => setShowManualForm(false)} />
            )}
          </AnimatePresence>
          {!showManualForm && (
            <button
              id="add-manual-recurring-btn"
              className="recurring-add-manual-btn"
              onClick={() => setShowManualForm(true)}
            >
              + Adicionar manualmente
            </button>
          )}
        </div>
      </section>



      {/* ── Section C: Variation History ─────────────────────────────── */}
      {confirmed.some(e => e.occurrences.length >= 2) && (
        <section className="recurring-section">
          <div className="recurring-section-header">
            <div>
              <h2 className="recurring-section-title">Histórico de Variação</h2>
              <p className="recurring-section-subtitle">
                Acompanhe reajustes e tendências nos seus gastos fixos.
              </p>
            </div>
          </div>

          <div className="recurring-variation-grid">
            {confirmed.filter(e => e.occurrences.length >= 2).map(e => {
              const variation = detectVariation(e);
              const grouped = groupOccurrencesByMonth(e.occurrences);
              const values = grouped.map(o => o.amount);

              return (
                <div key={e.id} className="recurring-variation-card">
                  <div className="variation-card-header">
                    <span className="variation-name">{e.displayName}</span>
                    {variation.hasVariation && (
                      <span className={`recurring-variation-badge large ${variation.direction}`}>
                        {variation.direction === 'up' ? '↑' : '↓'} {variation.percent}% vs mês anterior
                      </span>
                    )}
                  </div>
                  <div className="variation-chart-row">
                    <Sparkline
                      values={values}
                      color={variation.hasVariation && variation.direction === 'up' ? 'var(--danger)' : 'var(--accent)'}
                    />
                    <div className="variation-months-list">
                      {grouped.map((o, i) => (
                        <span key={`${o.month}-${i}`} className="variation-month-item">
                          <span className="vm-label">
                            {fmtMonth(o.month)}
                            {o.count > 1 && <span className="vm-count">({o.count})</span>}
                          </span>
                          <span className="vm-value">{fmt(o.amount)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}


    </motion.div>
  );
}
