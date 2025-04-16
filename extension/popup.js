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

  // Set up message listener for job descriptions
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Popup received message:', request);
    
    if (request.action === "jobDescriptionSelected") {
      console.log('Job description received in popup:', request.text);
      setSelecting(false);
      
      // Find the React app tab
      chrome.tabs.query({ url: "http://localhost:3000/*" }, (reactTabs) => {
        if (reactTabs.length > 0) {
          const reactTabId = reactTabs[0].id;
          
          // Execute script to dispatch custom event
          chrome.scripting.executeScript({
            target: { tabId: reactTabId },
            func: (text, url) => {
              // Create and dispatch custom event
              const event = new CustomEvent('AIpplyNowJobDescription', {
                detail: { text, url }
              });
              document.dispatchEvent(event);
              window.dispatchEvent(event);
              console.log('Dispatched AIpplyNowJobDescription event with:', { text, url });
            },
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
      
      // Always send a response
      sendResponse({ received: true });
      return true; // Keep the message channel open
    }
  });

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
          
          // First try to inject the content script
          chrome.scripting.executeScript({
            target: { tabId: selectionTabId },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Failed to inject content script:', chrome.runtime.lastError.message);
              showError('Failed to activate selection mode. Please refresh the page and try again.');
              return;
            }
            
            // Wait a brief moment for the content script to initialize
            setTimeout(() => {
              // Enable selection mode in the current tab
              chrome.tabs.sendMessage(selectionTabId, { action: "toggleSelectionMode" }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Popup error:', chrome.runtime.lastError.message);
                  showError('Failed to activate selection mode. Please refresh the page and try again.');
                  return;
                }
                
                console.log('Selection mode activated:', response);
                setSelecting(true);
              });
            }, 100); // Wait 100ms for content script to initialize
          });
        } else {
          console.error('Permissions denied by user');
          showError('Permission to access localhost:3000 is required to proceed.');
        }
      });
    });
  });
});

async function injectTextIntoTextarea(text, url) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // Execute script to dispatch custom event
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text, url) => {
        // Create and dispatch custom event
        const event = new CustomEvent('AIpplyNowJobDescription', {
          detail: { text, url }
        });
        document.dispatchEvent(event);
        window.dispatchEvent(event);
        console.log('Dispatched AIpplyNowJobDescription event with:', { text, url });
      },
      args: [text, url]
    });

    console.log('Successfully dispatched job description event');
  } catch (error) {
    console.error('Error injecting text:', error);
  }
}