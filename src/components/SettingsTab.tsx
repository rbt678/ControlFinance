'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/store';
import { Category } from '@/lib/categories';
import CategoryEditor from './CategoryEditor';
import FileUploader from './FileUploader';
import IntegrationsSection from './IntegrationsSection';

export default function SettingsTab() {
    const { state, deleteCategory, resetCategories, clearAll } = useFinance();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = (id: string, name: string) => {
        if (id === 'other') {
            alert('A categoria "Outros" não pode ser deletada.');
            return;
        }
        if (window.confirm(`Tem certeza que deseja deletar a categoria "${name}"?\nAs transações associadas serão reavaliadas.`)) {
            deleteCategory(id);
        }
    };

    const handleReset = () => {
        if (window.confirm('Toda a customização será perdida. Retornar categorias ao padrão?')) {
            resetCategories();
        }
    };

    return (
        <div className="settings-container fade-in stagger-2" style={{ padding: '0', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>

            <IntegrationsSection />

            <section className="settings-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Arquivos de Dados</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Faça upload de extratos OFX para atualizar seus dados financeiros.</p>
                    </div>
                    {state.parsedFiles.length > 0 && (
                        <button
                            onClick={clearAll}
                            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                            title="Limpar todos os dados"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                Limpar Todos os Dados
                            </div>
                        </button>
                    )}
                </div>
                <FileUploader />
            </section>

            <section className="settings-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Categorias</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Personalize regras, cores e identificadores.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button
                            onClick={handleReset}
                            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                        >
                            Resetar Padrão
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{ padding: '8px 16px', background: 'var(--color-accent)', border: '1px solid var(--color-active, #000)', color: '#000', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                        >
                            + Nova Categoria
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {state.categories.map(cat => (
                        <div key={cat.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: 'var(--space-md) var(--space-lg)',
                            background: 'var(--color-card)', border: '1px solid var(--color-border)',
                            borderLeft: `4px solid ${cat.color}`, borderRadius: 'var(--radius-sm)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '24px', filter: 'grayscale(100%)' }}>{cat.emoji}</span>
                                <div>
                                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)' }}>{cat.name}</h3>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                        {cat.keywords.length > 0 ? cat.keywords.join(' • ') : 'Sem palavras-chave'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button
                                    onClick={() => setEditingCategory(cat)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '8px' }}
                                    title="Editar"
                                >
                                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                {cat.id !== 'other' && (
                                    <button
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '8px' }}
                                        title="Excluir"
                                    >
                                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}>
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {(isCreating || editingCategory) && (
                    <CategoryEditor
                        category={editingCategory || undefined}
                        onClose={() => {
                            setIsCreating(false);
                            setEditingCategory(null);
                        }}
                    />
                )}
            </section>
        </div>
    );
}
