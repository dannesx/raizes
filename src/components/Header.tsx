import React from 'react';
import { GitFork, RotateCcw, Key, Moon, Sun, Workflow } from 'lucide-react';

interface HeaderProps {
  memberCount: number;
  relationCount: number;
  onClear: () => void;
  onReorganize: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  memberCount,
  relationCount,
  onClear,
  onReorganize,
  onOpenSettings,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="app-header">
      <div className="app-header__logo">
        <div className="logo-icon-wrapper">
          <GitFork size={20} />
        </div>
        <div className="logo-text-group">
          <h1 className="logo-title">Raízes</h1>
          <span className="logo-subtitle">Árvore Genealógica com IA</span>
        </div>
      </div>

      <div className="app-header__center">
        {memberCount > 0 && (
          <div className="stats-badge">
            <span className="stats-pill">
              <strong>{memberCount}</strong> {memberCount === 1 ? 'membro' : 'membros'}
            </span>
            {relationCount > 0 && (
              <span className="stats-pill">
                <strong>{relationCount}</strong> {relationCount === 1 ? 'conexão' : 'conexões'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="app-header__actions">
        {memberCount > 0 && (
          <>
            <button
              type="button"
              className="m3-button m3-button--text header-reorganize-btn"
              title="Reorganizar árvore na melhor distribuição possível"
              onClick={onReorganize}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '13px',
                gap: '6px',
                backgroundColor: 'var(--md-sys-color-secondary-container)',
                color: 'var(--md-sys-color-on-secondary-container)',
              }}
            >
              <Workflow size={16} />
              <span>Reorganizar Árvore</span>
            </button>

            <button
              type="button"
              className="m3-icon-button"
              title="Limpar árvore genealógica"
              onClick={onClear}
            >
              <RotateCcw size={18} />
            </button>
          </>
        )}

        <button
          type="button"
          className="m3-icon-button"
          title="Configurar chave da API Groq"
          onClick={onOpenSettings}
        >
          <Key size={18} />
        </button>

        <button
          type="button"
          className="m3-icon-button"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
          onClick={onToggleTheme}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
