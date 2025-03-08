/**
 * Copy text to clipboard and show a success notification
 * Supports both plain text and HTML content
 * 
 * @param text Text to copy to clipboard
 * @param successMessage Optional success message to display
 * @param isHtml Whether the text is HTML content
 * @returns Promise that resolves when the text is copied
 */
export const copyToClipboard = async (
  text: string, 
  successMessage: string = 'Copied to clipboard!',
  isHtml: boolean = false
): Promise<void> => {
  try {
    // For HTML content
    if (isHtml) {
      await copyHtmlToClipboard(text);
      showNotification(successMessage, 'success');
      return;
    } 
    // For plain text
    else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showNotification(successMessage, 'success');
        return;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Make the textarea invisible
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Select and copy
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          showNotification(successMessage, 'success');
          return;
        } else {
          throw new Error('Failed to copy using execCommand');
        }
      }
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    showNotification('Failed to copy to clipboard', 'error');
    throw error;
  }
};

/**
 * Copy HTML content to clipboard, maintaining formatting
 */
const copyHtmlToClipboard = async (html: string): Promise<void> => {
  // Method 1: Use Clipboard API if available (modern browsers)
  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      const plainText = stripHtml(html);
      
      // Create a ClipboardItem with both HTML and plain text versions
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([item]);
      return;
    } catch (e) {
      console.log('ClipboardItem API failed, trying fallback method', e);
      // Continue to fallback methods if this fails
    }
  }
  
  // Method 2: Use document.execCommand
  try {
    // Create a temporary div with the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.setAttribute('contenteditable', 'true');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);
    
    // Select the content
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Execute the copy command
      const success = document.execCommand('copy');
      
      // Clean up
      selection.removeAllRanges();
      document.body.removeChild(tempDiv);
      
      if (success) {
        return;
      }
    }
    throw new Error('execCommand copy failed');
  } catch (e) {
    console.error('Fallback HTML copy failed', e);
    
    // Method 3: Last resort - just copy as plain text
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(stripHtml(html));
      return;
    }
    
    throw new Error('All clipboard methods failed');
  }
};

/**
 * Strip HTML tags from a string to get plain text
 * 
 * @param html HTML string to strip
 * @returns Plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Type of notification to display
 */
type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Show a notification with the specified message and type
 * 
 * @param message Message to display
 * @param type Type of notification (success, error, info, warning)
 * @param duration Duration to show the notification in milliseconds (default: 2000ms)
 */
export const showNotification = (
  message: string,
  type: NotificationType = 'info',
  duration: number = 2000
): void => {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '9999';
  notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  notification.style.fontWeight = '500';
  
  // Set color based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#4CAF50';
      notification.style.color = 'white';
      break;
    case 'error':
      notification.style.backgroundColor = '#F44336';
      notification.style.color = 'white';
      break;
    case 'warning':
      notification.style.backgroundColor = '#FF9800';
      notification.style.color = 'white';
      break;
    case 'info':
    default:
      notification.style.backgroundColor = '#2196F3';
      notification.style.color = 'white';
      break;
  }
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after specified duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Remove from DOM after fade-out
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
};