/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*******************************!*\
  !*** ./src/content-script.ts ***!
  \*******************************/

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'INSERT_TEMPLATE') {
        insertTemplateContent(request.content, request.isRichText || false);
        sendResponse({ success: true });
        return true;
    }
});
/**
 * Insert template content into the active email composer
 */
function insertTemplateContent(content, isRichText) {
    // Detect which email platform we're on
    if (window.location.href.includes('gmail')) {
        insertIntoGmail(content, isRichText);
    }
    else if (window.location.href.includes('outlook')) {
        insertIntoOutlook(content, isRichText);
    }
    else {
        // Generic fallback - try to insert into any focused editable element
        insertIntoFocusedElement(content, isRichText);
    }
}
/**
 * Insert content into Gmail composer
 */
function insertIntoGmail(content, isRichText) {
    // Find the active Gmail composer
    const composerBody = document.querySelector('[role="textbox"][aria-label*="Body"]');
    if (composerBody) {
        // Gmail uses contentEditable divs
        if (isRichText) {
            // For rich text content, insert directly as HTML
            composerBody.innerHTML = content;
        }
        else {
            // For plain text, replace newlines with <br> elements for proper formatting
            composerBody.innerHTML = content.replace(/\n/g, '<br>');
        }
        // Dispatch input event to ensure Gmail registers the change
        composerBody.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
/**
 * Insert content into Outlook composer
 */
function insertIntoOutlook(content, isRichText) {
    // Find the active Outlook composer
    const composerBody = document.querySelector('[aria-label*="Message body"]');
    if (composerBody) {
        if (composerBody.hasAttribute('contenteditable')) {
            // Outlook often uses contentEditable divs
            if (isRichText) {
                composerBody.innerHTML = content;
            }
            else {
                composerBody.innerHTML = content.replace(/\n/g, '<br>');
            }
            composerBody.dispatchEvent(new Event('input', { bubbles: true }));
        }
        else {
            // Sometimes Outlook uses iframes
            const iframe = composerBody.querySelector('iframe');
            if (iframe && iframe.contentDocument) {
                if (isRichText) {
                    iframe.contentDocument.body.innerHTML = content;
                }
                else {
                    iframe.contentDocument.body.innerHTML = content.replace(/\n/g, '<br>');
                }
            }
        }
    }
}
/**
 * Generic fallback - insert into any focused editable element
 */
function insertIntoFocusedElement(content, isRichText) {
    const activeElement = document.activeElement;
    if (activeElement) {
        if (activeElement instanceof HTMLInputElement ||
            activeElement instanceof HTMLTextAreaElement) {
            // For regular input elements, we can only insert plain text
            activeElement.value = content;
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        else if (activeElement.isContentEditable) {
            // For contentEditable elements, we can insert HTML
            if (isRichText) {
                activeElement.innerHTML = content;
            }
            else {
                activeElement.innerHTML = content.replace(/\n/g, '<br>');
            }
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}

/******/ })()
;
//# sourceMappingURL=content-script.js.map