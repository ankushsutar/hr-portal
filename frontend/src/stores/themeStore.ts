import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemePreset = 'cobalt' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'custom';

export interface ThemePresetConfig {
  name: string;
  primary: string;
  accent: string;
  cardBg: string;
}

export const PRESET_THEMES: Record<ThemePreset, ThemePresetConfig> = {
  cobalt: {
    name: 'Obsidian Cobalt',
    primary: '#2563eb',
    accent: '#3b82f6',
    cardBg: '#111827',
  },
  cyan: {
    name: 'Electric Cyan',
    primary: '#06b6d4',
    accent: '#22d3ee',
    cardBg: '#0f172a',
  },
  emerald: {
    name: 'Emerald Velvet',
    primary: '#10b981',
    accent: '#34d399',
    cardBg: '#022c22',
  },
  violet: {
    name: 'Royal Violet',
    primary: '#8b5cf6',
    accent: '#a78bfa',
    cardBg: '#1e1b4b',
  },
  amber: {
    name: 'Sunset Amber',
    primary: '#f59e0b',
    accent: '#fbbf24',
    cardBg: '#451a03',
  },
  custom: {
    name: 'Custom Brand',
    primary: '#2563eb',
    accent: '#3b82f6',
    cardBg: '#111827',
  },
};

interface ThemeState {
  mode: ThemeMode;
  preset: ThemePreset;
  primaryColor: string;
  accentColor: string;
  cardBg: string;
  logoUrl: string | null;
  extractedPalette: string[];
  isCustomizerOpen: boolean;

  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  setPrimaryColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setLogoUrl: (url: string | null) => void;
  setExtractedPalette: (palette: string[]) => void;
  setCustomizerOpen: (open: boolean) => void;
  saveState: () => void;
  initTheme: () => void;
  extractColorsFromLogo: (dataUrl: string) => Promise<string[]>;
}

// Convert Hex color to RGB string "R, G, B"
function hexToRgbString(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '37, 99, 235';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

let systemThemeCleanup: (() => void) | null = null;

// Apply CSS variables and document classes
function applyThemeToDocument(mode: ThemeMode, primary: string, accent: string, cardBg: string) {
  const root = document.documentElement;

  // Clean up previous system media query listener if any
  if (systemThemeCleanup) {
    systemThemeCleanup();
    systemThemeCleanup = null;
  }

  // Set Primary & Accent CSS Custom Properties
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-primary-rgb', hexToRgbString(primary));
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-rgb', hexToRgbString(accent));

  const applyLightModeVars = () => {
    root.style.setProperty('--color-card-bg', '#FFFFFF');
    root.style.setProperty('--bg-page', '#F8FAFC');
    root.style.setProperty('--bg-card', '#FFFFFF');
    root.style.setProperty('--bg-sidebar', '#FFFFFF');
    root.style.setProperty('--bg-header', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--bg-subtle', '#F1F5F9');
    root.style.setProperty('--bg-elevated', '#FFFFFF');
    root.style.setProperty('--bg-hover', '#F1F5F9');
    root.style.setProperty('--bg-input', '#FFFFFF');
    root.style.setProperty('--border-color', '#E2E8F0');
    root.style.setProperty('--border-strong', '#CBD5E1');
    root.style.setProperty('--text-main', '#0F172A');
    root.style.setProperty('--text-muted', '#64748B');
    root.style.setProperty('--text-subtle', '#94A3B8');
    root.style.setProperty('--text-inverse', '#FFFFFF');
    root.classList.remove('dark');
  };

  const applyDarkModeVars = () => {
    root.style.setProperty('--color-card-bg', cardBg || '#111827');
    root.style.setProperty('--bg-page', '#0B0F19');
    root.style.setProperty('--bg-card', cardBg || '#111827');
    root.style.setProperty('--bg-sidebar', '#111827');
    root.style.setProperty('--bg-header', 'rgba(17, 24, 39, 0.85)');
    root.style.setProperty('--bg-subtle', '#1E293B');
    root.style.setProperty('--bg-elevated', '#1F2937');
    root.style.setProperty('--bg-hover', '#1E293B');
    root.style.setProperty('--bg-input', '#0B0F19');
    root.style.setProperty('--border-color', 'rgba(31, 41, 55, 0.8)');
    root.style.setProperty('--border-strong', '#374151');
    root.style.setProperty('--text-main', '#F3F4F6');
    root.style.setProperty('--text-muted', '#94A3B8');
    root.style.setProperty('--text-subtle', '#64748B');
    root.style.setProperty('--text-inverse', '#0F172A');
    root.classList.add('dark');
  };

  if (mode === 'dark') {
    applyDarkModeVars();
  } else if (mode === 'light') {
    applyLightModeVars();
  } else {
    // System mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        applyDarkModeVars();
      } else {
        applyLightModeVars();
      }
    };
    handleChange(mediaQuery);
    const listener = (e: MediaQueryListEvent) => handleChange(e);
    mediaQuery.addEventListener('change', listener);
    systemThemeCleanup = () => mediaQuery.removeEventListener('change', listener);
  }
}

const STORAGE_KEY = 'hrms_theme_config';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  preset: 'cobalt',
  primaryColor: '#2563eb',
  accentColor: '#3b82f6',
  cardBg: '#111827',
  logoUrl: null,
  extractedPalette: [],
  isCustomizerOpen: false,

  setCustomizerOpen: (open: boolean) => set({ isCustomizerOpen: open }),

  setMode: (mode: ThemeMode) => {
    set({ mode });
    const { primaryColor, accentColor, cardBg } = get();
    applyThemeToDocument(mode, primaryColor, accentColor, cardBg);
    get().saveState();
  },

  setPreset: (preset: ThemePreset) => {
    const config = PRESET_THEMES[preset] || PRESET_THEMES.cobalt;
    set({
      preset,
      primaryColor: config.primary,
      accentColor: config.accent,
      cardBg: config.cardBg,
    });
    applyThemeToDocument(get().mode, config.primary, config.accent, config.cardBg);
    get().saveState();
  },

  setPrimaryColor: (color: string) => {
    set({ primaryColor: color, preset: 'custom' });
    applyThemeToDocument(get().mode, color, get().accentColor, get().cardBg);
    get().saveState();
  },

  setAccentColor: (color: string) => {
    set({ accentColor: color, preset: 'custom' });
    applyThemeToDocument(get().mode, get().primaryColor, color, get().cardBg);
    get().saveState();
  },

  setLogoUrl: (logoUrl: string | null) => {
    set({ logoUrl });
    get().saveState();
  },

  setExtractedPalette: (extractedPalette: string[]) => {
    set({ extractedPalette });
    get().saveState();
  },

  saveState: () => {
    const { mode, preset, primaryColor, accentColor, cardBg, logoUrl, extractedPalette } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, preset, primaryColor, accentColor, cardBg, logoUrl, extractedPalette })
      );
    } catch {
      // Ignore quota errors
    }
  },

  initTheme: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          mode: parsed.mode || 'dark',
          preset: parsed.preset || 'cobalt',
          primaryColor: parsed.primaryColor || '#2563eb',
          accentColor: parsed.accentColor || '#3b82f6',
          cardBg: parsed.cardBg || '#111827',
          logoUrl: parsed.logoUrl || null,
          extractedPalette: parsed.extractedPalette || [],
        });
        applyThemeToDocument(
          parsed.mode || 'dark',
          parsed.primaryColor || '#2563eb',
          parsed.accentColor || '#3b82f6',
          parsed.cardBg || '#111827'
        );
        return;
      }
    } catch {
      // Ignore JSON parse errors
    }
    // Default fallback
    applyThemeToDocument('dark', '#2563eb', '#3b82f6', '#111827');
  },

  extractColorsFromLogo: (dataUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);

        // Downscale image to 64x64 for efficient sampling
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imageData = ctx.getImageData(0, 0, 64, 64).data;
        const colorBuckets: Record<string, number> = {};

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip transparent or near-black/near-white background pixels
          if (a < 128) continue;
          if (r < 15 && g < 15 && b < 15) continue;
          if (r > 240 && g > 240 && b > 240) continue;

          // Quantize color into 32-level step buckets
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;

          const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
          colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
        }

        // Sort by frequency and take top 5 swatches
        const sorted = Object.keys(colorBuckets).sort((a, b) => colorBuckets[b] - colorBuckets[a]);
        const palette = sorted.slice(0, 5);

        // Default fallbacks if image had few colors
        const defaultPalette = ['#2563eb', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];
        while (palette.length < 5) {
          const next = defaultPalette.find(c => !palette.includes(c));
          if (next) palette.push(next);
          else break;
        }

        set({ extractedPalette: palette });
        resolve(palette);
      };
      img.onerror = () => resolve([]);
      img.src = dataUrl;
    });
  },
}));
