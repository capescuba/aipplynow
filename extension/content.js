// content.js
// Use window object to store state to avoid redeclaration
if (typeof window.isSelectionMode === 'undefined') {
  window.isSelectionMode = false;
  window.highlightedElement = null;
  window.originalStyles = null;
}

function toggleSelectionMode(enable) {
  console.log('Toggling selection mode:', enable);
  if (enable) {
    window.isSelectionMode = true;
    document.body.style.cursor = 'pointer';
    document.addEventListener('mouseover', highlightElement);
    document.addEventListener('mouseout', removeHighlight);
    document.addEventListener('click', selectElement);
    
    // Add selection mode indicator
    const indicator = document.createElement('div');
    indicator.id = 'aipplynow-selection-mode';
    indicator.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      background-color: rgba(25, 118, 210, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      pointer-events: none;
    `;
    indicator.textContent = 'Click on the job description';
    document.body.appendChild(indicator);
  } else {
    window.isSelectionMode = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('mouseout', removeHighlight);
    document.removeEventListener('click', selectElement);
    removeHighlight();
    
    // Remove selection mode indicator
    const indicator = document.getElementById('aipplynow-selection-mode');
    if (indicator) {
      indicator.remove();
    }
  }
}

function highlightElement(event) {
  if (!window.isSelectionMode) return;
  event.preventDefault();
  event.stopPropagation();
  removeHighlight();
  
  const element = event.target;
  if (element.tagName === 'BODY' || element.tagName === 'HTML') return;
  
  window.highlightedElement = element;
  window.originalStyles = {
    backgroundColor: element.style.backgroundColor,
    boxShadow: element.style.boxShadow,
    transition: element.style.transition,
    outline: element.style.outline
  };
  
  element.style.transition = 'all 0.2s ease-in-out';
  element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
  element.style.boxShadow = '0 0 0 2px #1976d2';
  element.style.outline = 'none';
}

function removeHighlight() {
  if (window.highlightedElement && window.originalStyles) {
    window.highlightedElement.style.backgroundColor = window.originalStyles.backgroundColor;
    window.highlightedElement.style.boxShadow = window.originalStyles.boxShadow;
    window.highlightedElement.style.transition = window.originalStyles.transition;
    window.highlightedElement.style.outline = window.originalStyles.outline;
    window.highlightedElement = null;
    window.originalStyles = null;
  }
}

function selectElement(event) {
  if (!window.isSelectionMode) return;
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target;
  const textToCopy = element.innerText.trim();
  
  if (textToCopy) {
    // Show success feedback
    const originalBackground = element.style.backgroundColor;
    element.style.transition = 'background-color 0.3s ease-in-out';
    element.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        console.log('Job description copied:', textToCopy);
        const sourceUrl = window.location.href;
        
        // Simple direct message to background script
        try {
          chrome.runtime.sendMessage({
            action: "jobDescriptionSelected",
            text: textToCopy,
            url: sourceUrl
          }, (response) => {
            console.log('Message sent, response:', response);
            
            // Keep success feedback briefly
            setTimeout(() => {
              element.style.backgroundColor = originalBackground;
              element.style.transition = '';
            }, 500);
            
            toggleSelectionMode(false);
          });
        } catch (error) {
          console.error('Error sending message:', error);
          // Show error feedback
          element.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
          toggleSelectionMode(false);
        }
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        // Show error feedback
        element.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
        toggleSelectionMode(false);
      });
  } else {
    console.log('No text found in selected section');
  }
}

// Only initialize if not already initialized
if (!window.contentScriptInitialized) {
  console.log('Content script loaded');
  window.contentScriptInitialized = true;

  // Initialize message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === "toggleSelectionMode") {
      toggleSelectionMode(true);
      sendResponse({ status: "selectionModeOn" });
      return true; // Keep the message channel open
    }
  });
}