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
    // Use the modern clipboard API that supports HTML
    if (navigator.clipboard && navigator.clipboard.write && isHtml) {
      // For HTML content, use ClipboardItem API
      const blob = new Blob([text], { type: 'text/html' });
      const plainTextBlob = new Blob([stripHtml(text)], { type: 'text/plain' });
      
      const data = [
        new ClipboardItem({
          'text/html': blob,
          'text/plain': plainTextBlob
        })
      ];
      
      await navigator.clipboard.write(data);
      showNotification(successMessage, 'success');
      return Promise.resolve();
    }
    // Use standard text clipboard API
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      const content = isHtml ? stripHtml(text) : text;
      await navigator.clipboard.writeText(content);
      showNotification(successMessage, 'success');
      return Promise.resolve();
    } 
    // Fallback for older browsers
    else {
      const textArea = document.createElement('textarea');
      textArea.value = isHtml ? stripHtml(text) : text;
      
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
        return Promise.resolve();
      } else {
        showNotification('Failed to copy to clipboard', 'error');
        return Promise.reject(new Error('Failed to copy using execCommand'));
      }
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error);
    showNotification('Failed to copy to clipboard', 'error');
    return Promise.reject(error);
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