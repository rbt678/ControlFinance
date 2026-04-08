'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/lib/store';
import { RecurringExpense, RecurringOccurrence, detectVariation, groupOccurrencesByMonth } from '@/lib/recurring';
import RecurringModal from './RecurringModal';

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(mo) - 1]}/${y.slice(2)}`;
};

const fmtWeekday = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color = 'var(--color-accent)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>NO_SIGNAL</span>;

  const w = 80;
  const h = 28;
  const py = 6; // slightly more padding for clarity
  const min = Math.min(...values);
  const max = Math.max(...values);
  const hasRange = max > min;
  const range = hasRange ? (max - min) : 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = hasRange 
      ? py + (h - 2 * py) * (1 - (v - min) / range)
      : h / 2;
    return { x, y };
  });

  const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaStr = `M 0,${h} ${pts.map(p => `L ${p.x},${p.y}`).join(' ')} L ${w},${h} Z`;

  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }}>
      {/* Horizontal Baseline */}
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3,3" />
      
      {/* Signal Area */}
      <path d={areaStr} fill={color} fillOpacity="0.15" />
      
      {/* Signal Line */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Terminal Point */}
      <circle 
        cx={pts[pts.length - 1].x} 
        cy={pts[pts.length - 1].y} 
        r="3" 
        fill={color} 
      />
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

// ManualAddForm removed in favor of RecurringModal


// ─── Confirmed Row ────────────────────────────────────────────────────────────

function ConfirmedRow({ expense, onDelete, onEdit }: { expense: RecurringExpense; onDelete: () => void; onEdit?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const grouped = useMemo(() => groupOccurrencesByMonth(expense.occurrences), [expense.occurrences]);

  const occurrencesByMonth = useMemo(() => {
    const groups: Record<string, { month: string; occurrences: RecurringOccurrence[]; total: number; isCurrent: boolean }> = {};
    for (const o of expense.occurrences) {
      if (!groups[o.month]) {
        groups[o.month] = { 
          month: o.month, 
          occurrences: [], 
          total: 0,
          isCurrent: o.month === currentMonthKey
        };
      }
      groups[o.month].occurrences.push(o);
      groups[o.month].total += o.amount;
    }
    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
  }, [expense.occurrences, currentMonthKey]);

  const values = grouped.map(o => o.amount);
  const variation = detectVariation(expense);
  const isManual = expense.status === 'manual';

  const toggleMonth = (m: string) => {
    setExpandedMonths(curr => curr.includes(m) ? curr.filter(x => x !== m) : [...curr, m]);
  };

  const expandAll = () => setExpandedMonths(occurrencesByMonth.map(g => g.month));
  const collapseAll = () => setExpandedMonths([]);

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
          <Sparkline values={values} color={variation.hasVariation && variation.direction === 'up' ? 'var(--color-danger)' : 'var(--color-accent)'} />
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
            <div className="recurring-command-bar">
              <button className="cmd-btn edit" onClick={onEdit}>
                <span className="cmd-icon">✎</span> [EDITAR_REGRA]
              </button>
              {isDeleting ? (
                <div className="cmd-delete-confirm">
                  <button className="cmd-btn confirm" onClick={onDelete}>
                    CONFIRMAR_EXCLUSÃO
                  </button>
                  <button className="cmd-btn cancel" onClick={() => setIsDeleting(false)}>
                    CANCELAR
                  </button>
                </div>
              ) : (
                <button className="cmd-btn delete" onClick={() => setIsDeleting(true)}>
                  <span className="cmd-icon">🗑</span> [EXCLUIR_REGRA]
                </button>
              )}
            </div>

            {expense.occurrences.length > 0 ? (
              <motion.div 
                className="recurring-occurrence-list"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {occurrencesByMonth.length > 1 && (
                  <div className="occ-batch-actions">
                    <button 
                      className="occ-batch-btn" 
                      onClick={expandAll} 
                      disabled={expandedMonths.length === occurrencesByMonth.length}
                    >
                      [+] EXPANDIR_TUDO
                    </button>
                    <button 
                      className="occ-batch-btn" 
                      onClick={collapseAll} 
                      disabled={expandedMonths.length === 0}
                    >
                      [-] RECOLHER_TUDO
                    </button>
                  </div>
                )}

                {occurrencesByMonth.map((group) => {
                  const isMonthExpanded = expandedMonths.includes(group.month);
                  return (
                    <motion.div 
                      key={group.month} 
                      className={`occ-group ${group.isCurrent ? 'current' : ''}`}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <button className="occ-group-header" onClick={() => toggleMonth(group.month)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`occ-group-chevron ${isMonthExpanded ? 'expanded' : ''}`}>▼</span>
                          <span className="occ-group-month">{fmtMonth(group.month)}</span>
                          {group.isCurrent && <span className="occ-current-badge">MÊS ATUAL</span>}
                        </div>
                        <span className="occ-group-total">{fmt(group.total)}</span>
                      </button>
                      
                      <AnimatePresence>
                        {isMonthExpanded && (
                          <motion.div 
                            className="occ-item-container"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="occ-signal-path" />
                            {group.occurrences.sort((a, b) => b.date.localeCompare(a.date)).map((o, i) => (
                              <div key={`${o.date}-${i}`} className="recurring-occurrence-item">
                                 <div className="occ-item-left">
                                   <span className="occ-day">{o.date.split('-')[2]}</span>
                                   <span className="occ-weekday">{fmtWeekday(o.date)}</span>
                                 </div>
                                 <span className="occ-memo">{o.memo}</span>
                                 <span className="occ-amount">{fmt(o.amount)}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0 12px 12px' }}>
                Nenhuma ocorrência associada ainda.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecurringTab() {
  const { state, addManualRecurring, updateRecurring, deleteRecurring } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

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

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleConfirmModal = (name: string, amount: number, searchKeyword?: string, excludeKeyword?: string) => {
    if (editingExpense) {
      updateRecurring({
        ...editingExpense,
        displayName: name,
        normalizedKey: name.toUpperCase(),
        averageAmount: amount, // will be overridden by store reducer if keyword matches
        baseAmount: amount,
        searchKeyword,
        excludeKeyword,
        status: 'manual',
      });
    } else {
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
    }
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
        {confirmed.length === 0 && !isModalOpen && (
          <p className="recurring-empty-hint">
            Nenhum gasto confirmado ainda. Confirme candidatos abaixo ou adicione manualmente.
          </p>
        )}

        <div className="recurring-confirmed-list">
          <AnimatePresence>
            {confirmed.map(e => (
              <ConfirmedRow
                key={e.id}
                expense={e}
                onDelete={() => deleteRecurring(e.id)}
                onEdit={() => handleOpenEditModal(e)}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="recurring-add-manual-row">
          <button
            id="add-manual-recurring-btn"
            className="recurring-add-manual-btn"
            onClick={handleOpenAddModal}
          >
            + Adicionar
          </button>
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
                      color={variation.hasVariation && variation.direction === 'up' ? 'var(--color-danger)' : 'var(--color-accent)'}
                    />
                    <div className="variation-months-list">
                      {[...grouped].reverse().map((o, i) => (
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


      {/* ── Section D: Rule Configuration Modal ───────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <RecurringModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmModal}
            initialExpense={editingExpense}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
