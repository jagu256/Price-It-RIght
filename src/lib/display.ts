/**
 * 🔠 Display options: larger text and high contrast (accessibility, and easier
 * to read on a projector). Remembered in this browser; storage is wrapped in
 * try/catch, so if it is blocked the app simply starts with normal settings.
 * The options are applied as attributes on <html>; index.css does the rest.
 */
export const DISPLAY_KEY = 'price-it-right:display';

export interface DisplaySettings {
  largeText: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

export const DEFAULT_DISPLAY: DisplaySettings = { largeText: false, highContrast: false, darkMode: false };

export function loadDisplay(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): DisplaySettings {
  try {
    const raw = storage?.getItem(DISPLAY_KEY);
    if (!raw) return DEFAULT_DISPLAY;
    const v = JSON.parse(raw) as Partial<DisplaySettings>;
    // Only real true/false values are used; anything else falls back to normal.
    return { largeText: v.largeText === true, highContrast: v.highContrast === true, darkMode: v.darkMode === true };
  } catch {
    return DEFAULT_DISPLAY;
  }
}

export function saveDisplay(s: DisplaySettings, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(DISPLAY_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked – the setting still works until the page is closed */
  }
}

/** Sets data-text="large" / data-contrast="high" / data-theme="dark" on the page (or removes them). */
export function applyDisplay(s: DisplaySettings, root: HTMLElement | undefined = globalThis.document?.documentElement): void {
  if (!root) return;
  if (s.largeText) root.setAttribute('data-text', 'large');
  else root.removeAttribute('data-text');
  if (s.highContrast) root.setAttribute('data-contrast', 'high');
  else root.removeAttribute('data-contrast');
  if (s.darkMode) root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

/**
 * Paper is white: print in the light colours, then go back to dark afterwards.
 * Returns a function that removes the listeners.
 */
export function lightWhilePrinting(root: HTMLElement = document.documentElement): () => void {
  let wasDark = false;
  const before = () => {
    wasDark = root.getAttribute('data-theme') === 'dark';
    if (wasDark) root.removeAttribute('data-theme');
  };
  const after = () => {
    if (wasDark) root.setAttribute('data-theme', 'dark');
  };
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
  return () => {
    window.removeEventListener('beforeprint', before);
    window.removeEventListener('afterprint', after);
  };
}
