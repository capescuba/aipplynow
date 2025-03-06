document.getElementById('selectButton').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) {
            console.error('No active tab found');
            alert('No active tab detected. Please try again.');
            return;
        }

        const tabId = tabs[0].id;
        console.log('Sending message to tab:', tabId);

        chrome.tabs.sendMessage(tabId, {action: "toggleSelectionMode"}, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError.message);
                // If content script isn’t loaded, try injecting it dynamically
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Script injection failed:', chrome.runtime.lastError.message);
                        alert('Failed to initialize extension. Please refresh the page and try again.');
                    } else {
                        // Retry sending the message after injection
                        chrome.tabs.sendMessage(tabId, {action: "toggleSelectionMode"}, (retryResponse) => {
                            if (retryResponse && retryResponse.status === "selectionModeOn") {
                                window.close();
                            } else {
                                alert('Extension loaded, but activation failed. Try again.');
                            }
                        });
                    }
                });
            } else if (response && response.status === "selectionModeOn") {
                console.log('Selection mode activated');
                window.close(); // Close popup only on success
            } else {
                console.log('No valid response from content script');
                alert('Could not activate selection mode. Please refresh the page.');
            }
        });
    });
});
