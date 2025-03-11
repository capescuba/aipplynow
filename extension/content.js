// content.js
let isSelectionMode = false;
let highlightedElement = null;
let originalBackgroundColor = null;

function toggleSelectionMode(enable) {
  console.log('Toggling selection mode:', enable);
  if (enable) {
    isSelectionMode = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', highlightElement);
    document.addEventListener('click', selectElement);
  } else {
    isSelectionMode = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mouseover', highlightElement);
    document.removeEventListener('click', selectElement);
    removeHighlight();
  }
}

function highlightElement(event) {
  if (!isSelectionMode) return;
  event.preventDefault();
  event.stopPropagation();
  removeHighlight();
  const element = event.target;
  highlightedElement = element;
  originalBackgroundColor = window.getComputedStyle(element).backgroundColor;
  element.style.backgroundColor = '#90EE90';
}

function removeHighlight() {
  if (highlightedElement) {
    highlightedElement.style.backgroundColor = originalBackgroundColor || '';
    highlightedElement = null;
    originalBackgroundColor = null;
  }
}

function selectElement(event) {
  if (!isSelectionMode) return;
  event.preventDefault();
  event.stopPropagation();
  const element = event.target;
  const textToCopy = element.innerText.trim();
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        console.log('Job description copied:', textToCopy);
        toggleSelectionMode(false);
        const sourceUrl = window.location.href;
        chrome.runtime.sendMessage({
          action: "jobDescriptionSelected",
          text: textToCopy,
          url: sourceUrl
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending to runtime:', chrome.runtime.lastError.message);
          } else {
            console.log('Runtime response:', response);
          }
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
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