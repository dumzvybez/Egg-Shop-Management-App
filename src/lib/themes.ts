/**
 * ShopSuite v3.1 — Theme + Background constants.
 *
 * Themes change CSS variables for accent / foreground / card colors.
 * Backgrounds change the body gradient / pattern.
 *
 * Both are stored in Settings and applied by use-theme.ts.
 */

export type ThemeId =
  | 'classic-blue'
  | 'emerald'
  | 'graphite'
  | 'indigo'
  | 'modern-dark'
  | 'light-pro';

export type BackgroundId =
  | 'default'
  | 'soft-gradient'
  | 'glass'
  | 'minimal'
  | 'neutral'
  | 'dark';

export type ThemeDef = {
  id: ThemeId;
  label: string;
  swatch: string;        // CSS color for the picker dot
  isDark: boolean;
  // CSS variables that override :root or .dark
  vars: Record<string, string>;
};

export type BackgroundDef = {
  id: BackgroundId;
  label: string;
  preview: string;       // CSS background for picker preview
};

// ─────────────────────────────────────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES: ThemeDef[] = [
  {
    id: 'modern-dark',
    label: 'Modern Dark',
    swatch: '#fbbf24',
    isDark: true,
    vars: {
      '--background': '#0c0a09',
      '--foreground': '#fef3c7',
      '--card': 'rgba(40, 35, 30, 0.55)',
      '--card-foreground': '#fef3c7',
      '--popover': 'rgba(28, 25, 23, 0.92)',
      '--popover-foreground': '#fef3c7',
      '--primary': '#fbbf24',
      '--primary-foreground': '#1c1917',
      '--secondary': 'rgba(60, 50, 35, 0.5)',
      '--secondary-foreground': '#fef3c7',
      '--muted': 'rgba(255, 255, 255, 0.08)',
      '--muted-foreground': '#d6d3d1',
      '--accent': '#78350f',
      '--accent-foreground': '#fde68a',
      '--destructive': '#ef4444',
      '--border': 'rgba(255, 255, 255, 0.12)',
      '--input': 'rgba(255, 255, 255, 0.08)',
      '--ring': '#fbbf24',
      '--chart-1': '#fbbf24',
      '--chart-2': '#fb923c',
      '--chart-3': '#f87171',
      '--chart-4': '#a3e635',
      '--chart-5': '#22d3ee',
    },
  },
  {
    id: 'classic-blue',
    label: 'Classic Blue',
    swatch: '#2563eb',
    isDark: true,
    vars: {
      '--background': '#0a0f1e',
      '--foreground': '#dbeafe',
      '--card': 'rgba(30, 41, 59, 0.55)',
      '--card-foreground': '#dbeafe',
      '--popover': 'rgba(15, 23, 42, 0.92)',
      '--popover-foreground': '#dbeafe',
      '--primary': '#3b82f6',
      '--primary-foreground': '#0a0f1e',
      '--secondary': 'rgba(51, 65, 85, 0.5)',
      '--secondary-foreground': '#dbeafe',
      '--muted': 'rgba(255, 255, 255, 0.08)',
      '--muted-foreground': '#cbd5e1',
      '--accent': '#1e3a8a',
      '--accent-foreground': '#bfdbfe',
      '--destructive': '#ef4444',
      '--border': 'rgba(255, 255, 255, 0.12)',
      '--input': 'rgba(255, 255, 255, 0.08)',
      '--ring': '#3b82f6',
      '--chart-1': '#3b82f6',
      '--chart-2': '#60a5fa',
      '--chart-3': '#f87171',
      '--chart-4': '#34d399',
      '--chart-5': '#a78bfa',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#10b981',
    isDark: true,
    vars: {
      '--background': '#05140f',
      '--foreground': '#d1fae5',
      '--card': 'rgba(6, 78, 59, 0.45)',
      '--card-foreground': '#d1fae5',
      '--popover': 'rgba(4, 47, 35, 0.92)',
      '--popover-foreground': '#d1fae5',
      '--primary': '#10b981',
      '--primary-foreground': '#05140f',
      '--secondary': 'rgba(20, 83, 65, 0.5)',
      '--secondary-foreground': '#d1fae5',
      '--muted': 'rgba(255, 255, 255, 0.08)',
      '--muted-foreground': '#a7f3d0',
      '--accent': '#064e3b',
      '--accent-foreground': '#a7f3d0',
      '--destructive': '#ef4444',
      '--border': 'rgba(255, 255, 255, 0.12)',
      '--input': 'rgba(255, 255, 255, 0.08)',
      '--ring': '#10b981',
      '--chart-1': '#10b981',
      '--chart-2': '#34d399',
      '--chart-3': '#f87171',
      '--chart-4': '#fbbf24',
      '--chart-5': '#22d3ee',
    },
  },
  {
    id: 'graphite',
    label: 'Graphite',
    swatch: '#71717a',
    isDark: true,
    vars: {
      '--background': '#09090b',
      '--foreground': '#e4e4e7',
      '--card': 'rgba(39, 39, 42, 0.55)',
      '--card-foreground': '#e4e4e7',
      '--popover': 'rgba(24, 24, 27, 0.92)',
      '--popover-foreground': '#e4e4e7',
      '--primary': '#a1a1aa',
      '--primary-foreground': '#09090b',
      '--secondary': 'rgba(63, 63, 70, 0.5)',
      '--secondary-foreground': '#e4e4e7',
      '--muted': 'rgba(255, 255, 255, 0.06)',
      '--muted-foreground': '#a1a1aa',
      '--accent': '#3f3f46',
      '--accent-foreground': '#fafafa',
      '--destructive': '#ef4444',
      '--border': 'rgba(255, 255, 255, 0.10)',
      '--input': 'rgba(255, 255, 255, 0.06)',
      '--ring': '#a1a1aa',
      '--chart-1': '#a1a1aa',
      '--chart-2': '#71717a',
      '--chart-3': '#f87171',
      '--chart-4': '#34d399',
      '--chart-5': '#60a5fa',
    },
  },
  {
    id: 'indigo',
    label: 'Indigo',
    swatch: '#6366f1',
    isDark: true,
    vars: {
      '--background': '#0f0a1e',
      '--foreground': '#e0e7ff',
      '--card': 'rgba(49, 46, 129, 0.45)',
      '--card-foreground': '#e0e7ff',
      '--popover': 'rgba(30, 27, 75, 0.92)',
      '--popover-foreground': '#e0e7ff',
      '--primary': '#818cf8',
      '--primary-foreground': '#0f0a1e',
      '--secondary': 'rgba(67, 56, 202, 0.5)',
      '--secondary-foreground': '#e0e7ff',
      '--muted': 'rgba(255, 255, 255, 0.08)',
      '--muted-foreground': '#c7d2fe',
      '--accent': '#3730a3',
      '--accent-foreground': '#c7d2fe',
      '--destructive': '#ef4444',
      '--border': 'rgba(255, 255, 255, 0.12)',
      '--input': 'rgba(255, 255, 255, 0.08)',
      '--ring': '#818cf8',
      '--chart-1': '#818cf8',
      '--chart-2': '#a78bfa',
      '--chart-3': '#f87171',
      '--chart-4': '#34d399',
      '--chart-5': '#fbbf24',
    },
  },
  {
    id: 'light-pro',
    label: 'Light Professional',
    swatch: '#f59e0b',
    isDark: false,
    vars: {
      '--background': '#fafaf9',
      '--foreground': '#1c1917',
      '--card': 'rgba(255, 255, 255, 0.7)',
      '--card-foreground': '#1c1917',
      '--popover': 'rgba(255, 255, 255, 0.95)',
      '--popover-foreground': '#1c1917',
      '--primary': '#f59e0b',
      '--primary-foreground': '#ffffff',
      '--secondary': 'rgba(255, 255, 255, 0.6)',
      '--secondary-foreground': '#1c1917',
      '--muted': 'rgba(0, 0, 0, 0.04)',
      '--muted-foreground': '#78716c',
      '--accent': '#fde68a',
      '--accent-foreground': '#78350f',
      '--destructive': '#dc2626',
      '--border': 'rgba(0, 0, 0, 0.08)',
      '--input': 'rgba(0, 0, 0, 0.04)',
      '--ring': '#f59e0b',
      '--chart-1': '#f59e0b',
      '--chart-2': '#fb923c',
      '--chart-3': '#ef4444',
      '--chart-4': '#84cc16',
      '--chart-5': '#06b6d4',
    },
  },
];

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUNDS  (applied as `background:` on .app-body)
// ─────────────────────────────────────────────────────────────────────────────

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'default',
    label: 'Default',
    preview: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)',
  },
  {
    id: 'soft-gradient',
    label: 'Soft Gradient',
    preview: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
  },
  {
    id: 'glass',
    label: 'Glass',
    preview: 'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.3), transparent 50%), radial-gradient(circle at 70% 70%, rgba(168,85,247,0.3), transparent 50%), #0c0a09',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    preview: '#0c0a09',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    preview: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
  },
  {
    id: 'dark',
    label: 'Pure Dark',
    preview: '#000000',
  },
];

export function getBackground(id: BackgroundId): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];
}

/**
 * Compute the actual CSS `background:` value for a (theme, background) combo.
 * Light theme always uses a light gradient regardless of background choice.
 */
export function computeBodyBackground(theme: ThemeDef, bgId: BackgroundId): string {
  if (!theme.isDark) {
    // Light theme — keep warm cream gradient
    return `
      radial-gradient(1200px 800px at 0% 0%, #fff7ed 0%, transparent 50%),
      radial-gradient(1200px 800px at 100% 100%, #fef3c7 0%, transparent 50%),
      linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)
    `;
  }
  switch (bgId) {
    case 'default':
      return `
        radial-gradient(1200px 800px at 0% 0%, rgba(120, 53, 15, 0.4) 0%, transparent 50%),
        radial-gradient(1200px 800px at 100% 100%, rgba(180, 83, 9, 0.25) 0%, transparent 50%),
        linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)
      `;
    case 'soft-gradient':
      return `
        radial-gradient(1200px 800px at 0% 0%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
        radial-gradient(1200px 800px at 100% 100%, rgba(168, 85, 247, 0.18) 0%, transparent 50%),
        linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)
      `;
    case 'glass':
      return `
        radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, rgba(168, 85, 247, 0.18) 0%, transparent 50%),
        #0c0a09
      `;
    case 'minimal':
      return '#0c0a09';
    case 'neutral':
      return 'linear-gradient(135deg, #18181b 0%, #27272a 100%)';
    case 'dark':
      return '#000000';
    default:
      return '#0c0a09';
  }
}
