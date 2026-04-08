'use client';

import { useCallback } from 'react';
import { useFinance } from '@/lib/store';
import { useSession, signIn, signOut } from "next-auth/react";
import { useToast } from './Toast';
import DriveFolderSelector from './DriveFolderSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function IntegrationsSection() {
    const { state, setGoogleDriveFolder, syncGoogleDrive, syncSettings, uploadSettings } = useFinance();
    const [isSelectingDriveFolder, setIsSelectingDriveFolder] = useState(false);
    const { data: session, status } = useSession();
    const { addToast } = useToast();

    const handleSync = useCallback(async () => {
        const result = await syncGoogleDrive();
        if (!result) return;

        if (result.errors.length > 0 && result.added === 0) {
            addToast(result.errors[0], 'error', 5000);
        } else if (result.added > 0) {
            addToast(`${result.added} novo${result.added > 1 ? 's' : ''} arquivo${result.added > 1 ? 's' : ''} sincronizado${result.added > 1 ? 's' : ''}.`, 'success');
            if (result.errors.length > 0) {
                addToast(`${result.errors.length} aviso${result.errors.length > 1 ? 's' : ''} durante sync.`, 'warning', 6000);
            }
        } else {
            addToast('Nenhum arquivo novo encontrado na pasta.', 'info');
        }
    }, [syncGoogleDrive, addToast]);

    const handleFolderSelect = useCallback(async (folder: { id: string; name: string }) => {
        setGoogleDriveFolder(folder);
        setIsSelectingDriveFolder(false);
        addToast(`Pasta "${folder.name}" selecionada.`, 'success');
    }, [setGoogleDriveFolder, addToast]);

    const handleDisconnect = useCallback(() => {
        setGoogleDriveFolder(null);
        signOut();
        addToast('Google Drive desconectado.', 'info');
    }, [setGoogleDriveFolder, addToast]);

    const formatLastSync = (timestamp: number | null): string => {
        if (!timestamp) return '';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'agora mesmo';
        if (mins < 60) return `há ${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `há ${hrs}h`;
        return `há ${Math.floor(hrs / 24)}d`;
    };

    const isSyncing = state.syncStatus === 'syncing';
    const isSettingsSyncing = state.settingsSyncStatus === 'uploading' || state.settingsSyncStatus === 'downloading';

    const handleUploadSettings = useCallback(async () => {
        const result = await uploadSettings();
        if (result.success) {
            addToast('Preferências salvas no Drive.', 'success');
        } else {
            addToast(result.error || 'Falha ao enviar preferências.', 'error', 5000);
        }
    }, [uploadSettings, addToast]);

    const handleDownloadSettings = useCallback(async () => {
        const result = await syncSettings();
        switch (result.action) {
            case 'downloaded':
                addToast('Preferências restauradas do Drive.', 'success');
                break;
            case 'uploaded':
                addToast('Nenhuma preferência no Drive. Estado local enviado.', 'info');
                break;
            default:
                addToast(result.error || 'Nenhuma ação realizada.', result.error ? 'error' : 'info', 5000);
        }
    }, [syncSettings, addToast]);

    return (
        <section className="settings-section integrations-section">
            <div className="settings-section-header">
                <div className="settings-section-title">
                    <h2>
                        <svg viewBox="0 0 24 24" className="section-icon">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Integrações
                    </h2>
                    <p>Conecte serviços externos para sincronizar seus dados financeiros.</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {status === 'loading' ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="integration-loading"
                    >
                        <div className="loading-pulse" />
                        <span>VERIFICANDO SESSÃO...</span>
                    </motion.div>
                ) : session ? (
                    <motion.div
                        key="connected"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="integration-connected"
                    >
                        {/* Connection Status Bar */}
                        <div className="drive-connection-bar">
                            <div className="drive-connection-info">
                                <div className="drive-status-dot" />
                                <div className="drive-connection-details">
                                    <span className="drive-connection-label">GOOGLE DRIVE CONECTADO</span>
                                    <span className="drive-connection-email">{session.user?.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                className="drive-disconnect-btn"
                                title="Desconectar"
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                SAIR
                            </button>
                        </div>

                        {/* Folder Selection */}
                        <div className="drive-folder-section">
                            {state.googleDriveFolder ? (
                                <div className="drive-folder-active">
                                    <div className="drive-folder-badge">
                                        <svg viewBox="0 0 24 24" className="folder-icon">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <div className="drive-folder-info">
                                            <span className="drive-folder-label">PASTA ATIVA</span>
                                            <span className="drive-folder-name">{state.googleDriveFolder.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsSelectingDriveFolder(true)}
                                            className="drive-folder-change"
                                            title="Trocar pasta"
                                        >
                                            <svg viewBox="0 0 24 24">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Sync Controls */}
                                    <div className="drive-sync-controls">
                                        <button
                                            onClick={handleSync}
                                            disabled={isSyncing}
                                            className={`drive-sync-btn ${isSyncing ? 'syncing' : ''}`}
                                        >
                                            <svg viewBox="0 0 24 24" className={`sync-icon ${isSyncing ? 'spinning' : ''}`}>
                                                <polyline points="23 4 23 10 17 10" />
                                                <polyline points="1 20 1 14 7 14" />
                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                            </svg>
                                            {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR ARQUIVOS'}
                                        </button>

                                        {state.lastSyncAt && (
                                            <div className="drive-sync-meta">
                                                <svg viewBox="0 0 24 24" className="meta-icon">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                <span>Último sync: {formatLastSync(state.lastSyncAt)}</span>
                                                {state.syncResult && (
                                                    <span className="sync-result-count">
                                                        · {state.syncResult.found} encontrados, {state.syncResult.added} novos
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Settings Sync Controls */}
                                    <div className="drive-settings-sync">
                                        <div className="drive-settings-sync-header">
                                            <div className="pref-label">
                                                <svg viewBox="0 0 24 24" className="meta-icon">
                                                    <circle cx="12" cy="12" r="3" />
                                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                                </svg>
                                                SYNC PREFERÊNCIAS
                                            </div>
                                            <div className="pref-status-line">
                                                {state.settingsSyncStatus === 'idle' ? '[ STANDBY ]' :
                                                 state.settingsSyncStatus === 'uploading' ? '[ UPLOADING... ]' :
                                                 state.settingsSyncStatus === 'downloading' ? '[ DOWNLOADING... ]' :
                                                 '[ READY ]'}
                                            </div>
                                        </div>
                                        <div className="drive-settings-sync-actions">
                                            <button
                                                onClick={handleUploadSettings}
                                                disabled={isSettingsSyncing}
                                                className={`drive-settings-btn upload ${isSettingsSyncing ? 'syncing' : ''}`}
                                                title="Enviar preferências locais para o Drive"
                                            >
                                                <svg viewBox="0 0 24 24">
                                                    <polyline points="17 1 21 5 17 9" />
                                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                                    <polyline points="7 23 3 19 7 15" />
                                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                                </svg>
                                                <span>ENVIAR</span>
                                                DRIVE
                                            </button>
                                            <button
                                                onClick={handleDownloadSettings}
                                                disabled={isSettingsSyncing}
                                                className={`drive-settings-btn download ${isSettingsSyncing ? 'syncing' : ''}`}
                                                title="Restaurar preferências do Drive"
                                            >
                                                <svg viewBox="0 0 24 24">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span>RESTAURAR</span>
                                                DRIVE
                                            </button>
                                        </div>
                                        <div className="pref-meta-info">
                                            {state.lastSettingsSyncAt && (
                                                <div className="last-sync-tag">
                                                    <svg viewBox="0 0 24 24" className="meta-icon">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    ÚLTIMA SYNC: {formatLastSync(state.lastSettingsSyncAt).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSelectingDriveFolder(true)}
                                    className="drive-select-folder-btn"
                                >
                                    <svg viewBox="0 0 24 24">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <div className="select-folder-text">
                                        <span className="select-folder-title">SELECIONAR PASTA DO DRIVE</span>
                                        <span className="select-folder-desc">Escolha a pasta contendo seus arquivos OFX</span>
                                    </div>
                                    <svg viewBox="0 0 24 24" className="chevron-icon">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="disconnected"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            onClick={() => signIn('google')}
                            className="google-login-btn"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Conectar com Google Drive</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSelectingDriveFolder && (
                    <DriveFolderSelector
                        onSelect={handleFolderSelect}
                        onClose={() => setIsSelectingDriveFolder(false)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
