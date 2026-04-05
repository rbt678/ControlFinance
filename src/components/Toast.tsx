'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const ICONS: Record<ToastType, React.ReactElement> = {
    success: (
        <svg viewBox="0 0 24 24" className="toast-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" className="toast-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" className="toast-icon">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" className="toast-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
};

const BORDER_COLORS: Record<ToastType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    return (
        <motion.div
            className="toast-item"
            style={{ borderLeftColor: BORDER_COLORS[toast.type] }}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            layout
        >
            <div className="toast-icon-wrapper" style={{ color: BORDER_COLORS[toast.type] }}>
                {ICONS[toast.type]}
            </div>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => onDismiss(toast.id)}>
                <svg viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </motion.div>
    );
}
