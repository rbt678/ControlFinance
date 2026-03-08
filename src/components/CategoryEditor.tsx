'use client';

import { useState } from 'react';
import { Category } from '@/lib/categories';
import { useFinance } from '@/lib/store';

interface Props {
    category?: Category;
    onClose: () => void;
}

export default function CategoryEditor({ category, onClose }: Props) {
    const { addCategory, updateCategory } = useFinance();

    const [name, setName] = useState(category?.name || '');
    const [emoji, setEmoji] = useState(category?.emoji || '📋');
    const [color, setColor] = useState(category?.color || 'hsl(200, 80%, 55%)');
    const [keywordsText, setKeywordsText] = useState(category?.keywords.join(', ') || '');

    // Pre-defined palette without purple
    const palette = [
        'hsl(0, 0%, 50%)',    // Gray
        'hsl(25, 90%, 55%)',  // Orange
        'hsl(0, 80%, 55%)',   // Red
        'hsl(120, 50%, 45%)', // Green
        'hsl(160, 60%, 45%)', // Teal
        'hsl(200, 80%, 55%)', // Blue
        'hsl(45, 90%, 50%)',  // Yellow
        'hsl(340, 75%, 55%)', // Pink/Red
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const keywords = keywordsText
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        const newCat: Category = {
            id: category ? category.id : `cat_${Date.now()}`,
            name: name.trim() || 'Nova Categoria',
            emoji: emoji.trim() || '📋',
            color,
            keywords,
        };

        if (category) {
            updateCategory(newCat);
        } else {
            addCategory(newCat);
        }

        onClose();
    };

    return (
        <div className="modal-overlay fade-in">
            <div className="modal-content" style={{ maxWidth: '500px', padding: '0', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {category ? 'Editar Categoria' : 'Nova Categoria'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Emoji</label>
                            <input
                                type="text"
                                value={emoji}
                                onChange={e => setEmoji(e.target.value)}
                                style={{ padding: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', textAlign: 'center', fontSize: '20px' }}
                                maxLength={2}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Nome da Categoria</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={{ padding: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cor</label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {palette.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setColor(p)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: p,
                                        border: color === p ? '2px solid white' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all var(--transition-fast)',
                                        outline: color === p ? `2px solid ${p}` : 'none', outlineOffset: '2px'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Palavras-chave (separadas por vírgula)</label>
                        <textarea
                            value={keywordsText}
                            onChange={e => setKeywordsText(e.target.value)}
                            style={{ padding: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', minHeight: '80px', resize: 'vertical' }}
                            placeholder="ex: uber, 99, gasolina, posto..."
                        />
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Transações contendo estas palavras na descrição (memo) serão automaticamente categorizadas aqui.
                        </span>
                    </div>

                    <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '12px' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" style={{ padding: '10px 20px', border: '1px solid var(--color-accent)', background: 'var(--color-accent)', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>
                            {category ? 'Salvar Alterações' : 'Criar Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
