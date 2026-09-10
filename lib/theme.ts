export const THEME_STORAGE_KEY = 'culebreo-theme';

export type Theme = 'light' | 'dark';

/**
 * Se inyecta como script inline en <head>, antes del primer paint.
 * Debe ser una función autocontenida: se serializa con toString() y no
 * puede depender de ningún import externo.
 */
export function themeInitScript(): void {
  try {
    const stored = localStorage.getItem('culebreo-theme');
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    // localStorage/matchMedia pueden fallar (modo privado, SSR extraño): sin tema explícito
    // el CSS cae de vuelta a prefers-color-scheme.
  }
}
