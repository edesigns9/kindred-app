/**
 * Polyfill for Chrome Extension Service Worker environment.
 * Prevents "window is not defined" errors during module evaluation for libraries like Firebase.
 */
// @ts-ignore
if (typeof globalThis.window === 'undefined' && typeof window === 'undefined') {
  const noop = () => {};
  
  const mockWindow: any = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    location: {
      href: '',
      protocol: 'chrome-extension:',
      host: '',
      hostname: '',
    },
    navigator: {
      userAgent: 'Kindred/1.0',
      onLine: true,
    },
    document: {
      createElement: () => ({
        style: {},
        setAttribute: noop,
        appendChild: noop,
        getElementsByTagName: () => [],
      }),
      location: {
        href: '',
        protocol: 'chrome-extension:',
      },
      addEventListener: noop,
      removeEventListener: noop,
      documentElement: {
        style: {}
      }
    },
    localStorage: {
      getItem: () => null,
      setItem: noop,
      removeItem: noop,
      clear: noop,
    },
    screen: {
      width: 1920,
      height: 1080
    },
    addEventListener: noop,
    removeEventListener: noop,
  };

  // Assign properties to globalThis if they don't exist
  Object.keys(mockWindow).forEach(key => {
    if (!(key in globalThis)) {
      try {
        (globalThis as any)[key] = mockWindow[key];
      } catch (e) {
        console.warn(`Could not polyfill ${key}:`, e);
      }
    }
  });

  // Specifically handle 'window' itself
  try {
    if (!('window' in globalThis)) {
      (globalThis as any).window = globalThis;
    }
  } catch (e) {}
}
