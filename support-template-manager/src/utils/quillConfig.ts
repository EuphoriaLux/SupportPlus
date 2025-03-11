// src/utils/quillConfig.ts
import ReactQuill from 'react-quill-new';
import createTableModule from './quillTableModule';

// Mute console warnings but don't disable table formats
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  // Only filter specific warnings about table formats when they occur during initialization
  if (args[0]?.includes && 
      args[0].includes('Cannot register') && 
      ['table', 'tbody', 'tr', 'td', 'th'].some(format => args[0].includes(format)) &&
      args[0].includes('already registered')) {
    // This is fine, we're allowing tables to be registered
    return;
  }
  
  // Pass through all other warnings
  return originalConsoleWarn.apply(console, args);
};

// Register table module with Quill
const TableModule = createTableModule();
ReactQuill.Quill.register('modules/table', TableModule);

// Re-export the configured ReactQuill
export default ReactQuill;