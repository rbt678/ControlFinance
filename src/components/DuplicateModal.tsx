'use client';

import { useFinance } from '@/lib/store';

export default function DuplicateModal() {
    const { state, confirmDuplicates } = useFinance();

    if (!state.showDuplicateModal) return null;

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="modal-overlay" onClick={() => confirmDuplicates(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚠️ Transações Duplicadas Encontradas</h2>
                    <p className="modal-subtitle">
                        {state.duplicates.length} transaç{state.duplicates.length > 1 ? 'ões' : 'ão'} já exist{state.duplicates.length > 1 ? 'em' : 'e'} nos dados carregados.
                    </p>
                </div>

                <div className="modal-body">
                    <div className="duplicate-list">
                        {state.duplicates.slice(0, 10).map((d, i) => (
                            <div key={i} className="duplicate-item">
                                <div className="duplicate-existing">
                                    <span className="duplicate-label">Existente</span>
                                    <span className="duplicate-memo">{d.existing.memo}</span>
                                    <span className="duplicate-amount">{formatCurrency(d.existing.amount)}</span>
                                    <span className="duplicate-date">{d.existing.date}</span>
                                </div>
                                <span className="duplicate-arrow">→</span>
                                <div className="duplicate-incoming">
                                    <span className="duplicate-label">Novo</span>
                                    <span className="duplicate-memo">{d.incoming.memo}</span>
                                    <span className="duplicate-amount">{formatCurrency(d.incoming.amount)}</span>
                                    <span className="duplicate-date">{d.incoming.date}</span>
                                </div>
                            </div>
                        ))}
                        {state.duplicates.length > 10 && (
                            <p className="duplicate-more">
                                ...e mais {state.duplicates.length - 10} duplicata(s)
                            </p>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => confirmDuplicates(false)}>
                        Cancelar
                    </button>
                    <button className="btn-primary" onClick={() => confirmDuplicates(true)}>
                        Sobrescrever duplicatas
                    </button>
                </div>
            </div>
        </div>
    );
}
