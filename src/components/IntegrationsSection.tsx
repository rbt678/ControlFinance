'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/store';
import { useSession, signIn, signOut } from "next-auth/react";
import DriveFolderSelector from './DriveFolderSelector';

export default function IntegrationsSection() {
    const { state, setGoogleDriveFolder, syncGoogleDrive } = useFinance();
    const [isSelectingDriveFolder, setIsSelectingDriveFolder] = useState(false);
    const { data: session, status } = useSession();

    return (
        <section className="settings-section integrations-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                    <h2 style={{ fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Integrações</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: 'var(--space-md)' }}>Conecte serviços externos para sincronizar seus dados financeiros.</p>

                    {status === 'loading' ? (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Carregando...</p>
                    ) : session ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success, #10b981)' }} />
                                <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>Conectado como <strong style={{ color: 'white' }}>{session.user?.email}</strong></span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setIsSelectingDriveFolder(true)}
                                    style={{ padding: '8px 16px', background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                                >
                                    Selecionar Pasta do Drive
                                </button>

                                {state.googleDriveFolder && (
                                    <button
                                        onClick={() => syncGoogleDrive()}
                                        disabled={state.isLoading}
                                        style={{ padding: '8px 16px', background: 'var(--color-accent)', border: '1px solid var(--color-border)', color: '#000', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600, opacity: state.isLoading ? 0.7 : 1 }}
                                    >
                                        {state.isLoading ? 'Sincronizando...' : 'Sincronizar OFXs'}
                                    </button>
                                )}

                                <button
                                    onClick={() => signOut()}
                                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                                >
                                    Desconectar
                                </button>
                            </div>
                            {state.googleDriveFolder && (
                                <div style={{ marginTop: 'var(--space-sm)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    Pasta atual: <strong style={{ color: 'var(--color-text)' }}>{state.googleDriveFolder.name}</strong>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('google')}
                            style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', color: '#000', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Entrar com Google
                        </button>
                    )}
                </div>
            </div>

            {isSelectingDriveFolder && (
                <DriveFolderSelector
                    onSelect={(folder) => {
                        setGoogleDriveFolder({ id: folder.id, name: folder.name });
                        setIsSelectingDriveFolder(false);
                    }}
                    onClose={() => setIsSelectingDriveFolder(false)}
                />
            )}
        </section>
    );
}
