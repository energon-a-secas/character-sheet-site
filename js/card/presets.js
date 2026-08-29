// Card themes and layout presets.
//
// Themes are pure token sets — the renderer writes them onto the card element as
// CSS custom properties, so adding a theme is a data edit with no renderer change.
// Layouts are output sizes plus a column count; `fixed` layouts crop to the given
// height and drop the lowest-priority blocks, `flow` layouts grow to fit.

export const CARD_THEMES = {
  default: {
    id: 'default',
    name: 'Dark RPG',
    tokens: {
      '--c-bg': '#080b18',
      '--c-bg-2': '#0d0820',
      '--c-panel': 'rgba(255,255,255,0.035)',
      '--c-border': '#1e2140',
      '--c-accent': '#a78bfa',
      '--c-accent-2': '#34d399',
      '--c-text': '#f0f0f0',
      '--c-text-2': '#a8a8b8',
      '--c-muted': '#6f6f88',
    },
  },
  light: {
    id: 'light',
    name: 'Light',
    tokens: {
      '--c-bg': '#ffffff',
      '--c-bg-2': '#f1f3f5',
      '--c-panel': 'rgba(0,0,0,0.025)',
      '--c-border': '#dee2e6',
      '--c-accent': '#5f3dc4',
      '--c-accent-2': '#0b7285',
      '--c-text': '#1a1d21',
      '--c-text-2': '#495057',
      '--c-muted': '#868e96',
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    tokens: {
      '--c-bg': '#0a0014',
      '--c-bg-2': '#1a002e',
      '--c-panel': 'rgba(255,0,255,0.06)',
      '--c-border': '#ff2bd1',
      '--c-accent': '#00f0ff',
      '--c-accent-2': '#ff2bd1',
      '--c-text': '#ffffff',
      '--c-text-2': '#ff8ae8',
      '--c-muted': '#a04ec0',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    tokens: {
      '--c-bg': '#ffffff',
      '--c-bg-2': '#ffffff',
      '--c-panel': 'rgba(0,0,0,0.02)',
      '--c-border': '#e3e3e3',
      '--c-accent': '#111111',
      '--c-accent-2': '#555555',
      '--c-text': '#111111',
      '--c-text-2': '#4a4a4a',
      '--c-muted': '#8c8c8c',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    tokens: {
      '--c-bg': '#2d1b47',
      '--c-bg-2': '#5b2a63',
      '--c-panel': 'rgba(255,255,255,0.06)',
      '--c-border': '#ff6b9d',
      '--c-accent': '#ffd93d',
      '--c-accent-2': '#ff9ecd',
      '--c-text': '#fff8f0',
      '--c-text-2': '#ffc9e0',
      '--c-muted': '#c69ad6',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    tokens: {
      '--c-bg': '#0d1b2a',
      '--c-bg-2': '#1b3a4b',
      '--c-panel': 'rgba(255,255,255,0.045)',
      '--c-border': '#3d6b7d',
      '--c-accent': '#8ee3c8',
      '--c-accent-2': '#f4d58d',
      '--c-text': '#f1faee',
      '--c-text-2': '#cfe3dd',
      '--c-muted': '#7fa3a8',
    },
  },
  paper: {
    id: 'paper',
    name: 'Paper (print)',
    tokens: {
      '--c-bg': '#fbfaf7',
      '--c-bg-2': '#f3f1ea',
      '--c-panel': 'rgba(0,0,0,0.03)',
      '--c-border': '#d9d4c5',
      '--c-accent': '#8a5a2b',
      '--c-accent-2': '#4a6b52',
      '--c-text': '#22201c',
      '--c-text-2': '#4e4a42',
      '--c-muted': '#8b857a',
    },
  },
};

export const CARD_LAYOUTS = {
  vertical: {
    id: 'vertical',
    name: 'Portrait',
    description: 'Tall card. Grows to fit everything.',
    width: 800,
    minHeight: 1000,
    fit: 'flow',
    columns: 1,
  },
  slack: {
    id: 'slack',
    name: 'Wide (Slack)',
    description: '1600×900: fills a Slack or Teams preview.',
    width: 1600,
    height: 900,
    fit: 'fixed',
    columns: 3,
  },
  social: {
    id: 'social',
    name: 'Square',
    description: '1080×1080 for Instagram or LinkedIn.',
    width: 1080,
    height: 1080,
    fit: 'fixed',
    columns: 2,
  },
  a4: {
    id: 'a4',
    name: 'A4 print',
    description: '210×297mm at 96dpi. Vector PDF, selectable text.',
    width: 794,
    height: 1123,
    fit: 'fixed',
    columns: 1,
    print: true,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Just the essentials: 600×800.',
    width: 600,
    height: 800,
    fit: 'fixed',
    columns: 1,
  },
};

export function getTheme(id) {
  return CARD_THEMES[id] || CARD_THEMES.default;
}

export function getLayout(id) {
  return CARD_LAYOUTS[id] || CARD_LAYOUTS.vertical;
}
