import { chrome } from 'jest-chrome';

describe('Content Script', () => {
  jest.setTimeout(30000); // Increase timeout further
  
  let selectedText = '';
  let messageListener: (message: any, sender: any, sendResponse: any) => void;
  
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset state
    selectedText = '';
    (window as any).contentScriptInitialized = false;
    (window as any).isSelectionMode = false;
    (window as any).highlightedElement = null;
    (window as any).originalStyles = null;
    jest.clearAllMocks();
    
    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      value: () => ({
        toString: () => selectedText,
        removeAllRanges: jest.fn(),
      }),
      writable: true,
    });
    
    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return true;
    });
    
    // Set up chrome.runtime.onMessage.addListener mock
    let listener: any;
    chrome.runtime.onMessage.addListener.mockImplementation((cb) => {
      listener = cb;
      messageListener = cb;
      return () => {};
    });
    
    // Clear require cache to ensure content script is reloaded
    jest.resetModules();
    
    // Load content script
    require('../../content.js');
    
    // Run any pending timers
    jest.runAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Reset content script state
    (window as any).contentScriptInitialized = false;
  });

  test('handles toggle selection mode message', () => {
    expect(messageListener).toBeDefined();
    
    // Test toggle selection mode
    messageListener({ action: 'toggleSelectionMode' }, {}, jest.fn());
    expect((window as any).isSelectionMode).toBe(true);
    
    // Test toggle off
    messageListener({ action: 'toggleSelectionMode' }, {}, jest.fn());
    expect((window as any).isSelectionMode).toBe(false);
  });

  test('handles click event when selection mode is active', () => {
    expect(messageListener).toBeDefined();
    
    // Enable selection mode
    messageListener({ action: 'toggleSelectionMode' }, {}, jest.fn());
    
    // Simulate selected text
    selectedText = 'test job description';
    
    // Simulate click
    document.dispatchEvent(new MouseEvent('click'));
    
    // Run any pending timers
    jest.runAllTimers();
    
    // Verify message was sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'jobDescriptionSelected',
      text: 'test job description',
      url: window.location.href
    }, expect.any(Function));
  });

  test('ignores click event when selection mode is not active', () => {
    // Simulate selected text
    selectedText = 'test job description';
    
    // Simulate click without enabling selection mode
    document.dispatchEvent(new MouseEvent('click'));
    
    // Run any pending timers
    jest.runAllTimers();
    
    // Verify no message was sent
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
}); 