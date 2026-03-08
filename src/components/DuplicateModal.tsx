'use client';

import { useFinance } from '@/lib/store';

export default function DuplicateModal() {
    const { state, confirmDuplicates } = useFinance();

    if (!state.showDuplicateModal) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="modal-overlay" onClick={() => confirmDuplicates(false)}>
            <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'var(--color-warning)', fill: 'none', strokeWidth: 2, marginRight: 8, verticalAlign: 'bottom' }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Conflito: Transações Duplicadas
                    </h2>
                    <p className="modal-subtitle">
                        {state.duplicates.length} transaç{state.duplicates.length > 1 ? 'ões' : 'ão'} já exist{state.duplicates.length > 1 ? 'em' : 'e'} nos dados em memória.
                    </p>
                </div>

                <div className="modal-body">
                    <div className="duplicate-list fade-in stagger-2">
                        {state.duplicates.slice(0, 10).map((d, i) => (
                            <div key={i} className="duplicate-item">
                                <div className="duplicate-existing">
                                    <span className="duplicate-label">EM MEMÓRIA</span>
                                    <span className="duplicate-memo">{d.existing.memo}</span>
                                    <span className="duplicate-amount">{formatCurrency(d.existing.amount)}</span>
                                    <span className="duplicate-date">{d.existing.date}</span>
                                </div>
                                <span className="duplicate-arrow">
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'var(--color-border)', fill: 'none', strokeWidth: 2 }}>
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </span>
                                <div className="duplicate-incoming">
                                    <span className="duplicate-label">ARQUIVO NOVO</span>
                                    <span className="duplicate-memo">{d.incoming.memo}</span>
                                    <span className="duplicate-amount">{formatCurrency(d.incoming.amount)}</span>
                                    <span className="duplicate-date">{d.incoming.date}</span>
                                </div>
                            </div>
                        ))}
                        {state.duplicates.length > 10 && (
                            <p className="duplicate-more">
                                ...e mais {state.duplicates.length - 10} duplicata(s) omitidas
                            </p>
                        )}
                    </div>
                </div>

                <div className="modal-footer fade-in stagger-3">
                    <button className="btn-secondary" onClick={() => confirmDuplicates(false)}>
                        Cancelar Importação
                    </button>
                    <button className="btn-primary" onClick={() => confirmDuplicates(true)}>
                        Forçar Substituição
                    </button>
                </div>
            </div>
        </div>
    );
}
