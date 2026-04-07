'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecurringExpense } from '@/lib/recurring';
import { useFinance } from '@/lib/store';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, amount: number, searchKeyword?: string, excludeKeyword?: string) => void;
  initialExpense?: RecurringExpense | null;
}

export default function RecurringModal({ isOpen, onClose, onConfirm, initialExpense }: RecurringModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [search, setSearch] = useState('');
  const [exclude, setExclude] = useState('');

  useEffect(() => {
    if (initialExpense) {
      setName(initialExpense.displayName);
      setAmount((initialExpense.baseAmount ?? initialExpense.averageAmount).toString());
      setSearch(initialExpense.searchKeyword || '');
      setExclude(initialExpense.excludeKeyword || '');
    } else {
      setName('');
      setAmount('');
      setSearch('');
      setExclude('');
    }
  }, [initialExpense, isOpen]);

  const searchTags = useMemo(() =>
    search.split(',').map(k => k.trim()).filter(k => k.length > 0)
    , [search]);

  const excludeTags = useMemo(() =>
    exclude.split(',').map(k => k.trim()).filter(k => k.length > 0)
    , [exclude]);

  const { state: { transactions } } = useFinance();

  const matchedTransactions = useMemo(() => {
    if (!search.trim()) return [];

    const searchKeywords = searchTags.map(t => t.toUpperCase());
    const excludeKeywords = excludeTags.map(t => t.toUpperCase());

    return transactions.filter(t => {
      if (t.type !== 'DEBIT' || t.amount >= 0) return false;
      const memoUpper = t.memo.toUpperCase();

      // Must match ALL search keywords (AND)
      if (searchKeywords.length > 0 && !searchKeywords.every(k => memoUpper.includes(k))) return false;

      // Must NOT match ANY exclude keyword (OR)
      if (excludeKeywords.length > 0 && excludeKeywords.some(k => memoUpper.includes(k))) return false;

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [search, exclude, searchTags, excludeTags, transactions]);

  const previewStats = useMemo(() => {
    if (matchedTransactions.length === 0) return null;
    const total = matchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      count: matchedTransactions.length,
      avg: total / matchedTransactions.length,
      lastDate: matchedTransactions[0].date
    };
  }, [matchedTransactions]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(v) || v <= 0) return;
    onConfirm(name.trim(), v, search.trim() || undefined, exclude.trim() || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <motion.div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: 'calc(100% - 24px)',
          maxWidth: '560px',
          margin: '12px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)', // Ensure it doesn't leave the viewport
          overflow: 'hidden'
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{initialExpense ? '[EDITAR_REGRA]' : '[NOVA_REGRA]'}</h2>
            <button
              onClick={onClose}
              style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <p className="modal-subtitle">Configure os parâmetros de detecção para automação de gastos fixos.</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        }}>
          <div className="modal-body" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            flex: 1,
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div className="filter-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Identificação do Gasto</label>
                <input
                  className="filter-input"
                  placeholder="Ex: Aluguel, Academia..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="filter-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Valor Base (BRL)</label>
                <input
                  className="filter-input"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '20px' }}>
              <div className="filter-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Filtros de Busca
                  <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>[LÓGICA: AND]</span>
                </label>
                <input
                  className="filter-input"
                  placeholder="Termos contidos na descrição (separados por vírgula)..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {searchTags.map((tag, i) => (
                    <span key={i} style={{
                      background: 'var(--color-accent-glow)',
                      color: 'var(--color-accent)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      border: '1px solid rgba(255,107,44,0.3)',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '2px'
                    }}>
                      {tag}
                    </span>
                  ))}
                  {searchTags.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontStyle: 'italic' }}>Nenhum termo (corresponderá a qualquer descrição)</span>}
                </div>
              </div>

              <div className="filter-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Exclusão de Termos
                  <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>[LÓGICA: OR]</span>
                </label>
                <input
                  className="filter-input"
                  placeholder="Ignore transações que contenham..."
                  value={exclude}
                  onChange={e => setExclude(e.target.value)}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {excludeTags.map((tag, i) => (
                    <span key={i} style={{
                      background: 'rgba(255,59,48,0.1)',
                      color: 'var(--color-danger)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      border: '1px solid rgba(255,59,48,0.3)',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '2px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW PLACEHOLDER */}
            {/* 
            TODO: Implement matching transaction preview.
            Requires access to state.transactions and logic from recurring.ts
            */}
            <div style={{
              marginTop: '4px',
              padding: '12px',
              background: 'var(--color-bg-elevated)',
              border: matchedTransactions.length > 0 ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-accent)', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                  {matchedTransactions.length > 0 ? '[SISTEMA_PREVIEW: ATIVO]' : '[SISTEMA_PREVIEW: AGUARDANDO_TERMOS]'}
                </span>
                {previewStats && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    {previewStats.count} Transações
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {matchedTransactions.length > 0 ? (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '8px',
                      background: 'rgba(255,107,44,0.05)',
                      borderLeft: '2px solid var(--color-accent)'
                    }}>
                      <div>
                        <label style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>Média de Gasto</label>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)', fontWeight: 'bold' }}>
                          R$ {previewStats?.avg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <label style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>Última Ocorrência</label>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)' }}>
                          {previewStats?.lastDate.split('-').reverse().join('/')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Amostra (Top 5)</label>
                      {matchedTransactions.slice(0, 5).map((t, i) => (
                        <div key={t.id || i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--color-border-subtle)',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <div style={{ display: 'flex', gap: '6px', overflow: 'hidden' }}>
                            <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{t.date.split('-').slice(1).reverse().join('/')}</span>
                            <span
                              title={t.memo}
                              style={{
                                color: 'var(--color-text)',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '10px',
                                lineHeight: '1.2',
                                opacity: 0.8
                              }}
                            >
                              {t.memo}
                            </span>
                          </div>
                          <span style={{ color: 'var(--color-text)', fontWeight: 'bold', marginLeft: '6px' }}>
                            {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      padding: '20px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                      {search.trim() ? '[SISTEMA_AVISO: NENHUMA_TRANSACAO_ENCONTRADA]' : '[SISTEMA_IDLE: AGUARDANDO_TERMOS]'}
                    </span>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '9px', maxWidth: '300px' }}>
                      {search.trim()
                        ? 'Nenhum resultado para os termos atuais.'
                        : 'Insira termos de busca para validar a regra.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="modal-footer" style={{
            flexDirection: 'row',
            display: 'flex',
            gap: '12px',
            alignItems: 'stretch',
            padding: '16px var(--space-xl)',
            marginTop: 'auto', // Pushes footer to bottom
            borderTop: '1px solid var(--color-border)'
          }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{
              flex: '1 1 140px',
              minHeight: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              DESCARTAR
            </button>
            <button type="submit" className="btn-primary" disabled={!name || !amount} style={{
              flex: '2 1 200px',
              minHeight: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {initialExpense ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR REGRA'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
