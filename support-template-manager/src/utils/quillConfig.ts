// src/utils/quillConfig.ts
import ReactQuill from 'react-quill-new';

// Mute console warnings for format registration issues
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  // Filter out Quill table format registration warnings
  if (args[0]?.includes && 
      args[0].includes('Cannot register') && 
      ['table', 'tbody', 'tr', 'td', 'th'].some(format => args[0].includes(format))) {
    // Silently ignore this warning
    return;
  }
  
  // Pass through all other warnings
  return originalConsoleWarn.apply(console, args);
};

// Prevent Quill from trying to register table formats
// This needs to run before any Quill initialization
const disableTableFormats = () => {
  // Override Quill's register method to filter out table formats
  const originalRegister = ReactQuill.Quill.register;
  
  ReactQuill.Quill.register = function(path, def, suppressWarning) {
    // Skip registration of table-related formats
    if (typeof path === 'string') {
      const tableFormats = ['table', 'tbody', 'tr', 'td', 'th'];
      if (tableFormats.includes(path) || tableFormats.some(format => path.endsWith(`/${format}`))) {
        return; // Don't register
      }
    } else if (typeof path === 'object') {
      // Handle batch registrations
      const filteredPath = { ...path };
      ['table', 'tbody', 'tr', 'td', 'th'].forEach(format => {
        delete filteredPath[format];
        delete filteredPath[`formats/${format}`];
      });
      
      if (Object.keys(filteredPath).length === 0) {
        return; // Skip if nothing left to register
      }
      path = filteredPath;
    }
    
    // Call original method with filtered formats
    return originalRegister.call(this, path, def, suppressWarning);
  };
};

// Execute immediately
disableTableFormats();

// Re-export the original ReactQuill
export default ReactQuill;