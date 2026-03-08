'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/store';

export default function RawDataViewer() {
    const { state } = useFinance();
    const [selectedFile, setSelectedFile] = useState<string | null>(
        state.parsedFiles.length > 0 ? state.parsedFiles[0].fileName : null
    );
    const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed');

    const file = state.parsedFiles.find(f => f.fileName === selectedFile);

    if (state.parsedFiles.length === 0) {
        return (
            <div className="empty-state fade-in stagger-2">
                <svg viewBox="0 0 24 24" style={{ width: 32, height: 32, stroke: 'var(--color-border)', fill: 'none', strokeWidth: 1.5, marginBottom: 16 }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>O buffer de dados (raw) está vazio.</p>
            </div>
        );
    }

    return (
        <div className="raw-viewer fade-in stagger-2">
            <div className="raw-viewer-controls">
                <select
                    className="raw-select"
                    value={selectedFile || ''}
                    onChange={(e) => setSelectedFile(e.target.value)}
                >
                    {state.parsedFiles.map(f => (
                        <option key={f.fileName} value={f.fileName}>
                            {f.fileName}
                        </option>
                    ))}
                </select>
                <div className="chart-toggle">
                    <button className={`toggle-btn ${viewMode === 'parsed' ? 'active' : ''}`} onClick={() => setViewMode('parsed')}>
                        Parseado
                    </button>
                    <button className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`} onClick={() => setViewMode('raw')}>
                        OFX RAW
                    </button>
                </div>
            </div>

            {file && viewMode === 'parsed' && (
                <div className="raw-parsed fade-in stagger-3">
                    {/* Header Info */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Header OFX
                        </h4>
                        <div className="raw-grid">
                            <div className="raw-item">
                                <span className="raw-label">Versão</span>
                                <span className="raw-value">{file.header.version}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Encoding</span>
                                <span className="raw-value">{file.header.encoding}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Charset</span>
                                <span className="raw-value">{file.header.charset}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Segurança</span>
                                <span className="raw-value">{file.header.security}</span>
                            </div>
                        </div>
                    </div>

                    {/* Server Info */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                <line x1="6" y1="6" x2="6.01" y2="6" />
                                <line x1="6" y1="18" x2="6.01" y2="18" />
                            </svg>
                            Info. do Servidor
                        </h4>
                        <div className="raw-grid">
                            <div className="raw-item">
                                <span className="raw-label">Data Servidor</span>
                                <span className="raw-value">{file.serverDate}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Idioma</span>
                                <span className="raw-value">{file.language}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Organização</span>
                                <span className="raw-value">{file.account.org || '-'}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">FID</span>
                                <span className="raw-value">{file.account.fid || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" />
                            </svg>
                            Info. da Conta
                        </h4>
                        <div className="raw-grid">
                            {file.account.bankId && (
                                <div className="raw-item">
                                    <span className="raw-label">Banco ID</span>
                                    <span className="raw-value">{file.account.bankId}</span>
                                </div>
                            )}
                            {file.account.branchId && (
                                <div className="raw-item">
                                    <span className="raw-label">Agência</span>
                                    <span className="raw-value">{file.account.branchId}</span>
                                </div>
                            )}
                            <div className="raw-item">
                                <span className="raw-label">Conta ID</span>
                                <span className="raw-value">{file.account.acctId}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Tipo de Conta</span>
                                <span className="raw-value">{file.account.acctType}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Moeda</span>
                                <span className="raw-value">{file.account.currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Balanço
                        </h4>
                        <div className="raw-grid">
                            <div className="raw-item">
                                <span className="raw-label">Saldo Contábil</span>
                                <span className="raw-value" style={{ color: file.ledgerBalance.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {file.ledgerBalance.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Data do Saldo</span>
                                <span className="raw-value">{file.ledgerBalance.asOfDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Extra Balances */}
                    {file.extraBalances.length > 0 && (
                        <div className="raw-section">
                            <h4>
                                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Saldos Extras
                            </h4>
                            <div className="raw-grid">
                                {file.extraBalances.map((bal, i) => (
                                    <div key={i} className="raw-item">
                                        <span className="raw-label">{bal.name}</span>
                                        <span className="raw-value">{bal.description}: {bal.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Período
                        </h4>
                        <div className="raw-grid">
                            <div className="raw-item">
                                <span className="raw-label">Início</span>
                                <span className="raw-value">{file.dateRange.start}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Fim</span>
                                <span className="raw-value">{file.dateRange.end}</span>
                            </div>
                            <div className="raw-item">
                                <span className="raw-label">Total de Transações</span>
                                <span className="raw-value">{file.transactions.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="raw-section">
                        <h4>
                            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginRight: 8, stroke: 'currentColor', fill: 'none', strokeWidth: 2, verticalAlign: 'text-bottom' }}>
                                <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
                            </svg>
                            Estrutura de Transadores Raw ({file.transactions.length})
                        </h4>
                        <div className="raw-transactions">
                            {file.transactions.map((t, i) => (
                                <div key={i} className="raw-transaction">
                                    <code className="raw-code">
                                        {`FITID:  ${t.fitId}\nTYPE:   ${t.type}\nDATE:   ${t.rawDate}\nAMOUNT: ${t.amount}\nMEMO:   ${t.memo}`}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {file && viewMode === 'raw' && (
                <div className="raw-content fade-in stagger-3">
                    <pre className="raw-pre">{file.rawContent}</pre>
                </div>
            )}
        </div>
    );
}
