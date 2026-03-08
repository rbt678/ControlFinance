import { Category } from './categories';

const STORAGE_KEY = 'controlfinance_data';
const STORAGE_VERSION = 1;

interface StoredData {
    version: number;
    files: { fileName: string; content: string }[];
    categories?: string; // Serialized categories
}

export function saveToLocalStorage(files: { fileName: string; content: string }[]): void {
    try {
        const data: StoredData = {
            version: STORAGE_VERSION,
            files,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

export function loadFromLocalStorage(): { fileName: string; content: string }[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data: StoredData = JSON.parse(raw);
        if (data.version !== STORAGE_VERSION) {
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }
        return data.files || [];
    } catch {
        return [];
    }
}

export function clearLocalStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function addFileToStorage(fileName: string, content: string): void {
    const existing = loadFromLocalStorage();
    const idx = existing.findIndex(f => f.fileName === fileName);
    if (idx !== -1) {
        existing[idx] = { fileName, content };
    } else {
        existing.push({ fileName, content });
    }
    saveToLocalStorage(existing);
}

export function removeFileFromStorage(fileName: string): void {
    const existing = loadFromLocalStorage();
    const filtered = existing.filter(f => f.fileName !== fileName);
    saveToLocalStorage(filtered);
}

const CATEGORIES_STORAGE_KEY = 'controlfinance_categories_v1';

export function saveCategoriesToLocalStorage(categories: Category[]): void {
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
        console.error('Failed to save categories to localStorage:', e);
    }
}

export function loadCategoriesFromLocalStorage(): Category[] | null {
    try {
        const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
