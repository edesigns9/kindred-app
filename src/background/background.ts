/**
 * Kindred Service Worker Entry Point
 * 
 * This file handles polyfills specifically for the Chrome Extension Service Worker environment.
 */

// 1. SAFE POLYFILLS
// Only run if we are in a Service Worker context where 'window' is missing.
const isServiceWorker = typeof self !== 'undefined' && 
                        'ServiceWorkerGlobalScope' in self && 
                        self instanceof ServiceWorkerGlobalScope;

if (isServiceWorker && typeof (globalThis as any).window === 'undefined') {
  const noop = () => {};
  const mockWindow: any = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    location: { href: '', protocol: 'chrome-extension:' },
    navigator: { userAgent: 'Kindred/1.0', onLine: true },
    addEventListener: noop,
    removeEventListener: noop,
  };

  const mockDocument: any = {
    createElement: () => ({
      style: {},
      setAttribute: noop,
      appendChild: noop,
      getElementsByTagName: () => [],
    }),
    location: mockWindow.location,
    addEventListener: noop,
    removeEventListener: noop,
    documentElement: { style: {} },
  };

  // Use defineProperty to avoid "cannot set property" errors on non-writable globals
  try {
    Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'document', { value: mockDocument, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'location', { value: mockWindow.location, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: mockWindow.navigator, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { 
      value: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop },
      writable: true,
      configurable: true 
    });
  } catch (e) {
    console.warn('Polyfill injection partially failed:', e);
  }
}

// 2. LOAD MAIN LOGIC
// Dynamic import ensures the polyfills above are fully executed before any Firebase code loads.
import('./main').catch(err => {
  console.error('Kindred: Background main logic failed to load:', err);
});
