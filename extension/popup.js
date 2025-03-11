// popup.js
document.getElementById('toggleButton').addEventListener('click', () => {
  chrome.permissions.request({
    origins: ["http://localhost:3000/*"]
  }, (granted) => {
    if (granted) {
      console.log('Permissions granted by user');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const selectionTabId = tabs[0].id;
        chrome.tabs.sendMessage(selectionTabId, { action: "toggleSelectionMode" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Popup error:', chrome.runtime.lastError.message);
          } else if (response && response.status === "selectionModeOn") {
            console.log('Selection mode activated');
            // Wait for selection response
            chrome.runtime.onMessage.addListener(function handler(request, sender, sendResponse) {
              if (request.action === "jobDescriptionSelected" && sender.tab.id === selectionTabId) {
                console.log('Job description received:', request.text, 'URL:', request.url);
                chrome.runtime.removeListener(handler); // Clean up listener
                chrome.tabs.query({ url: "http://localhost:3000/*" }, (reactTabs) => {
                  if (reactTabs.length > 0) {
                    const reactTabId = reactTabs[0].id;
                    chrome.scripting.executeScript({
                      target: { tabId: reactTabId },
                      func: injectTextIntoTextarea,
                      args: [request.text, request.url]
                    }, (results) => {
                      if (chrome.runtime.lastError) {
                        console.error('Injection error:', chrome.runtime.lastError.message);
                      } else {
                        console.log('Injection successful:', results);
                        chrome.tabs.update(reactTabId, { active: true });
                      }
                    });
                  } else {
                    console.error('No React tab found.');
                  }
                });
              }
            });
          }
        });
      });
    } else {
      console.error('Permissions denied by user');
      alert('Permission to access localhost:3000 is required to proceed.');
    }
  });
});

function injectTextIntoTextarea(text, url) {
  const tryInject = (attempts = 5, delay = 500) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('setJobUrl', { detail: { url } }));
      console.log('Text injected:', text, 'URL:', url);
    } else if (attempts > 0) {
      console.log('Textarea not found, retrying...', attempts);
      setTimeout(() => tryInject(attempts - 1, delay), delay);
    } else {
      console.error('No textarea found after retries.');
    }
  };
  tryInject();
}