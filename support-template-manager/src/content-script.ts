// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'INSERT_TEMPLATE') {
      insertTemplateContent(request.content);
      sendResponse({ success: true });
      return true;
    }
  });
  
  /**
   * Insert template content into the active email composer
   */
  function insertTemplateContent(content: string): void {
    // Detect which email platform we're on
    if (window.location.href.includes('gmail')) {
      insertIntoGmail(content);
    } else if (window.location.href.includes('outlook')) {
      insertIntoOutlook(content);
    } else {
      // Generic fallback - try to insert into any focused editable element
      insertIntoFocusedElement(content);
    }
  }
  
  /**
   * Insert content into Gmail composer
   */
  function insertIntoGmail(content: string): void {
    // Find the active Gmail composer
    const composerBody = document.querySelector('[role="textbox"][aria-label*="Body"]');
    
    if (composerBody) {
      // Gmail uses contentEditable divs
      composerBody.innerHTML = content;
      
      // Dispatch input event to ensure Gmail registers the change
      composerBody.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  /**
   * Insert content into Outlook composer
   */
  function insertIntoOutlook(content: string): void {
    // Find the active Outlook composer
    const composerBody = document.querySelector('[aria-label*="Message body"]');
    
    if (composerBody) {
      if (composerBody.hasAttribute('contenteditable')) {
        // Outlook often uses contentEditable divs
        composerBody.innerHTML = content;
        composerBody.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // Sometimes Outlook uses iframes
        const iframe = composerBody.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
          iframe.contentDocument.body.innerHTML = content;
        }
      }
    }
  }
  
  /**
   * Generic fallback - insert into any focused editable element
   */
  function insertIntoFocusedElement(content: string): void {
    const activeElement = document.activeElement as HTMLElement;
    
    if (activeElement) {
      if (activeElement instanceof HTMLInputElement || 
          activeElement instanceof HTMLTextAreaElement) {
        // For regular input elements
        activeElement.value = content;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (activeElement.isContentEditable) {
        // For contentEditable elements
        activeElement.innerHTML = content;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }