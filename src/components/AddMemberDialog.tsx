import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, X, Plus, Key, Loader2, Info } from 'lucide-react';
import { storageService } from '../services/storageService';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (contextText: string, customApiKey?: string) => Promise<void>;
  isLoading: boolean;
  hasMembers: boolean;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  hasMembers,
}) => {
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState(() => storageService.getCustomApiKey());
  const [showKeyField, setShowKeyField] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  const isKeyConfigured = Boolean(
    (envKey && envKey.trim() !== '' && !envKey.includes('your_groq_api_key_here')) ||
      (apiKey && apiKey.trim() !== '')
  );

  const suggestions = hasMembers
    ? [
        'minha mae chama gisleine',
        'meu pai se chama roberto',
        'tenho um cachorro chamado thor',
        'minha gatinha se chama luna',
        'sou casado com beatriz',
      ]
    : [
        'meu nome é daniel',
        'eu me chamo lucas',
        'meu nome é camila',
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    setErrorMessage(null);
    try {
      if (apiKey.trim()) {
        storageService.setCustomApiKey(apiKey.trim());
      }
      await onSubmit(text.trim(), apiKey.trim() || undefined);
      setText('');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar';
      setErrorMessage(msg);
      if (msg.includes('Groq') || msg.includes('API') || msg.includes('Chave')) {
        setShowKeyField(true);
      }
    }
  };

  const handleApplySuggestion = (sug: string) => {
    setText(sug);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-header">
            <div className="dialog-title-group">
              <div className="dialog-icon-badge">
                <Sparkles size={20} />
              </div>
              <div>
                <Dialog.Title className="dialog-title">
                  {hasMembers ? 'Adicionar à Árvore' : 'Iniciar Árvore Genealógica'}
                </Dialog.Title>
                <Dialog.Description className="dialog-description">
                  {hasMembers
                    ? 'Adicione pais, mães, filhos, irmãos, cônjuges ou pets em linguagem natural.'
                    : 'Digite quem você é para começar sua árvore (ex: "meu nome é daniel").'}
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button className="dialog-close-btn" aria-label="Fechar">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Textarea */}
            <div className="text-field-container">
              <label htmlFor="family-context" className="text-field-label">
                Contexto / Frase
              </label>
              <textarea
                id="family-context"
                rows={3}
                className="text-field-input"
                placeholder={
                  hasMembers
                    ? 'Ex: "minha mae chama gisleine", "meu pai é o carlos", "tenho um irmão chamado felipe"...'
                    : 'Ex: "meu nome é daniel"...'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Suggestions Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 500 }}>
                Sugestões rápidas:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="m3-suggestion-chip"
                    disabled={isLoading}
                  >
                    <Plus size={13} />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="m3-error-banner">
                <Info size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* API Key Toggle/Field */}
            <div style={{ marginTop: '4px' }}>
              {!showKeyField && !isKeyConfigured && (
                <button
                  type="button"
                  onClick={() => setShowKeyField(true)}
                  className="m3-text-btn"
                  style={{ fontSize: '12px', color: 'var(--md-sys-color-error)', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                >
                  <Key size={14} />
                  <span>Configurar Chave da API Groq</span>
                </button>
              )}

              {showKeyField && (
                <div className="api-key-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label htmlFor="groq-key" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                      Groq API Key (opcional se já definida no .env)
                    </label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}
                    >
                      Obter chave gratuita ↗
                    </a>
                  </div>
                  <input
                    id="groq-key"
                    type="password"
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="text-field-input"
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button type="button" className="m3-button m3-button--text" disabled={isLoading}>
                  Cancelar
                </button>
              </Dialog.Close>

              <button
                type="submit"
                className="m3-button m3-button--filled"
                disabled={isLoading || !text.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Processando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Gerar / Atualizar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
