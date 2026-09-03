import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Palette, Sun, Moon, Laptop, X, Upload, Check, RefreshCw,
  Sliders, Shield, Sparkles, Layers
} from 'lucide-react';
import {
  useThemeStore,
  PRESET_THEMES,
} from '../../stores/themeStore';
import type { ThemeMode, ThemePreset } from '../../stores/themeStore';

export const ThemeCustomizerModal: React.FC = () => {
  const {
    isCustomizerOpen,
    setCustomizerOpen,
    mode,
    setMode,
    preset,
    setPreset,
    primaryColor,
    setPrimaryColor,
    accentColor,
    setAccentColor,
    logoUrl,
    setLogoUrl,
    extractedPalette,
    extractColorsFromLogo,
  } = useThemeStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
        const palette = await extractColorsFromLogo(dataUrl);
        if (palette.length > 0) {
          setPrimaryColor(palette[0]);
          if (palette.length > 1) {
            setAccentColor(palette[1]);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoUrl(null);
    useThemeStore.setState({ extractedPalette: [] });
  };

  return (
    <Dialog.Root open={isCustomizerOpen} onOpenChange={setCustomizerOpen}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 animate-fade-in" />

        {/* Slide-over Content Drawer */}
        <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] p-6 z-50 overflow-y-auto shadow-2xl font-mono animate-slide-in-right flex flex-col justify-between text-[var(--text-main)]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20">
                  <Palette size={18} />
                </div>
                <div>
                  <Dialog.Title className="text-sm font-bold text-[var(--text-main)] font-sans tracking-tight">
                    Theme Customizer
                  </Dialog.Title>
                  <Dialog.Description className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    Corporate identity & brand color palette
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-md transition-colors">
                <X size={16} />
              </Dialog.Close>
            </div>

            {/* Appearance Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Moon size={13} /> Appearance Mode
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-color)]">
                {[
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as ThemeMode)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                        isActive
                          ? 'theme-accent-bg text-white shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <Icon size={13} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corporate Logo Sampler */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Logo Palette Extraction
                </label>
                {logoUrl && (
                  <button
                    onClick={handleClearLogo}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Clear Logo
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!logoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)]/50 bg-[var(--bg-subtle)]/40 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <Upload className="mx-auto w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors mb-2" />
                  <p className="text-xs font-medium text-[var(--text-main)]">Upload Corporate Logo</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Auto-extracts brand colors via HTML5 Canvas</p>
                </div>
              ) : (
                <div className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="Uploaded Corporate Logo"
                      className="h-10 w-10 object-contain rounded bg-[var(--bg-page)] p-1 border border-[var(--border-color)]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-main)]">Corporate Brand Logo</p>
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-0.5">
                        <Check size={10} /> Extracted {extractedPalette.length} dominant colors
                      </p>
                    </div>
                  </div>

                  {extractedPalette.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-muted)] mb-1.5">Click swatch to apply as Primary Accent:</p>
                      <div className="flex items-center gap-2">
                        {extractedPalette.map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPrimaryColor(color)}
                            title={`Apply ${color}`}
                            className="w-7 h-7 rounded-full border-2 border-[var(--border-strong)] hover:scale-110 transition-transform relative flex items-center justify-center shadow-md"
                            style={{ backgroundColor: color }}
                          >
                            {primaryColor.toLowerCase() === color.toLowerCase() && (
                              <Check size={12} className="text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enterprise Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} /> Enterprise Color Presets
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(PRESET_THEMES) as ThemePreset[]).filter(p => p !== 'custom').map((pKey) => {
                  const pConfig = PRESET_THEMES[pKey];
                  const isActive = preset === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => setPreset(pKey)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                        isActive
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--text-main)] font-semibold shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--bg-subtle)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="font-mono text-xs">{pConfig.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-[var(--border-strong)]"
                          style={{ backgroundColor: pConfig.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-[var(--border-strong)]"
                          style={{ backgroundColor: pConfig.accent }}
                        />
                        {isActive && <Check size={14} className="theme-accent-text ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Fine-Tuning */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={13} /> Custom Color Fine-Tuning
              </label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-color)]">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">Primary Accent</label>
                  <div className="flex items-center gap-2 bg-[var(--bg-page)] p-1.5 rounded border border-[var(--border-color)]">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs text-[var(--text-main)] font-mono uppercase">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">Secondary Accent</label>
                  <div className="flex items-center gap-2 bg-[var(--bg-page)] p-1.5 rounded border border-[var(--border-color)]">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs text-[var(--text-main)] font-mono uppercase">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Component Preview Card */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={13} /> Live Component Preview
              </label>
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-main)]">HRMS Portal Status</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm theme-accent-bg"
                  >
                    ACTIVE
                  </span>
                </div>
                <div className="w-full bg-[var(--bg-page)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full rounded-full transition-all duration-300 theme-accent-bg"
                    style={{ width: '75%' }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-opacity shadow-md theme-accent-bg"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={() => setCustomizerOpen(false)}
              className="w-full py-2.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Done & Save Settings
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
