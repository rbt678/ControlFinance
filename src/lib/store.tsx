'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { ParsedOFX, OFXTransaction, parseOFX } from './ofx-parser';
import { categorizeTransaction, Category } from './categories';
import { loadFromLocalStorage, addFileToStorage, removeFileFromStorage, clearLocalStorage } from './storage';

export interface EnrichedTransaction extends OFXTransaction {
    category: Category;
    fileName: string;
}

export interface DuplicateInfo {
    existing: EnrichedTransaction;
    incoming: EnrichedTransaction;
    fileName: string;
}

export interface Filters {
    dateStart: string;
    dateEnd: string;
    categories: string[];
    types: ('CREDIT' | 'DEBIT')[];
    accounts: string[];
    amountMin: string;
    amountMax: string;
    search: string;
}

interface FinanceState {
    parsedFiles: ParsedOFX[];
    transactions: EnrichedTransaction[];
    filters: Filters;
    duplicates: DuplicateInfo[];
    showDuplicateModal: boolean;
    pendingFile: { fileName: string; content: string } | null;
    activeTab: 'dashboard' | 'transactions' | 'raw';
    isLoading: boolean;
}

type Action =
    | { type: 'ADD_FILE'; payload: ParsedOFX }
    | { type: 'REMOVE_FILE'; payload: string }
    | { type: 'SET_TRANSACTIONS'; payload: EnrichedTransaction[] }
    | { type: 'SET_FILTERS'; payload: Partial<Filters> }
    | { type: 'RESET_FILTERS' }
    | { type: 'SET_DUPLICATES'; payload: DuplicateInfo[] }
    | { type: 'SHOW_DUPLICATE_MODAL'; payload: boolean }
    | { type: 'SET_PENDING_FILE'; payload: { fileName: string; content: string } | null }
    | { type: 'SET_ACTIVE_TAB'; payload: FinanceState['activeTab'] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'LOAD_ALL'; payload: { files: ParsedOFX[]; transactions: EnrichedTransaction[] } };

const defaultFilters: Filters = {
    dateStart: '',
    dateEnd: '',
    categories: [],
    types: [],
    accounts: [],
    amountMin: '',
    amountMax: '',
    search: '',
};

const initialState: FinanceState = {
    parsedFiles: [],
    transactions: [],
    filters: defaultFilters,
    duplicates: [],
    showDuplicateModal: false,
    pendingFile: null,
    activeTab: 'dashboard',
    isLoading: false,
};

function reducer(state: FinanceState, action: Action): FinanceState {
    switch (action.type) {
        case 'ADD_FILE':
            return { ...state, parsedFiles: [...state.parsedFiles, action.payload] };
        case 'REMOVE_FILE':
            return {
                ...state,
                parsedFiles: state.parsedFiles.filter(f => f.fileName !== action.payload),
                transactions: state.transactions.filter(t => t.fileName !== action.payload),
            };
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        case 'RESET_FILTERS':
            return { ...state, filters: defaultFilters };
        case 'SET_DUPLICATES':
            return { ...state, duplicates: action.payload };
        case 'SHOW_DUPLICATE_MODAL':
            return { ...state, showDuplicateModal: action.payload };
        case 'SET_PENDING_FILE':
            return { ...state, pendingFile: action.payload };
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'LOAD_ALL':
            return { ...state, parsedFiles: action.payload.files, transactions: action.payload.transactions };
        default:
            return state;
    }
}

function enrichTransactions(parsed: ParsedOFX): EnrichedTransaction[] {
    return parsed.transactions.map(t => ({
        ...t,
        category: categorizeTransaction(t.memo),
        fileName: parsed.fileName,
    }));
}

function findDuplicates(
    existing: EnrichedTransaction[],
    incoming: EnrichedTransaction[],
    fileName: string
): DuplicateInfo[] {
    const existingIds = new Map(existing.map(t => [t.fitId + ':' + t.accountId, t]));
    const dupes: DuplicateInfo[] = [];
    for (const t of incoming) {
        const key = t.fitId + ':' + t.accountId;
        const ex = existingIds.get(key);
        if (ex) {
            dupes.push({ existing: ex, incoming: t, fileName });
        }
    }
    return dupes;
}

interface FinanceContextType {
    state: FinanceState;
    addFile: (fileName: string, content: string, skipDuplicateCheck?: boolean) => void;
    removeFile: (fileName: string) => void;
    confirmDuplicates: (overwrite: boolean) => void;
    setFilters: (filters: Partial<Filters>) => void;
    resetFilters: () => void;
    setActiveTab: (tab: FinanceState['activeTab']) => void;
    filteredTransactions: EnrichedTransaction[];
    loadFolderFiles: () => Promise<void>;
    clearAll: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = loadFromLocalStorage();
        if (stored.length > 0) {
            const allFiles: ParsedOFX[] = [];
            const allTransactions: EnrichedTransaction[] = [];
            for (const file of stored) {
                try {
                    const parsed = parseOFX(file.content, file.fileName);
                    allFiles.push(parsed);
                    allTransactions.push(...enrichTransactions(parsed));
                } catch (e) {
                    console.error(`Failed to parse stored file ${file.fileName}:`, e);
                }
            }
            dispatch({ type: 'LOAD_ALL', payload: { files: allFiles, transactions: deduplicateTransactions(allTransactions) } });
        }
    }, []);

    const addFile = useCallback((fileName: string, content: string, skipDuplicateCheck = false) => {
        try {
            const parsed = parseOFX(content, fileName);
            const enriched = enrichTransactions(parsed);

            if (!skipDuplicateCheck) {
                const dupes = findDuplicates(state.transactions, enriched, fileName);
                if (dupes.length > 0) {
                    dispatch({ type: 'SET_DUPLICATES', payload: dupes });
                    dispatch({ type: 'SET_PENDING_FILE', payload: { fileName, content } });
                    dispatch({ type: 'SHOW_DUPLICATE_MODAL', payload: true });
                    return;
                }
            }

            dispatch({ type: 'ADD_FILE', payload: parsed });
            const merged = deduplicateTransactions([...state.transactions, ...enriched]);
            dispatch({ type: 'SET_TRANSACTIONS', payload: merged });
            addFileToStorage(fileName, content);
        } catch (e) {
            console.error('Failed to parse OFX:', e);
        }
    }, [state.transactions]);

    const removeFile = useCallback((fileName: string) => {
        dispatch({ type: 'REMOVE_FILE', payload: fileName });
        removeFileFromStorage(fileName);
    }, []);

    const confirmDuplicates = useCallback((overwrite: boolean) => {
        if (state.pendingFile) {
            if (overwrite) {
                const parsed = parseOFX(state.pendingFile.content, state.pendingFile.fileName);
                const enriched = enrichTransactions(parsed);
                // Remove existing transactions from the same file, then add new ones
                const withoutOld = state.transactions.filter(
                    t => !state.duplicates.some(d => d.existing.id === t.id)
                );
                const merged = deduplicateTransactions([...withoutOld, ...enriched]);
                dispatch({ type: 'ADD_FILE', payload: parsed });
                dispatch({ type: 'SET_TRANSACTIONS', payload: merged });
                addFileToStorage(state.pendingFile.fileName, state.pendingFile.content);
            }
        }
        dispatch({ type: 'SHOW_DUPLICATE_MODAL', payload: false });
        dispatch({ type: 'SET_PENDING_FILE', payload: null });
        dispatch({ type: 'SET_DUPLICATES', payload: [] });
    }, [state.pendingFile, state.transactions, state.duplicates]);

    const setFilters = useCallback((filters: Partial<Filters>) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const resetFilters = useCallback(() => {
        dispatch({ type: 'RESET_FILTERS' });
    }, []);

    const setActiveTab = useCallback((tab: FinanceState['activeTab']) => {
        dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []);

    const loadFolderFiles = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await fetch('/api/ofx-files');
            if (!res.ok) throw new Error('Failed to load folder files');
            const data = await res.json();
            const files: { fileName: string; content: string }[] = data.files || [];

            // Batch load all files at once to avoid stale state issues
            const allFiles: ParsedOFX[] = [...state.parsedFiles];
            const allTransactions: EnrichedTransaction[] = [...state.transactions];

            for (const file of files) {
                // Skip if already loaded
                if (allFiles.some(f => f.fileName === file.fileName)) continue;
                try {
                    const parsed = parseOFX(file.content, file.fileName);
                    allFiles.push(parsed);
                    allTransactions.push(...enrichTransactions(parsed));
                    addFileToStorage(file.fileName, file.content);
                } catch (e) {
                    console.error(`Failed to parse ${file.fileName}:`, e);
                }
            }

            dispatch({
                type: 'LOAD_ALL',
                payload: {
                    files: allFiles,
                    transactions: deduplicateTransactions(allTransactions),
                },
            });
        } catch (e) {
            console.error('Failed to load folder files:', e);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.parsedFiles, state.transactions]);

    const clearAll = useCallback(() => {
        dispatch({ type: 'LOAD_ALL', payload: { files: [], transactions: [] } });
        clearLocalStorage();
    }, []);

    const filteredTransactions = React.useMemo(() => {
        let result = state.transactions;
        const { dateStart, dateEnd, categories, types, accounts, amountMin, amountMax, search } = state.filters;

        if (dateStart) result = result.filter(t => t.date >= dateStart);
        if (dateEnd) result = result.filter(t => t.date <= dateEnd);
        if (categories.length > 0) result = result.filter(t => categories.includes(t.category.id));
        if (types.length > 0) result = result.filter(t => types.includes(t.type));
        if (accounts.length > 0) result = result.filter(t => accounts.includes(t.accountId));
        if (amountMin) result = result.filter(t => Math.abs(t.amount) >= parseFloat(amountMin));
        if (amountMax) result = result.filter(t => Math.abs(t.amount) <= parseFloat(amountMax));
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(t => t.memo.toLowerCase().includes(s) || t.fitId.toLowerCase().includes(s));
        }

        return result.sort((a, b) => b.date.localeCompare(a.date));
    }, [state.transactions, state.filters]);

    const contextValue = React.useMemo(() => ({
        state,
        addFile,
        removeFile,
        confirmDuplicates,
        setFilters,
        resetFilters,
        setActiveTab,
        filteredTransactions,
        loadFolderFiles,
        clearAll,
    }), [state, addFile, removeFile, confirmDuplicates, setFilters, resetFilters, setActiveTab, filteredTransactions, loadFolderFiles, clearAll]);

    return (
        <FinanceContext.Provider value={contextValue}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
    return ctx;
}

function deduplicateTransactions(transactions: EnrichedTransaction[]): EnrichedTransaction[] {
    const seen = new Map<string, EnrichedTransaction>();
    for (const t of transactions) {
        const key = t.fitId + ':' + t.accountId;
        seen.set(key, t); // Last one wins
    }
    return Array.from(seen.values());
}
