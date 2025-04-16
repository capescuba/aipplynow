import { jest } from '@jest/globals';

let messageListener: any;
let selectedText = '';

// Set up Chrome API mock before any tests run
const mockSendMessage = jest.fn(() => Promise.resolve());
const mockAddListener = jest.fn((listener: any) => {
  messageListener = listener;
  return () => {}; // Return cleanup function
});

// Create a mock onMessage object
const mockOnMessage = {
  addListener: mockAddListener,
  removeListener: jest.fn(),
  hasListeners: jest.fn()
};

// Set up the chrome.runtime mock
(global as any).chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: mockOnMessage
  }
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve())
  },
  writable: true
});

describe('Content Script', () => {
  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Reset state
    selectedText = '';
    (window as any).isSelectionMode = false;
    (window as any).contentScriptInitialized = false;
    document.body.style.cursor = 'default';

    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      value: () => ({
        toString: () => selectedText,
        removeAllRanges: jest.fn(),
      }),
      writable: true,
    });

    // Reset mock function calls
    mockSendMessage.mockClear();
    mockAddListener.mockClear();

    // Load content script
    require('../../content.js');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    document.body.innerHTML = '';
    messageListener = undefined;
    selectedText = '';
  });

  test('handles toggle selection mode message', () => {
    expect(messageListener).toBeDefined();
    
    // Test toggle selection mode on
    const sendResponse = jest.fn();
    messageListener({ action: 'toggleSelectionMode' }, {}, sendResponse);
    
    expect(document.body.style.cursor).toBe('pointer');
    expect((window as any).isSelectionMode).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith({ status: 'selectionModeOn' });
  });

  test('handles click event when selection mode is active', async () => {
    expect(messageListener).toBeDefined();
    
    // Enable selection mode
    messageListener({ action: 'toggleSelectionMode' }, {}, jest.fn());
    
    // Create a mock element with text
    const mockElement = document.createElement('div');
    mockElement.innerText = 'test job description';
    document.body.appendChild(mockElement);
    
    // Simulate click event on the mock element
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    mockElement.dispatchEvent(clickEvent);
    
    // Run any pending timers
    jest.runAllTimers();
    
    // Wait for clipboard write to complete
    await Promise.resolve();
    
    // Verify message was sent with selected text
    expect(mockSendMessage).toHaveBeenCalledWith({
      action: 'jobDescriptionSelected',
      text: 'test job description',
      url: window.location.href
    }, expect.any(Function));
  });

  test('ignores click event when selection mode is not active', () => {
    expect(messageListener).toBeDefined();
    
    // Create a mock element with text
    const mockElement = document.createElement('div');
    mockElement.innerText = 'test job description';
    document.body.appendChild(mockElement);
    
    // Simulate click event on the mock element
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    mockElement.dispatchEvent(clickEvent);
    
    // Run any pending timers
    jest.runAllTimers();
    
    // Verify no message was sent
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
}); 