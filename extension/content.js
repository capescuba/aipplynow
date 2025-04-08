// content.js
let isSelectionMode = false;
let highlightedElement = null;
let originalStyles = null;

function toggleSelectionMode(enable) {
  console.log('Toggling selection mode:', enable);
  if (enable) {
    isSelectionMode = true;
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
    isSelectionMode = false;
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
  if (!isSelectionMode) return;
  event.preventDefault();
  event.stopPropagation();
  removeHighlight();
  
  const element = event.target;
  if (element.tagName === 'BODY' || element.tagName === 'HTML') return;
  
  highlightedElement = element;
  originalStyles = {
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
  if (highlightedElement && originalStyles) {
    highlightedElement.style.backgroundColor = originalStyles.backgroundColor;
    highlightedElement.style.boxShadow = originalStyles.boxShadow;
    highlightedElement.style.transition = originalStyles.transition;
    highlightedElement.style.outline = originalStyles.outline;
    highlightedElement = null;
    originalStyles = null;
  }
}

function selectElement(event) {
  if (!isSelectionMode) return;
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
        chrome.runtime.sendMessage({
          action: "jobDescriptionSelected",
          text: textToCopy,
          url: sourceUrl
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending to runtime:', chrome.runtime.lastError.message);
            // Show error feedback
            element.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
          } else {
            console.log('Runtime response:', response);
            // Keep success feedback briefly
            setTimeout(() => {
              element.style.backgroundColor = originalBackground;
              element.style.transition = '';
            }, 500);
          }
        });
        toggleSelectionMode(false);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        // Show error feedback
        element.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
      });
  } else {
    console.log('No text found in selected section');
  }
}

console.log('Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === "toggleSelectionMode") {
    toggleSelectionMode(true);
    sendResponse({ status: "selectionModeOn" });
  }
});