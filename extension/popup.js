// popup.js
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusText = document.querySelector('.status');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }

  function clearMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
  }

  function setSelecting(isSelecting) {
    toggleButton.classList.toggle('selecting', isSelecting);
    toggleButton.textContent = isSelecting ? 'Click on Job Description' : 'Select Job Description';
    statusText.textContent = isSelecting 
      ? 'Click on the job description text you want to analyze...'
      : 'Ready to analyze job descriptions with AI.';
  }

  toggleButton.addEventListener('click', () => {
    clearMessages();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const selectionTabId = tabs[0].id;
      
      // First ensure we have the localhost permission
      chrome.permissions.request({
        origins: ["http://localhost:3000/*"]
      }, (granted) => {
        if (granted) {
          console.log('Permissions granted by user');
          
          // Enable selection mode in the current tab
          chrome.tabs.sendMessage(selectionTabId, { action: "toggleSelectionMode" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Popup error:', chrome.runtime.lastError.message);
              // Try injecting the content script manually if it failed
              chrome.scripting.executeScript({
                target: { tabId: selectionTabId },
                files: ['content.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Failed to inject content script:', chrome.runtime.lastError.message);
                  showError('Failed to activate selection mode. Please refresh the page and try again.');
                } else {
                  // Retry sending the message after injection
                  chrome.tabs.sendMessage(selectionTabId, { action: "toggleSelectionMode" });
                  setSelecting(true);
                }
              });
            } else if (response && response.status === "selectionModeOn") {
              console.log('Selection mode activated');
              setSelecting(true);
              
              // Listen for the selected job description
              chrome.runtime.onMessage.addListener(function handler(request, sender, sendResponse) {
                if (request.action === "jobDescriptionSelected" && sender.tab.id === selectionTabId) {
                  console.log('Job description received:', request.text, 'URL:', request.url);
                  chrome.runtime.onMessage.removeListener(handler);
                  setSelecting(false);
                  
                  // Find the React app tab
                  chrome.tabs.query({ url: "http://localhost:3000/*" }, (reactTabs) => {
                    if (reactTabs.length > 0) {
                      const reactTabId = reactTabs[0].id;
                      
                      // Ensure the content script is injected in the React app tab
                      chrome.scripting.executeScript({
                        target: { tabId: reactTabId },
                        func: injectTextIntoTextarea,
                        args: [request.text, request.url]
                      }, (results) => {
                        if (chrome.runtime.lastError) {
                          console.error('Injection error:', chrome.runtime.lastError.message);
                          showError('Failed to send job description to AIpplyNow. Please make sure the app is open.');
                        } else {
                          console.log('Injection successful:', results);
                          showSuccess('Job description successfully sent to AIpplyNow!');
                          chrome.tabs.update(reactTabId, { active: true });
                        }
                      });
                    } else {
                      showError('Please open AIpplyNow (http://localhost:3000) in another tab first.');
                    }
                  });
                }
              });
            }
          });
        } else {
          console.error('Permissions denied by user');
          showError('Permission to access localhost:3000 is required to proceed.');
        }
      });
    });
  });
});

function injectTextIntoTextarea(text, url) {
  return new Promise((resolve) => {
    try {
      console.log('Starting job description injection...');
      
      // Method 1: Custom Event
      try {
        const event = new CustomEvent('AIpplyNowJobDescription', {
          detail: { text, url }
        });
        document.dispatchEvent(event);
        window.dispatchEvent(event);
        console.log('Custom event dispatched successfully');
      } catch (e) {
        console.error('Error dispatching custom event:', e);
      }
      
      // Method 2: Direct state update through window property
      try {
        window.AIpplyNowData = { text, url };
        console.log('Window property set successfully');
      } catch (e) {
        console.error('Error setting window property:', e);
      }
      
      // Method 3: Dispatch a message event
      try {
        window.postMessage({
          type: 'AIpplyNowJobDescription',
          text,
          url
        }, '*');
        console.log('PostMessage sent successfully');
      } catch (e) {
        console.error('Error sending postMessage:', e);
      }
      
      console.log('All injection methods attempted');
      resolve(true);
    } catch (error) {
      console.error('Fatal error in injectTextIntoTextarea:', error);
      resolve(false);
    }
  });
}