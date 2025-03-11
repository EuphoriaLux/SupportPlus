// src/utils/quillConfig.ts
import ReactQuill from 'react-quill-new';
import BetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';

// Define table formats for export
export const tableFormats = [
  'table', 
  'table-cell', 
  'table-row', 
  'table-body', 
  'table-header',
  'table-container'
];

// Save original console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Suppress format registration warnings
console.warn = function(...args) {
  // Filter out warnings about overwriting formats and modules
  const message = args[0]?.toString() || '';
  if (message.includes('already registered') || 
      message.includes('Overwriting') ||
      message.includes('formats/table')) {
    // Just ignore these specific warnings
    return;
  }
  
  // Pass through all other warnings
  return originalConsoleWarn.apply(console, args);
};

console.error = function(...args) {
  // Filter out specific errors related to table formats
  const message = args[0]?.toString() || '';
  if (message.includes('formats/table')) {
    // Convert to warning instead
    console.warn('Table format registration issue (suppressed):', args[0]);
    return;
  }
  
  // Pass through all other errors
  return originalConsoleError.apply(console, args);
};

/**
 * Safely register BetterTable module and formats
 * This approach ensures we don't break when format conflicts occur
 */
const configureBetterTable = () => {
  try {
    // First, try to unregister existing table formats if they exist
    // This prevents conflicts between different table implementations
    try {
      ReactQuill.Quill.register('formats/table', null, true);
      ReactQuill.Quill.register('formats/table-cell', null, true);
      ReactQuill.Quill.register('formats/table-row', null, true);
      ReactQuill.Quill.register('formats/table-body', null, true);
      ReactQuill.Quill.register('formats/table-container', null, true);
      ReactQuill.Quill.register('formats/table-header', null, true);
    } catch (e) {
      // Ignore errors on unregistration
    }
    
    // Now register better-table module with force option
    ReactQuill.Quill.register({
      'modules/better-table': BetterTable
    }, true);
    
    // Let better-table register its own formats
    // We don't need to manually register formats here as better-table will do that
    
    console.log('BetterTable module successfully configured');
  } catch (error) {
    console.warn('Error configuring BetterTable module:', error);
  }
};

// Initialize the configuration
configureBetterTable();

// Export the configured ReactQuill instance
export default ReactQuill;