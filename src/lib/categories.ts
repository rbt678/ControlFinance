export interface Category {
    id: string;
    name: string;
    emoji: string;
    color: string; // HSL accent color
    keywords: string[];
}

export const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'transport',
        name: 'Transporte',
        emoji: '🚗',
        color: 'hsl(200, 80%, 55%)',
        keywords: ['99 ride', 'uber', 'shellbox', 'combustivel', 'posto', 'gasolina', 'bus servico', 'onibus'],
    },
    {
        id: 'food',
        name: 'Alimentação',
        emoji: '🍽️',
        color: 'hsl(25, 90%, 55%)',
        keywords: ['bar ', 'bar do', 'lanchonete', 'spasso', 'restaurante', 'atacadao', 'ifood', 'ifd*', 'zamp', 'mix mogi', 'sushi', 'akazumi', 'sabores'],
    },
    {
        id: 'health',
        name: 'Saúde',
        emoji: '💊',
        color: 'hsl(340, 75%, 55%)',
        keywords: ['farmacia', 'farma', 'drogal', 'biopharmus', 'wellhub', 'laboratorio', 'hyper farma'],
    },
    {
        id: 'shopping',
        name: 'Compras',
        emoji: '🛍️',
        color: 'hsl(280, 60%, 55%)',
        keywords: ['mercadolivre', 'shopee', 'havan', 'pernambucanas', 'barbosa', 'celinha', 'calcados', 'kimoto', 'magalu', 'mlp*', 'corebeleza', 'bomboniere'],
    },
    {
        id: 'services',
        name: 'Transferências',
        emoji: '💸',
        color: 'hsl(160, 60%, 45%)',
        keywords: ['pix', 'transferencia', 'transferência', 'pagamento de fatura', 'pagamento recebido'],
    },
    {
        id: 'subscriptions',
        name: 'Assinaturas',
        emoji: '📱',
        color: 'hsl(45, 90%, 50%)',
        keywords: ['nucel', 'ifood club', 'plano ', 'cartao de todos'],
    },
    {
        id: 'home',
        name: 'Casa',
        emoji: '🏠',
        color: 'hsl(120, 50%, 45%)',
        keywords: ['distribuidora', 'txas comercio', 'evolucao', 'suya'],
    },
    {
        id: 'other',
        name: 'Outros',
        emoji: '📋',
        color: 'hsl(220, 15%, 55%)',
        keywords: [],
    },
];

export function categorizeTransaction(memo: string, categories: Category[]): Category[] {
    const lowerMemo = memo.toLowerCase();
    const matchedCategories: Category[] = [];

    for (const category of categories) {
        if (category.id === 'other') continue;
        for (const keyword of category.keywords) {
            if (lowerMemo.includes(keyword.toLowerCase())) {
                matchedCategories.push(category);
                break; // Stop checking keywords for this category, but continue checking other categories
            }
        }
    }

    if (matchedCategories.length === 0) {
        matchedCategories.push(categories.find(c => c.id === 'other') || categories[categories.length - 1]); // "Outros"
    }

    return matchedCategories;
}

export function getCategoryById(id: string, categories: Category[]): Category {
    return categories.find(c => c.id === id) || categories.find(c => c.id === 'other') || categories[categories.length - 1];
}
