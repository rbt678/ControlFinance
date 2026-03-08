'use client';

import { useCallback, useRef, useState } from 'react';
import { useFinance } from '@/lib/store';

export default function FileUploader() {
    const { addFile, loadFolderFiles, state, removeFile } = useFinance();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false);

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
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
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
                    <span className="dropzone-icon">{isDragging ? '📂' : '📄'}</span>
                    <p className="dropzone-title">
                        {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos OFX ou clique para selecionar'}
                    </p>
                    <p className="dropzone-subtitle">Suporta conta corrente e cartão de crédito</p>
                </div>
            </div>

            <button
                className="btn-folder"
                onClick={handleLoadFolder}
                disabled={loadingFolder || state.isLoading}
            >
                {loadingFolder ? '⏳ Carregando...' : '📁 Ler pasta do projeto'}
            </button>

            {state.parsedFiles.length > 0 && (
                <div className="loaded-files">
                    <h3 className="loaded-files-title">Arquivos carregados</h3>
                    <div className="file-chips">
                        {state.parsedFiles.map(f => (
                            <div key={f.fileName} className="file-chip">
                                <span className="file-chip-icon">
                                    {f.account.acctType === 'CREDITCARD' ? '💳' : '🏦'}
                                </span>
                                <div className="file-chip-info">
                                    <span className="file-chip-name">{f.fileName}</span>
                                    <span className="file-chip-meta">
                                        {f.account.acctType === 'CREDITCARD' ? 'Cartão' : 'Conta'} · {f.transactions.length} transações
                                    </span>
                                </div>
                                <button
                                    className="file-chip-remove"
                                    onClick={(e) => { e.stopPropagation(); removeFile(f.fileName); }}
                                    title="Remover arquivo"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
