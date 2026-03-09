'use client';

import { useCallback, useRef, useState } from 'react';
import { useFinance } from '@/lib/store';

export default function FileUploader() {
    const { addFile, loadFolderFiles, state, removeFile } = useFinance();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false);
    const hasFiles = state.parsedFiles.length > 0;
    const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
    const isCollapsed = userCollapsed !== null ? userCollapsed : false;

    const setIsCollapsed = (val: boolean) => setUserCollapsed(val);

    const handleFiles = useCallback((files: FileList | File[]) => {
        Array.from(files).forEach(file => {
            if (!file.name.toLowerCase().endsWith('.ofx')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (content) addFile(file.name, content);
            };
            reader.readAsText(file);
        });
    }, [addFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleLoadFolder = useCallback(async () => {
        setLoadingFolder(true);
        await loadFolderFiles();
        setLoadingFolder(false);
    }, [loadFolderFiles]);

    return (
        <div className="file-uploader-section">
            <div
                className={`dropzone ${isDragging ? 'dragging' : ''} ${isCollapsed ? 'compact' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => isCollapsed ? setIsCollapsed(false) : fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ofx"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <div className="dropzone-content">
                    <span className="dropzone-icon">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 12 15 15" /></svg>
                    </span>
                    <div>
                        <p className="dropzone-title" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {isDragging ? 'SOLTAR AGORA' : isCollapsed ? 'ADICIONAR MAIS OFX' : 'ARRASTE ARQUIVOS OFX OU CLIQUE'}
                        </p>
                        {!isCollapsed && <p className="dropzone-subtitle" style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase', marginTop: '4px' }}>CONTA CORRENTE • CARTÃO DE CRÉDITO</p>}
                    </div>
                </div>
                {isCollapsed && (
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '10px' }} onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); fileInputRef.current?.click(); }}>
                        <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        UPLOAD
                    </button>
                )}
            </div>

            {process.env.NODE_ENV === 'development' && !isCollapsed && (
                <div className="btn-folder-wrapper">
                    <button
                        className="btn-secondary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={handleLoadFolder}
                        disabled={loadingFolder || state.isLoading}
                    >
                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        {loadingFolder ? 'CARREGANDO...' : 'LER PASTA DO PROJETO (/ofx-data)'}
                    </button>
                    <p className="btn-folder-explanation" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Carregamento automático de ambiente local.
                    </p>
                </div>
            )}

            {hasFiles && (
                <div className="loaded-files">
                    <div className="file-chips">
                        {state.parsedFiles.map(f => (
                            <div key={f.fileName} className="file-chip fade-in">
                                <span className="file-chip-icon">
                                    {f.account.acctType === 'CREDITCARD'
                                        ? <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                        : <svg viewBox="0 0 24 24"><line x1="3" y1="21" x2="21" y2="21" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M5 6l7-3 7 3" /><line x1="4" y1="10" x2="4" y2="21" /><line x1="20" y1="10" x2="20" y2="21" /><line x1="8" y1="14" x2="8" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="16" y1="14" x2="16" y2="17" /></svg>
                                    }
                                </span>
                                <div className="file-chip-info">
                                    <span className="file-chip-name">{f.fileName}</span>
                                    <span className="file-chip-meta">
                                        {f.account.acctType === 'CREDITCARD' ? 'CARTÃO' : 'CONTA'} · {f.transactions.length} TXS
                                    </span>
                                </div>
                                <button
                                    className="file-chip-remove"
                                    onClick={(e) => { e.stopPropagation(); removeFile(f.fileName); }}
                                    title="Remover arquivo"
                                >
                                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
