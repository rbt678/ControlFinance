import { useState, useEffect } from 'react';

interface DriveFolder {
    id: string;
    name: string;
}

interface Props {
    onSelect: (folder: DriveFolder) => void;
    onClose: () => void;
}

export default function DriveFolderSelector({ onSelect, onClose }: Props) {
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchFolders() {
            try {
                const res = await fetch('/api/drive/folders');
                if (!res.ok) {
                    if (res.status === 401) {
                        throw new Error("Sessão expirada ou não autorizada.");
                    }
                    throw new Error("Erro ao carregar pastas.");
                }
                const data = await res.json();
                setFolders(data.folders || []);
            } catch (err: any) {
                setError(err.message || 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        }
        fetchFolders();
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                padding: 'var(--space-xl)', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>Selecione a Pasta</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Carregando pastas do Google Drive...</p>
                ) : error ? (
                    <p style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{error}</p>
                ) : folders.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Nenhuma pasta encontrada no seu Drive.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => onSelect(folder)}
                                style={{
                                    padding: '12px', background: 'var(--color-card)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                {folder.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
