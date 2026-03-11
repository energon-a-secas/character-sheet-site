// Card theme configurations
export const CARD_THEMES = {
  default: {
    id: 'default',
    name: 'Dark RPG',
    bg: ['#0a0d20', '#080b18', '#0d0820'],
    border: '#1e2140',
    accent: '#a78bfa',
    textPrimary: '#f0f0f0',
    textSecondary: '#a0a0b0',
    textMuted: '#666680',
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    bg: ['#f8f9fa', '#ffffff', '#f1f3f5'],
    border: '#dee2e6',
    accent: '#5f3dc4',
    textPrimary: '#212529',
    textSecondary: '#495057',
    textMuted: '#868e96',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bg: ['#0a0014', '#150020', '#1a002e'],
    border: '#ff00ff',
    accent: '#00ffff',
    textPrimary: '#ffffff',
    textSecondary: '#ff00ff',
    textMuted: '#8b008b',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    bg: ['#ffffff', '#fafafa', '#f5f5f5'],
    border: '#e0e0e0',
    accent: '#000000',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    bg: ['#2d1b47', '#3d2563', '#4d2f7a'],
    border: '#ff6b9d',
    accent: '#ffd93d',
    textPrimary: '#ffffff',
    textSecondary: '#ffb4d4',
    textMuted: '#c084fc',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    bg: ['#0d1b2a', '#1b263b', '#415a77'],
    border: '#778da9',
    accent: '#a8dadc',
    textPrimary: '#f1faee',
    textSecondary: '#e0e1dd',
    textMuted: '#778da9',
  },
};

export const CARD_LAYOUTS = {
  vertical: {
    id: 'vertical',
    name: 'Vertical (Standard)',
    description: 'Traditional tall card layout',
    width: 800,
    minHeight: 900,
  },
  horizontal: {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Wide landscape layout',
    width: 1200,
    minHeight: 675,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Smaller, condensed layout',
    width: 600,
    minHeight: 800,
  },
  social: {
    id: 'social',
    name: 'Social Media',
    description: 'Square format for Instagram/Twitter',
    width: 1080,
    minHeight: 1080,
  },
};

export function getThemeColors(themeId) {
  return CARD_THEMES[themeId] || CARD_THEMES.default;
}

export function getLayout(layoutId) {
  return CARD_LAYOUTS[layoutId] || CARD_LAYOUTS.vertical;
}
