/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*******************************!*\
  !*** ./src/content-script.ts ***!
  \*******************************/

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'INSERT_TEMPLATE') {
        // Always insert as rich text
        insertTemplateContent(request.content);
        sendResponse({ success: true });
        return true;
    }
});
/**
 * Insert template content into the active email composer
 * Always treats content as rich text HTML
 */
function insertTemplateContent(content) {
    // Detect which email platform we're on
    if (window.location.href.includes('gmail')) {
        insertIntoGmail(content);
    }
    else if (window.location.href.includes('outlook')) {
        insertIntoOutlook(content);
    }
    else {
        // Generic fallback - try to insert into any focused editable element
        insertIntoFocusedElement(content);
    }
}
/**
 * Insert content into Gmail composer
 */
function insertIntoGmail(content) {
    // Find the active Gmail composer
    const composerBody = document.querySelector('[role="textbox"][aria-label*="Body"]');
    if (composerBody) {
        // Gmail uses contentEditable divs
        composerBody.innerHTML = content;
        // Dispatch input event to ensure Gmail registers the change
        composerBody.dispatchEvent(new Event('input', { bubbles: true }));
        composerBody.dispatchEvent(new Event('change', { bubbles: true }));
    }
    else {
        // If composer not found immediately, set up a MutationObserver to detect when it appears
        setupComposerObserver('gmail');
    }
}
/**
 * Insert content into Outlook composer
 */
function insertIntoOutlook(content) {
    // Find the active Outlook composer
    const composerBody = document.querySelector('[aria-label*="Message body"]');
    if (composerBody) {
        if (composerBody.hasAttribute('contenteditable')) {
            // Outlook often uses contentEditable divs
            composerBody.innerHTML = content;
            // Make sure Outlook registers the change
            composerBody.dispatchEvent(new Event('input', { bubbles: true }));
            composerBody.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else {
            // Sometimes Outlook uses iframes
            const iframe = composerBody.querySelector('iframe');
            if (iframe && iframe.contentDocument) {
                iframe.contentDocument.body.innerHTML = content;
                // Try to dispatch events on the iframe document body
                iframe.contentDocument.body.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
    else {
        // If composer not found immediately, set up a MutationObserver to detect when it appears
        setupComposerObserver('outlook');
    }
}
/**
 * Setup a MutationObserver to detect when a composer is added to the DOM
 * This replaces the deprecated DOMNodeInserted event
 */
function setupComposerObserver(platform) {
    // Content to insert when composer is found
    const pendingContent = window.localStorage.getItem('pending_template_content');
    if (!pendingContent)
        return;
    // Create a MutationObserver to watch for changes to the DOM
    const observer = new MutationObserver((mutations) => {
        let composerFound = false;
        if (platform === 'gmail') {
            const composerBody = document.querySelector('[role="textbox"][aria-label*="Body"]');
            if (composerBody) {
                composerFound = true;
                insertIntoGmail(pendingContent);
            }
        }
        else if (platform === 'outlook') {
            const composerBody = document.querySelector('[aria-label*="Message body"]');
            if (composerBody) {
                composerFound = true;
                insertIntoOutlook(pendingContent);
            }
        }
        // If composer is found, disconnect the observer and clear pending content
        if (composerFound) {
            observer.disconnect();
            window.localStorage.removeItem('pending_template_content');
        }
    });
    // Start observing the document body for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    // Set a timeout to stop the observer after 10 seconds
    setTimeout(() => {
        observer.disconnect();
        window.localStorage.removeItem('pending_template_content');
    }, 10000);
}
/**
 * Generic fallback - insert into any focused editable element
 */
function insertIntoFocusedElement(content) {
    const activeElement = document.activeElement;
    if (activeElement) {
        if (activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement) {
            // For regular input elements, we must convert HTML to plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            activeElement.value = tempDiv.textContent || tempDiv.innerText || '';
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
        else if (activeElement.isContentEditable) {
            // For contentEditable elements, we can insert HTML
            activeElement.innerHTML = content;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

/******/ })()
;
//# sourceMappingURL=content-script.js.map