import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Key, X, Check, ExternalLink } from 'lucide-react';
import { storageService } from '../services/storageService';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const [apiKey, setApiKey] = useState(() => storageService.getCustomApiKey());
  const [saved, setSaved] = useState(false);

  const envKey = import.meta.env.VITE_GROQ_API_KEY;
  const hasEnvKey = Boolean(envKey && envKey.trim() !== '' && !envKey.includes('your_groq_api_key_here'));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.setCustomApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
    }, 800);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: '440px' }}>
          <div className="dialog-header">
            <div className="dialog-title-group">
              <div className="dialog-icon-badge">
                <Key size={20} />
              </div>
              <div>
                <Dialog.Title className="dialog-title">Configurações</Dialog.Title>
                <Dialog.Description className="dialog-description">
                  Chave de acesso à API Groq (LLM ultrarrápido).
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="dialog-close-btn" aria-label="Fechar">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {hasEnvKey ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontSize: '13px',
                }}
              >
                ✓ Uma chave <code>VITE_GROQ_API_KEY</code> foi detectada nas variáveis de ambiente (.env).
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                Você pode definir a chave no arquivo <code>.env</code> ou salvá-la diretamente aqui:
              </div>
            )}

            <div className="text-field-container">
              <label htmlFor="settings-api-key" className="text-field-label">
                Chave da API Groq
              </label>
              <input
                id="settings-api-key"
                type="password"
                className="text-field-input"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--md-sys-color-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <span>Gerar chave gratuita no console Groq</span>
              <ExternalLink size={14} />
            </a>

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button type="button" className="m3-button m3-button--text">
                  Fechar
                </button>
              </Dialog.Close>
              <button type="submit" className="m3-button m3-button--filled">
                {saved ? (
                  <>
                    <Check size={16} />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <span>Salvar Chave</span>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
