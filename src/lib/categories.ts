export interface Category {
    id: string;
    name: string;
    emoji: string;
    color: string; // HSL accent color
    keywords: string[];
}

export const CATEGORIES: Category[] = [
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

export function categorizeTransaction(memo: string): Category {
    const lowerMemo = memo.toLowerCase();

    for (const category of CATEGORIES) {
        if (category.id === 'other') continue;
        for (const keyword of category.keywords) {
            if (lowerMemo.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return CATEGORIES[CATEGORIES.length - 1]; // "Outros"
}

export function getCategoryById(id: string): Category {
    return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
