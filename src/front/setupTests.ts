import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock import.meta.env for Vite
// This is a workaround for Jest not supporting import.meta directly
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_BACKEND_URL: 'http://localhost:3001',
        VITE_RAWG_KEY: 'test-rawg-key',
      },
    },
  },
  writable: true,
  configurable: true,
});

// Also mock it as a global variable for direct access
(globalThis as any).import = {
  meta: {
    env: {
      VITE_BACKEND_URL: 'http://localhost:3001',
      VITE_RAWG_KEY: 'test-rawg-key',
    },
  },
};

