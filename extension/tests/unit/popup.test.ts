import { chrome } from 'jest-chrome';

describe('Popup', () => {
  let toggleButton: HTMLButtonElement;
  let statusText: HTMLElement;
  let errorMessage: HTMLElement;
  let messageListener: (request: any, sender: any, sendResponse: any) => void;
  let domContentLoadedCallback: () => void;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Set up DOM elements
    document.body.innerHTML = `
      <button id="toggleButton">Select Job Description</button>
      <div class="status">Ready to analyze job descriptions with AI.</div>
      <div id="errorMessage" style="display: none;"></div>
      <div id="successMessage" style="display: none;"></div>
    `;

    toggleButton = document.getElementById('toggleButton') as HTMLButtonElement;
    statusText = document.querySelector('.status') as HTMLElement;
    errorMessage = document.getElementById('errorMessage') as HTMLElement;

    // Mock window.chrome
    (window as any).chrome = chrome;

    // Mock Chrome APIs
    (chrome.tabs.query as jest.Mock).mockImplementation((_query, callback) => {
      callback([{ id: 1 }]);
    });

    // Add scripting API to chrome object
    (chrome as any).scripting = {
      executeScript: jest.fn().mockImplementation((_details, callback) => {
        callback([{ result: true }]);
      })
    };

    (chrome.permissions.request as jest.Mock).mockImplementation((_permissions, callback) => {
      callback(true);
      return Promise.resolve(true);
    });

    (chrome.tabs.sendMessage as jest.Mock).mockImplementation((_tabId, _message, callback) => {
      if (callback) {
        callback({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    // Mock runtime.onMessage.addListener
    const mockAddListener = jest.fn((listener) => {
      messageListener = listener;
      return () => {};
    });
    chrome.runtime.onMessage.addListener = mockAddListener;

    // Mock document.addEventListener
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = jest.fn((event, callback) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback as () => void;
      } else {
        originalAddEventListener.call(document, event, callback);
      }
    });

    // Load popup script
    require('../../popup.js');

    // Trigger DOMContentLoaded
    if (domContentLoadedCallback) {
      domContentLoadedCallback();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    // Restore document.addEventListener
    (document.addEventListener as jest.Mock).mockRestore();
  });

  test('handles job description selection message', () => {
    expect(messageListener).toBeDefined();
    const sendResponse = jest.fn();
    messageListener(
      { action: 'jobDescriptionSelected', text: 'test job', url: 'test.com' },
      {},
      sendResponse
    );

    expect(sendResponse).toHaveBeenCalledWith({ received: true });
    expect(toggleButton?.textContent).toBe('Select Job Description');
    expect(statusText?.textContent).toBe('Ready to analyze job descriptions with AI.');
  });

  test('displays error when React app tab not found', () => {
    expect(messageListener).toBeDefined();
    (chrome.tabs.query as jest.Mock).mockImplementation((_query, callback) => {
      callback([]);
    });

    const sendResponse = jest.fn();
    messageListener(
      { action: 'jobDescriptionSelected', text: 'test job', url: 'test.com' },
      {},
      sendResponse
    );

    expect(errorMessage?.textContent).toBe('Please open AIpplyNow (http://localhost:3000) in another tab first.');
    expect(errorMessage?.style.display).toBe('block');
  });

  test('toggles selection mode when button clicked', async () => {
    toggleButton?.click();

    // Wait for permissions request to complete
    await Promise.resolve();

    expect(chrome.permissions.request).toHaveBeenCalledWith(
      { origins: ['http://localhost:3000/*'] },
      expect.any(Function)
    );

    expect((chrome as any).scripting.executeScript).toHaveBeenCalledWith(
      {
        target: { tabId: 1 },
        files: ['content.js']
      },
      expect.any(Function)
    );

    // Wait for the setTimeout in the popup script
    jest.advanceTimersByTime(100);

    // Wait for any promises to resolve
    await Promise.resolve();

    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { action: 'toggleSelectionMode' },
      expect.any(Function)
    );

    expect(toggleButton?.textContent).toBe('Click on Job Description');
    expect(statusText?.textContent).toBe('Click on the job description text you want to analyze...');
  });
}); 