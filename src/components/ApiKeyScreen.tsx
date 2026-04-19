'use client';

import { KeyRound, ExternalLink } from 'lucide-react';

interface ApiKeyScreenProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onValid: () => void;
}

export default function ApiKeyScreen({ apiKey, setApiKey, onValid }: ApiKeyScreenProps) {
  return (
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
            onKeyDown={(e) => e.key === 'Enter' && apiKey && onValid()}
          />
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center' }}
            onClick={onValid}
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
  );
}
