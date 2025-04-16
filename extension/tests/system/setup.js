const chrome = require('jest-chrome');

// Mock Chrome APIs with more complete implementations
Object.assign(global, { chrome });

// Mock Chrome extension APIs
chrome.runtime = {
  ...chrome.runtime,
  sendMessage: jest.fn(),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
};

chrome.tabs = {
  ...chrome.tabs,
  query: jest.fn(),
  sendMessage: jest.fn(),
  update: jest.fn(),
};

chrome.scripting = {
  ...chrome.scripting,
  executeScript: jest.fn(),
};

// Mock document and window with more complete implementations
document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
});

// Mock localStorage with persistence
const storage = new Map();
const localStorageMock = {
  getItem: (key) => storage.get(key),
  setItem: (key, value) => storage.set(key, value),
  clear: () => storage.clear(),
  removeItem: (key) => storage.delete(key),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage with persistence
const sessionStorage = new Map();
const sessionStorageMock = {
  getItem: (key) => sessionStorage.get(key),
  setItem: (key, value) => sessionStorage.set(key, value),
  clear: () => sessionStorage.clear(),
  removeItem: (key) => sessionStorage.delete(key),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock }); 