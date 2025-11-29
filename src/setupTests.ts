// Import the jest-dom library for custom matchers
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the fetch API
const mockFetch = (response: any, ok = true) => {
  global.fetch = vi.fn().mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      statusText: ok ? 'OK' : 'Not Found',
    })
  );
};

// Only mock fetch in jsdom environment (browser tests), not in node environment (integration tests)
if (typeof window !== 'undefined') {
  global.fetch = vi.fn();
}

// Only define window-specific mocks when a window object exists (jsdom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

export { mockFetch };
