const enabled = import.meta.env.DEV || import.meta.env.VITE_API_DEBUG === 'true';

export const logger = {
  debug: (...args: unknown[]) => {
    if (enabled) console.debug('[RestroHub]', ...args);
  },
  info: (...args: unknown[]) => {
    if (enabled) console.info('[RestroHub]', ...args);
  },
  warn: (...args: unknown[]) => console.warn('[RestroHub]', ...args),
  error: (...args: unknown[]) => console.error('[RestroHub]', ...args),
};
