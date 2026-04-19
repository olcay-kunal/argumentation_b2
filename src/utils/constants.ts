export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const THEMES = [
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
