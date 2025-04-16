// background.js
console.log('Background script loaded');

// Simple message handler
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received message:', request);
  
  // Always send a response to keep the message port open
  sendResponse({ received: true });
  
  // Handle different message types
  if (request.action === "jobDescriptionSelected") {
    console.log('Job description selected:', request.text);
    // Forward to popup if needed
    chrome.runtime.sendMessage(request);
  }
  
  // Return true to indicate we'll respond asynchronously
  return true;
});