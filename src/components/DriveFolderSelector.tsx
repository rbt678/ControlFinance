'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DriveFolder {
    id: string;
    name: string;
    parents?: string[];
}

interface Props {
    onSelect: (folder: DriveFolder) => void;
    onClose: () => void;
}

export default function DriveFolderSelector({ onSelect, onClose }: Props) {
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);
    
    // Caminho de navegação: array de {id, name}
    const [path, setPath] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        setMounted(true);
        async function fetchFolders() {
            try {
                const res = await fetch('/api/drive/folders');
                if (!res.ok) {
                    if (res.status === 401) {
                        throw new Error("Sessão expirada ou não autorizada.");
                    }
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Erro ao carregar pastas.");
                }
                const data = await res.json();
                setFolders(data.folders || []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Erro desconhecido';
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        fetchFolders();
    }, []);

    const currentParentId = path.length > 0 ? path[path.length - 1].id : 'root';

    const filtered = useMemo(() => {
        if (search.trim()) {
            const term = search.toLowerCase();
            return folders.filter(f => f.name.toLowerCase().includes(term));
        }
        
        // Se estamos no "Root", o Google costuma marcar o pai como um ID longo ou 'root'
        // Mas como pegamos via API filtrada por 'me' in owners, as pastas de topo 
        // terão pais que não estão na lista de pastas retornadas, ou o ID do root.
        
        if (currentParentId === 'root') {
            // Tenta identificar pastas de topo: aquelas cujo pai não está na lista de IDs de pastas que temos
            const allFolderIds = new Set(folders.map(f => f.id));
            return folders.filter(f => {
                const hasLocalParent = f.parents?.some(pId => allFolderIds.has(pId));
                return !hasLocalParent;
            });
        }

        return folders.filter(f => f.parents?.includes(currentParentId));
    }, [folders, search, currentParentId]);

    const handleNavigate = (folder: DriveFolder) => {
        if (search) setSearch(''); // Limpa busca ao entrar
        setPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    };

    const handleGoBack = () => {
        setPath(prev => prev.slice(0, -1));
    };

    const handleJumpTo = (index: number) => {
        setPath(prev => prev.slice(0, index + 1));
    };

    const handleGoRoot = () => {
        setPath([]);
    };

    if (!mounted) return null;

    return createPortal(
        <motion.div
            className="folder-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                className="folder-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Header */}
                <div className="folder-modal-header">
                    <div className="folder-modal-title">
                        <svg viewBox="0 0 24 24" className="folder-modal-icon">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3>SELECIONE A PASTA</h3>
                    </div>
                    <button onClick={onClose} className="folder-modal-close">
                        <svg viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Breadcrumbs */}
                {!loading && !error && !search && (
                    <div className="folder-breadcrumbs">
                        <button 
                            className={`breadcrumb-item ${path.length === 0 ? 'active' : ''}`}
                            onClick={handleGoRoot}
                        >
                            Meu Drive
                        </button>
                        {path.map((p, i) => (
                            <div key={p.id} className="breadcrumb-group">
                                <svg viewBox="0 0 24 24" className="breadcrumb-separator">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                                <button 
                                    className={`breadcrumb-item ${i === path.length - 1 ? 'active' : ''}`}
                                    onClick={() => handleJumpTo(i)}
                                >
                                    {p.name}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                {!loading && !error && (
                    <div className="folder-search-wrapper">
                        <svg viewBox="0 0 24 24" className="folder-search-icon">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="folder-search-input"
                            placeholder="Buscar em todas as pastas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="folder-search-clear" onClick={() => setSearch('')}>
                                <svg viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="folder-modal-body">
                    {loading ? (
                        <div className="folder-loading">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="folder-skeleton" style={{ animationDelay: `${i * 100}ms` }} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="folder-error">
                            <svg viewBox="0 0 24 24" className="folder-error-icon">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="folder-empty">
                            <svg viewBox="0 0 24 24" className="folder-empty-icon">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>
                                {search ? `Nenhuma pasta para "${search}"` : 'Esta pasta está vazia.'}
                            </span>
                            {path.length > 0 && !search && (
                                <button onClick={handleGoBack} className="folder-empty-back">
                                    Voltar
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="folder-list">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((folder, i) => (
                                    <motion.div
                                        key={folder.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ duration: 0.2 }}
                                        className="folder-item-row"
                                    >
                                        <button
                                            className="folder-item-main"
                                            onClick={() => handleNavigate(folder)}
                                            title="Entrar na pasta"
                                        >
                                            <svg viewBox="0 0 24 24" className="folder-item-icon">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                            </svg>
                                            <span className="folder-item-name">{folder.name}</span>
                                        </button>
                                        
                                        <button 
                                            className="folder-item-select"
                                            onClick={() => onSelect(folder)}
                                            title="Selecionar esta pasta"
                                        >
                                            <span>SELECIONAR</span>
                                            <svg viewBox="0 0 24 24">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer count */}
                {!loading && !error && folders.length > 0 && (
                    <div className="folder-modal-footer">
                        {search ? (
                            <span>{filtered.length} pasta{filtered.length !== 1 ? 's' : ''} encontradas</span>
                        ) : (
                            <span>{filtered.length} pasta{filtered.length !== 1 ? 's' : ''} neste nível</span>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
}
