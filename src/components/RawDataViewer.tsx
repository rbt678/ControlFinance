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
            <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>Carregue um arquivo OFX para ver os dados raw</p>
            </div>
        );
    }

    return (
        <div className="raw-viewer">
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
                        OFX Raw
                    </button>
                </div>
            </div>

            {file && viewMode === 'parsed' && (
                <div className="raw-parsed">
                    {/* Header Info */}
                    <div className="raw-section">
                        <h4>📋 Header OFX</h4>
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
                        <h4>🏦 Informações do Servidor</h4>
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
                        <h4>📊 Informações da Conta</h4>
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
                        <h4>💰 Saldo</h4>
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
                            <h4>📈 Saldos Extras</h4>
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
                        <h4>📅 Período</h4>
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
                        <h4>📝 Transações Raw ({file.transactions.length})</h4>
                        <div className="raw-transactions">
                            {file.transactions.map((t, i) => (
                                <div key={i} className="raw-transaction">
                                    <code className="raw-code">
                                        {`FITID: ${t.fitId}\nTYPE: ${t.type}\nDATE: ${t.rawDate}\nAMOUNT: ${t.amount}\nMEMO: ${t.memo}`}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {file && viewMode === 'raw' && (
                <div className="raw-content">
                    <pre className="raw-pre">{file.rawContent}</pre>
                </div>
            )}
        </div>
    );
}
