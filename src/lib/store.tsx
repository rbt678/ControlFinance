'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { ParsedOFX, OFXTransaction, parseOFX } from './ofx-parser';
import { Category, DEFAULT_CATEGORIES, categorizeTransaction } from './categories';
import { loadFromLocalStorage, addFileToStorage, removeFileFromStorage, clearLocalStorage, saveCategoriesToLocalStorage, loadCategoriesFromLocalStorage, saveDriveFolderToLocalStorage, loadDriveFolderFromLocalStorage, saveRecurringToLocalStorage, loadRecurringFromLocalStorage } from './storage';
import { RecurringExpense, refreshManualRecurring } from './recurring';

export interface EnrichedTransaction extends OFXTransaction {
    categories: Category[];
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
    categoryMatchMode: 'ANY' | 'ALL' | 'EXACT' | 'NONE';
    types: ('CREDIT' | 'DEBIT')[];
    accounts: string[];
    amountMin: string;
    amountMax: string;
    search: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
    added: number;
    found: number;
    errors: string[];
}

interface FinanceState {
    parsedFiles: ParsedOFX[];
    transactions: EnrichedTransaction[];
    filters: Filters;
    duplicates: DuplicateInfo[];
    showDuplicateModal: boolean;
    pendingFile: { fileName: string; content: string } | null;
    activeTab: 'dashboard' | 'transactions' | 'recurring' | 'raw' | 'settings';
    isLoading: boolean;
    categories: Category[];
    googleDriveFolder: { id: string, name: string } | null;
    syncStatus: SyncStatus;
    lastSyncAt: number | null;
    syncResult: SyncResult | null;
    recurringExpenses: RecurringExpense[];
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
    | { type: 'LOAD_ALL'; payload: { files: ParsedOFX[]; transactions: EnrichedTransaction[] } }
    | { type: 'ADD_CATEGORY'; payload: Category }
    | { type: 'UPDATE_CATEGORY'; payload: Category }
    | { type: 'DELETE_CATEGORY'; payload: string }
    | { type: 'SET_CATEGORIES'; payload: Category[] }
    | { type: 'SET_GOOGLE_DRIVE_FOLDER'; payload: { id: string, name: string } | null }
    | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
    | { type: 'SET_LAST_SYNC_AT'; payload: number }
    | { type: 'SET_SYNC_RESULT'; payload: SyncResult | null }
    | { type: 'SET_RECURRING'; payload: RecurringExpense[] }
    | { type: 'ADD_MANUAL_RECURRING'; payload: RecurringExpense }
    | { type: 'UPDATE_RECURRING'; payload: RecurringExpense }
    | { type: 'DELETE_RECURRING'; payload: string };

const defaultFilters: Filters = {
    dateStart: '',
    dateEnd: '',
    categories: [],
    categoryMatchMode: 'ANY',
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
    categories: DEFAULT_CATEGORIES,
    googleDriveFolder: null,
    syncStatus: 'idle',
    lastSyncAt: null,
    syncResult: null,
    recurringExpenses: [],
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
        case 'ADD_CATEGORY': {
            const newCats = [...state.categories, action.payload];
            return { ...state, categories: newCats, transactions: reevaluateAll(state.parsedFiles, newCats) };
        }
        case 'UPDATE_CATEGORY': {
            const newCats = state.categories.map(c => c.id === action.payload.id ? action.payload : c);
            return { ...state, categories: newCats, transactions: reevaluateAll(state.parsedFiles, newCats) };
        }
        case 'DELETE_CATEGORY': {
            const newCats = state.categories.filter(c => c.id !== action.payload);
            return { ...state, categories: newCats, transactions: reevaluateAll(state.parsedFiles, newCats) };
        }
        case 'SET_CATEGORIES':
            return { ...state, categories: action.payload, transactions: reevaluateAll(state.parsedFiles, action.payload) };
        case 'SET_GOOGLE_DRIVE_FOLDER':
            return { ...state, googleDriveFolder: action.payload };
        case 'SET_SYNC_STATUS':
            return { ...state, syncStatus: action.payload };
        case 'SET_LAST_SYNC_AT':
            return { ...state, lastSyncAt: action.payload };
        case 'SET_SYNC_RESULT':
            return { ...state, syncResult: action.payload };
        case 'SET_RECURRING':
            return { ...state, recurringExpenses: action.payload };
        case 'ADD_MANUAL_RECURRING': {
            const newList = [...state.recurringExpenses, action.payload];
            const merged = refreshManualRecurring(newList, state.transactions);
            return { ...state, recurringExpenses: merged };
        }
        case 'UPDATE_RECURRING': {
            const updated = state.recurringExpenses.map(e =>
                e.id === action.payload.id ? action.payload : e
            );
            const merged = refreshManualRecurring(updated, state.transactions);
            return { ...state, recurringExpenses: merged };
        }
        case 'DELETE_RECURRING':
            return { ...state, recurringExpenses: state.recurringExpenses.filter(e => e.id !== action.payload) };
        default:
            return state;
    }
}

function enrichTransactions(parsed: ParsedOFX, categories: Category[]): EnrichedTransaction[] {
    return parsed.transactions.map(t => ({
        ...t,
        categories: categorizeTransaction(t.memo, categories),
        fileName: parsed.fileName,
    }));
}

function reevaluateAll(parsedFiles: ParsedOFX[], categories: Category[]): EnrichedTransaction[] {
    const all = parsedFiles.flatMap(f => enrichTransactions(f, categories));
    return deduplicateTransactions(all);
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
    addCategory: (cat: Category) => void;
    updateCategory: (cat: Category) => void;
    deleteCategory: (id: string) => void;
    resetCategories: () => void;
    setGoogleDriveFolder: (folder: { id: string, name: string } | null) => void;
    syncGoogleDrive: () => Promise<SyncResult | null>;
    addManualRecurring: (expense: RecurringExpense) => void;
    updateRecurring: (expense: RecurringExpense) => void;
    deleteRecurring: (id: string) => void;
    refreshRecurring: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Load from localStorage on mount
    useEffect(() => {
        const storedDriveFolder = loadDriveFolderFromLocalStorage();
        if (storedDriveFolder) {
            dispatch({ type: 'SET_GOOGLE_DRIVE_FOLDER', payload: storedDriveFolder });
        }

        const storedCats = loadCategoriesFromLocalStorage();
        if (storedCats && storedCats.length > 0) {
            dispatch({ type: 'SET_CATEGORIES', payload: storedCats });
        }

        const storedRecurring = loadRecurringFromLocalStorage();
        if (storedRecurring && storedRecurring.length > 0) {
            dispatch({ type: 'SET_RECURRING', payload: storedRecurring });
        }

        const stored = loadFromLocalStorage();
        if (stored.length > 0) {
            const allFiles: ParsedOFX[] = [];
            const allTransactions: EnrichedTransaction[] = [];
            const currentCats = storedCats && storedCats.length > 0 ? storedCats : DEFAULT_CATEGORIES;

            for (const file of stored) {
                try {
                    const parsed = parseOFX(file.content, file.fileName);
                    allFiles.push(parsed);
                    allTransactions.push(...enrichTransactions(parsed, currentCats));
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
            const enriched = enrichTransactions(parsed, state.categories);

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
    }, [state.transactions, state.categories]);

    const removeFile = useCallback((fileName: string) => {
        dispatch({ type: 'REMOVE_FILE', payload: fileName });
        removeFileFromStorage(fileName);
    }, []);

    const confirmDuplicates = useCallback((overwrite: boolean) => {
        if (state.pendingFile) {
            if (overwrite) {
                const parsed = parseOFX(state.pendingFile.content, state.pendingFile.fileName);
                const enriched = enrichTransactions(parsed, state.categories);
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
    }, [state.pendingFile, state.transactions, state.duplicates, state.categories]);

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
                    allTransactions.push(...enrichTransactions(parsed, state.categories));
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
    }, [state.parsedFiles, state.transactions, state.categories]);

    const clearAll = useCallback(() => {
        dispatch({ type: 'LOAD_ALL', payload: { files: [], transactions: [] } });
        clearLocalStorage();
    }, []);

    const addCategory = useCallback((cat: Category) => {
        dispatch({ type: 'ADD_CATEGORY', payload: cat });
    }, []);

    const updateCategory = useCallback((cat: Category) => {
        dispatch({ type: 'UPDATE_CATEGORY', payload: cat });
    }, []);

    const deleteCategory = useCallback((id: string) => {
        dispatch({ type: 'DELETE_CATEGORY', payload: id });
    }, []);

    const resetCategories = useCallback(() => {
        dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
    }, []);

    const setGoogleDriveFolder = useCallback((folder: { id: string, name: string } | null) => {
        saveDriveFolderToLocalStorage(folder);
        dispatch({ type: 'SET_GOOGLE_DRIVE_FOLDER', payload: folder });
    }, []);

    const refreshRecurring = useCallback(() => {
        const merged = refreshManualRecurring(state.recurringExpenses, state.transactions);
        dispatch({ type: 'SET_RECURRING', payload: merged });
        saveRecurringToLocalStorage(merged);
    }, [state.transactions, state.recurringExpenses]);

    const addManualRecurring = useCallback((expense: RecurringExpense) => {
        dispatch({ type: 'ADD_MANUAL_RECURRING', payload: expense });
    }, []);

    const updateRecurring = useCallback((expense: RecurringExpense) => {
        dispatch({ type: 'UPDATE_RECURRING', payload: expense });
    }, []);

    const deleteRecurring = useCallback((id: string) => {
        dispatch({ type: 'DELETE_RECURRING', payload: id });
    }, []);

    const syncGoogleDrive = useCallback(async (): Promise<SyncResult | null> => {
        if (!state.googleDriveFolder) return null;
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
        dispatch({ type: 'SET_SYNC_RESULT', payload: null });

        try {
            const res = await fetch('/api/drive/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId: state.googleDriveFolder.id })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const files: { fileName: string; content: string }[] = data.files || [];
            const apiErrors: string[] = data.errors || [];

            const allFiles: ParsedOFX[] = [...state.parsedFiles];
            const allTransactions: EnrichedTransaction[] = [...state.transactions];
            let addedCount = 0;
            const parseErrors: string[] = [];

            for (const file of files) {
                if (allFiles.some(f => f.fileName === file.fileName)) continue;
                try {
                    const parsed = parseOFX(file.content, file.fileName);
                    allFiles.push(parsed);
                    allTransactions.push(...enrichTransactions(parsed, state.categories));
                    addFileToStorage(file.fileName, file.content);
                    addedCount++;
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
                    parseErrors.push(`${file.fileName}: ${msg}`);
                }
            }

            if (addedCount > 0) {
                dispatch({
                    type: 'LOAD_ALL',
                    payload: {
                        files: allFiles,
                        transactions: deduplicateTransactions(allTransactions),
                    },
                });
            }

            const result: SyncResult = {
                added: addedCount,
                found: data.found || files.length,
                errors: [...apiErrors, ...parseErrors],
            };

            dispatch({ type: 'SET_SYNC_STATUS', payload: 'success' });
            dispatch({ type: 'SET_LAST_SYNC_AT', payload: Date.now() });
            dispatch({ type: 'SET_SYNC_RESULT', payload: result });
            return result;

        } catch (e) {
            console.error('Falha ao sincronizar arquivos do drive:', e);
            const result: SyncResult = {
                added: 0,
                found: 0,
                errors: [e instanceof Error ? e.message : 'Erro desconhecido'],
            };
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
            dispatch({ type: 'SET_SYNC_RESULT', payload: result });
            return result;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.googleDriveFolder, state.parsedFiles, state.transactions, state.categories]);

    useEffect(() => {
        // Debounce or save whenever categories change, but prevent initial render save if equal to default
        if (state.categories !== DEFAULT_CATEGORIES) {
            saveCategoriesToLocalStorage(state.categories);
        }
    }, [state.categories]);

    // Persist recurring expenses whenever they change
    useEffect(() => {
        if (state.recurringExpenses.length > 0) {
            saveRecurringToLocalStorage(state.recurringExpenses);
        }
    }, [state.recurringExpenses]);

    // Auto-refresh recurring detection when transactions change
    useEffect(() => {
        if (state.transactions.length > 0) {
            const merged = refreshManualRecurring(state.recurringExpenses, state.transactions);
            dispatch({ type: 'SET_RECURRING', payload: merged });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.transactions]);

    const filteredTransactions = React.useMemo(() => {
        let result = state.transactions;
        const { dateStart, dateEnd, categories, categoryMatchMode, types, accounts, amountMin, amountMax, search } = state.filters;

        if (dateStart) result = result.filter(t => t.date >= dateStart);
        if (dateEnd) result = result.filter(t => t.date <= dateEnd);
        if (categories.length > 0) {
            switch (categoryMatchMode) {
                case 'ANY':
                    // Must have AT LEAST ONE of the selected categories
                    result = result.filter(t => t.categories.some(c => categories.includes(c.id)));
                    break;
                case 'ALL':
                    // Must have ALL of the selected categories (can have others)
                    result = result.filter(t => categories.every(c => t.categories.some(tc => tc.id === c)));
                    break;
                case 'EXACT':
                    // Must have ALL selected categories AND ONLY the selected categories
                    result = result.filter(t =>
                        categories.every(c => t.categories.some(tc => tc.id === c)) &&
                        t.categories.every(tc => categories.includes(tc.id))
                    );
                    break;
                case 'NONE':
                    // Must NOT have ANY of the selected categories
                    result = result.filter(t => !t.categories.some(c => categories.includes(c.id)));
                    break;
            }
        }
        if (types.length > 0) result = result.filter(t => types.includes(t.type));
        if (accounts.length > 0) result = result.filter(t => accounts.includes(t.accountId));
        if (amountMin) result = result.filter(t => Math.abs(t.amount) >= parseFloat(amountMin));
        if (amountMax) result = result.filter(t => Math.abs(t.amount) <= parseFloat(amountMax));
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(t => t.memo.toLowerCase().includes(s));
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
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategories,
        setGoogleDriveFolder,
        syncGoogleDrive,
        addManualRecurring,
        updateRecurring,
        deleteRecurring,
        refreshRecurring,
    }), [state, addFile, removeFile, confirmDuplicates, setFilters, resetFilters, setActiveTab, filteredTransactions, loadFolderFiles, clearAll, addCategory, updateCategory, deleteCategory, resetCategories, setGoogleDriveFolder, syncGoogleDrive, addManualRecurring, updateRecurring, deleteRecurring, refreshRecurring]);

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
