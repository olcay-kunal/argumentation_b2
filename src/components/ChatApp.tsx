'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../utils/constants';
import ThemeSelector from './ThemeSelector';

interface ChatAppProps {
  apiKey: string;
}

export default function ChatApp({ apiKey }: ChatAppProps) {
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
                {m.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <span className="typing-cursor" />
                )}
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
