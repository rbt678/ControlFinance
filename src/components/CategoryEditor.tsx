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
            <div className="modal" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{category ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                        <button onClick={onClose} className="btn-icon">
                            <svg viewBox="0 0 24 24" style={{ width: 24, height: 24, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 'var(--space-md)' }}>
                            <div className="filter-group">
                                <label>Emoji</label>
                                <input
                                    type="text"
                                    value={emoji}
                                    onChange={e => setEmoji(e.target.value)}
                                    className="filter-input text-center"
                                    style={{ fontSize: '24px', textAlign: 'center' }}
                                    maxLength={2}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="filter-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Cor do Sinal</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                {palette.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setColor(p)}
                                        style={{
                                            width: '28px', height: '28px', borderRadius: '0px', background: p,
                                            border: color === p ? '2px solid var(--color-text)' : '2px solid transparent',
                                            cursor: 'pointer', transition: 'all var(--transition-fast)',
                                            boxShadow: color === p ? `0 0 10px ${p}` : 'none'
                                        }}
                                        title={p}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Palavras-chave (memo lookup)</label>
                            <textarea
                                value={keywordsText}
                                onChange={e => setKeywordsText(e.target.value)}
                                className="filter-input"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                placeholder="ex: uber, 99, gasolina, posto..."
                            />
                            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Transações com estes termos serão classificadas automaticamente.
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {category ? 'Salvar Alterações' : 'Criar Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
