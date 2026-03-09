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
        <div className="settings-container fade-in stagger-2">

            <IntegrationsSection />

            <section className="settings-section">
                <div className="settings-section-header">
                    <div className="settings-section-title">
                        <h2>Arquivos de Dados</h2>
                        <p>Gerencie seus extratos OFX e a base de dados local.</p>
                    </div>
                    {state.parsedFiles.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="btn-clear"
                            title="Limpar todos os dados"
                        >
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            Limpar Dados
                        </button>
                    )}
                </div>
                <FileUploader />
            </section>

            <section className="settings-section">
                <div className="settings-section-header" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="settings-section-title">
                        <h2>Categorias</h2>
                        <p>Personalize regras, cores e identificadores para classificação automática.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button
                            onClick={handleReset}
                            className="btn-secondary"
                        >
                            Resetar Padrão
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-primary"
                        >
                            + Nova Categoria
                        </button>
                    </div>
                </div>

                <div className="category-list-container">
                    {state.categories.map(cat => (
                        <div key={cat.id} className="category-card" style={{ borderLeft: `4px solid ${cat.color}` }}>
                            <div className="category-card-info">
                                <span className="category-card-emoji">{cat.emoji}</span>
                                <div>
                                    <h3 className="category-card-name">{cat.name}</h3>
                                    <p className="category-card-keywords">
                                        {cat.keywords.length > 0 ? cat.keywords.join(' • ') : 'Sem palavras-chave'}
                                    </p>
                                </div>
                            </div>
                            <div className="category-card-actions">
                                <button
                                    onClick={() => setEditingCategory(cat)}
                                    className="btn-icon"
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
                                        className="btn-icon btn-icon-danger"
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
