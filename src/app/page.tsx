'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, KeyRound, ExternalLink, Download, FileText, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const THEMES = [
  'Économie',
  'Politique',
  'Urbanisme',
  'Écologie',
  'Éducation',
  'Santé',
  'Technologies',
  'Travail',
  'Culture',
  'Justice',
  'Autre...',
];

/* ---------- API KEY SCREEN ---------- */
export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);

  if (!isKeyValid) {
    return (
      <main className="app-container">
        <div className="api-key-screen">
          <div className="api-key-card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <KeyRound size={48} color="#4361ee" />
            </div>
            <h1>Bienvenue</h1>
            <p>
              Pour commencer la simulation du Professeur d&apos;Argumentation (niveau B2),
              veuillez fournir votre clé API Google Gemini.
            </p>
            <div className="api-input-group">
              <input
                type="password"
                placeholder="Ex: AIzaSyB..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apiKey && setIsKeyValid(true)}
              />
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => setIsKeyValid(true)}
                disabled={!apiKey}
              >
                Commencer
              </button>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="helper-link"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Je n&apos;ai pas de clé API (Google AI Studio) <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <ChatApp apiKey={apiKey} />;
}

/* ---------- THEME SELECTOR ---------- */
function ThemeSelector({ onSelect }: { onSelect: (theme: string) => void }) {
  const [selected, setSelected] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const isAutre = selected === 'Autre...';
  const canSubmit = isAutre ? customTheme.trim().length > 0 : selected.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const theme = isAutre ? customTheme.trim() : selected;
    onSelect(theme);
  };

  return (
    <div className="theme-selector glass-panel">
      <p className="theme-selector-label">Choisissez un thème pour commencer :</p>
      <div className="theme-select-wrapper">
        <select
          className="theme-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="" disabled>— Sélectionner un thème —</option>
          {THEMES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <ChevronDown size={18} className="theme-select-icon" />
      </div>

      {isAutre && (
        <input
          type="text"
          className="theme-custom-input"
          placeholder="Votre thème personnalisé..."
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
      )}

      <button
        className="btn btn-primary"
        style={{ marginTop: '0.75rem', justifyContent: 'center', width: '100%' }}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Commencer avec ce thème
      </button>
    </div>
  );
}

/* ---------- CHAT APP ---------- */
function ChatApp({ apiKey }: { apiKey: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: "Bienvenue ! Je suis votre Professeur de Français. Ensemble, nous allons construire une argumentation solide de niveau B2 — de la problématique jusqu'à la rédaction finale.\n\nPour commencer, **quel grand thème vous intéresse ?** Faites votre choix ci-dessous :"
    }
  ]);
  const [themeChosen, setThemeChosen] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Auto-grow textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxH = 200;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
    ta.style.overflowY = ta.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [localInput]);

  /* Core send */
  const doSend = useCallback(async (content: string, allMessages: Message[]) => {
    setIsLoading(true);
    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKey
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `❌ Erreur: ${err.error || 'Inconnue'}` } : m
        ));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                ));
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: unknown) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `❌ Erreur réseau: ${(err as Error).message}` }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  /* Send from textarea */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setLocalInput('');
    await doSend(content, allMessages);
  }, [messages, isLoading, doSend]);

  /* Called by ThemeSelector */
  const handleThemeSelect = useCallback((theme: string) => {
    setThemeChosen(true);
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: theme };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    doSend(theme, allMessages);
  }, [messages, doSend]);

  const requestExport = () => {
    sendMessage("[SYSTEM_CMD_EXPORT] S'il te plaît, rédige le compte-rendu complet (Étape 4) de ce que nous avons fait jusqu'à présent.");
  };

  const visibleMessages = messages.filter(m => !m.content.includes('[SYSTEM_CMD_EXPORT]'));

  function renderContent(content: string) {
    if (!content) return <span className="typing-cursor" />;
    return content.split('\n').map((line, i) => {
      if (!line) return <br key={i} />;
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i}>
            {parts.map((part, idx) =>
              idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
            )}
          </p>
        );
      }
      return <p key={i}>{line}</p>;
    });
  }

  return (
    <main className="app-container">
      <header className="app-header glass">
        <div className="header-title">
          <FileText color="#4361ee" />
          <span>Professeur d&apos;Argumentation B2</span>
        </div>
        <button
          onClick={requestExport}
          disabled={isLoading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
          title="Générer un compte-rendu"
        >
          <Download size={16} />
          Générer Compte-rendu
        </button>
      </header>

      <div className="main-content glass-panel">
        <div className="chat-container">
          {visibleMessages.map((m) => (
            <div key={m.id} className={`message-wrapper ${m.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`message ${m.role === 'user' ? 'user' : 'ai'}`}>
                {renderContent(m.content)}
              </div>
            </div>
          ))}

          {/* Theme selector appears after the first assistant message if theme not yet chosen */}
          {!themeChosen && !isLoading && (
            <div className="message-wrapper ai">
              <ThemeSelector onSelect={handleThemeSelect} />
            </div>
          )}

          {isLoading && (
            <div className="message-wrapper ai">
              <div className="message ai typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area glass">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={themeChosen ? 'Écrivez votre réponse ici...' : 'Ou écrivez directement votre thème...'}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (localInput.trim()) {
                  setThemeChosen(true);
                  sendMessage(localInput);
                }
              }
            }}
          />
          <button
            type="button"
            className="btn-send"
            disabled={isLoading || !localInput?.trim()}
            onClick={() => {
              if (localInput.trim()) {
                setThemeChosen(true);
                sendMessage(localInput);
              }
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
