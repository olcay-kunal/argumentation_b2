'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { THEMES } from '../utils/constants';

interface ThemeSelectorProps {
  onSelect: (theme: string) => void;
}

export default function ThemeSelector({ onSelect }: ThemeSelectorProps) {
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
