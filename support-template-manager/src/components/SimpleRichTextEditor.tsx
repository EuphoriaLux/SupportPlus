import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactQuill, { tableFormats } from '../utils/quillConfig'; // Import with tableFormats
import BetterTable from 'quill-better-table';
import 'react-quill-new/dist/quill.snow.css';
import 'quill-better-table/dist/quill-better-table.css';

// Define the props for the enhanced ReactQuill component
interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Define additional formats for advanced styling
const customFormats = [
  { label: 'Support Note', className: 'support-note', wrapperTag: 'div' },
  { label: 'Warning Note', className: 'warning-note', wrapperTag: 'div' },
  { label: 'Info Note', className: 'info-note', wrapperTag: 'div' },
  { label: 'Code Block', className: 'code-block', wrapperTag: 'pre' },
];

// Custom CSS to integrate with your app's styles
const editorStyle = `
  .rich-text-editor .ql-container {
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
    font-family: inherit;
  }
  
  .rich-text-editor .ql-toolbar {
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    background-color: #f9fafb;
  }
  
  .rich-text-editor .ql-editor {
    min-height: 200px;
    font-size: 0.875rem;
  }
  
  /* Style for variable placeholders in the editor */
  .rich-text-editor .ql-editor .variable-placeholder {
    background-color: #dbeafe;
    color: #2563eb;
    padding: 0 4px;
    border-radius: 4px;
    font-weight: bold;
    white-space: nowrap;
    border: 1px solid #93c5fd;
  }
  
  /* Styles for support-specific elements */
  .rich-text-editor .ql-editor .support-note {
    background-color: #fdf8c3;
    padding: 8px;
    border-left: 3px solid #f7df1e;
    margin-bottom: 1em;
  }
  
  .rich-text-editor .ql-editor .warning-note {
    background-color: #ffecec;
    padding: 8px;
    border-left: 3px solid #dc3545;
    margin-bottom: 1em;
  }
  
  .rich-text-editor .ql-editor .info-note {
    background-color: #e6f4ff;
    padding: 8px;
    border-left: 3px solid #0d6efd;
    margin-bottom: 1em;
  }
  
  /* Expanded toolbar section toggle */
  .toolbar-expander {
    display: flex;
    justify-content: center;
    margin-top: 4px;
    font-size: 12px;
    color: #666;
    cursor: pointer;
  }
  
  .toolbar-expander:hover {
    color: #333;
  }
  
  /* Enhanced table styles */
  .rich-text-editor .ql-editor table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin-bottom: 1em !important;
    table-layout: fixed !important;
    border: 1px solid #ccc !important;
    display: table !important;
  }
  
  .rich-text-editor .ql-editor tbody {
    display: table-row-group !important;
  }
  
  .rich-text-editor .ql-editor tr {
    display: table-row !important;
    border-bottom: 1px solid #ccc !important;
  }
  
  .rich-text-editor .ql-editor td,
  .rich-text-editor .ql-editor th {
    border: 1px solid #ccc !important;
    padding: 8px !important;
    text-align: left !important;
    min-width: 60px !important;
    position: relative !important;
    display: table-cell !important;
    vertical-align: middle !important;
  }
  
  .rich-text-editor .ql-editor th {
    background-color: #f3f3f3 !important;
    font-weight: bold !important;
  }
  
  /* Make tables stand out with a slight background */
  .rich-text-editor .ql-editor table {
    background-color: #fdfdfd !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Hover effect on table cells for better UX */
  .rich-text-editor .ql-editor td:hover,
  .rich-text-editor .ql-editor th:hover {
    background-color: rgba(0, 123, 255, 0.05) !important;
  }
  
  /* Fix for Quill turning tables into blocks */
  .ql-editor p + table {
    margin-top: 1em !important;
  }
  
  /* Fix spacing after tables */
  .ql-editor table + * {
    margin-top: 1em !important;
  }
  
  /* Customize better-table's operation panel */
  .rich-text-editor .better-table-operation button {
    font-size: 13px !important;
    margin: 2px !important;
  }
  
  /* Better table selection styles */
  .rich-text-editor .better-table-selected {
    background-color: rgba(37, 99, 235, 0.1) !important;
  }
`;

// Create a wrapper div around ReactQuill to avoid findDOMNode issues
const ReactQuillWrapper = ({ forwardedRef, ...props }: any) => {
  return (
    <div className="quill-container">
      <ReactQuill ref={forwardedRef} {...props} />
    </div>
  );
};

// Create a forwardRef version
const ReactQuillWithRef = forwardRef<any, any>((props, ref) => {
  return <ReactQuillWrapper forwardedRef={ref} {...props} />;
});

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...'
}) => {
  const quillRef = useRef<any>(null);
  const [editorHtml, setEditorHtml] = useState(value);
  const [quillInstance, setQuillInstance] = useState<any>(null);
  const [showExpandedToolbar, setShowExpandedToolbar] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [editorMounted, setEditorMounted] = useState(false);
  
  // Used to safely insert content into the editor
  const safeInsertionRef = useRef({
    pendingInsertions: [] as any[],
    processing: false
  });
  
  // Handle variable highlighting for pasted content
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!editorReady) return;
    
    const editor = getEditor();
    if (!editor) return;
    
    // Process on next tick to ensure content is pasted
    setTimeout(() => {
      try {
        const text = editor.getText();
        const varRegex = /\{\{([^}]+)\}\}/g;
        let match;
        
        while ((match = varRegex.exec(text)) !== null) {
          const start = match.index;
          const length = match[0].length;
          
          editor.formatText(start, length, {
            'color': '#2563eb',
            'background': '#dbeafe',
            'bold': true,
          });
        }
      } catch (error) {
        console.error("Error handling paste:", error);
      }
    }, 50);
  }, [editorReady]);
  
  // Initialize editor after a short delay to ensure proper mounting
  useEffect(() => {
    setEditorMounted(true);
    
    const initTimer = setTimeout(() => {
      try {
        if (quillRef.current) {
          const editor = quillRef.current.getEditor();
          if (editor) {
            setQuillInstance(editor);
            setEditorReady(true);
            console.log("Quill editor initialized successfully");
          }
        }
      } catch (error) {
        console.error("Error initializing Quill editor:", error);
      }
    }, 200); // Increased delay for better initialization
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // Process any pending insertions after editor is ready
  useEffect(() => {
    if (editorReady && safeInsertionRef.current.pendingInsertions.length > 0) {
      processPendingInsertions();
    }
  }, [editorReady]);
  
  // Process the queue of pending insertions
  const processPendingInsertions = useCallback(() => {
    if (safeInsertionRef.current.processing || !editorReady) return;
    
    safeInsertionRef.current.processing = true;
    
    try {
      const editor = getEditor();
      if (!editor) {
        safeInsertionRef.current.processing = false;
        return;
      }
      
      while (safeInsertionRef.current.pendingInsertions.length > 0) {
        const insertion = safeInsertionRef.current.pendingInsertions.shift();
        if (insertion) {
          try {
            if (insertion.type === 'variable') {
              insertVariableDirectly(editor, insertion.value);
            } else if (insertion.type === 'html') {
              insertHtmlDirectly(editor, insertion.value);
            } else if (insertion.type === 'table') {
              insertTableDirectly(editor, insertion.rows, insertion.cols);
            }
          } catch (error) {
            console.error(`Error processing ${insertion.type} insertion:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error in processing pending insertions:", error);
    } finally {
      safeInsertionRef.current.processing = false;
    }
  }, [editorReady]);
  
  // Update editor content when value prop changes
  useEffect(() => {
    setEditorHtml(value);
    
    // Format variables after content update
    if (editorReady && quillInstance) {
      setTimeout(() => {
        try {
          formatVariables(quillInstance);
        } catch (error) {
          console.error("Error formatting variables after value change:", error);
        }
      }, 50);
    }
  }, [value, editorReady, quillInstance]);
  
  // Add event listener for paste
  useEffect(() => {
    const container = document.querySelector('.quill-container');
    
    if (container) {
      container.addEventListener('paste', handlePaste as unknown as EventListener, true);
      return () => {
        container.removeEventListener('paste', handlePaste as unknown as EventListener, true);
      };
    } else {
      document.addEventListener('paste', handlePaste as unknown as EventListener, true);
      return () => {
        document.removeEventListener('paste', handlePaste as unknown as EventListener, true);
      };
    }
  }, [handlePaste, editorMounted]);
  
  // Format all variables in the document
  const formatVariables = (editor: any) => {
    try {
      if (!editor) return;
      
      const content = editor.getText();
      const variableRegex = /\{\{([^}]+)\}\}/g;
      let match;
      
      while ((match = variableRegex.exec(content)) !== null) {
        const start = match.index;
        const length = match[0].length;
        
        editor.formatText(start, length, {
          'color': '#2563eb',
          'background': '#dbeafe',
          'bold': true,
        }, 'api');
      }
    } catch (error) {
      console.error("Error formatting variables:", error);
    }
  };
  
  // Define editor modules - use only safely registered formats
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'blockquote'],
        ['clean'],
        ['better-table'] // Keep the better-table button
      ],
      handlers: {
        'better-table': function() {
          insertBetterTable();
        }
      }
    },
    'better-table': {
      operationMenu: {
        items: {
          insertColumnRight: {
            text: 'Insert Column Right'
          },
          insertColumnLeft: {
            text: 'Insert Column Left'
          },
          insertRowUp: {
            text: 'Insert Row Above'
          },
          insertRowDown: {
            text: 'Insert Row Below'
          },
          mergeCells: {
            text: 'Merge Cells'
          },
          unmergeCells: {
            text: 'Unmerge Cells'
          },
          deleteColumn: {
            text: 'Delete Column'
          },
          deleteRow: {
            text: 'Delete Row'
          },
          deleteTable: {
            text: 'Delete Table'
          }
        },
        color: {
          colors: ['#e6f7ff', '#fffbe6', '#e6fffb', '#f3f0ff', '#fff7e6', '#fff0f6'],
          text: 'Background Color'
        }
      }
    },
    keyboard: {
      bindings: BetterTable.keyboardBindings ? BetterTable.keyboardBindings : {}
    },
    clipboard: {
      matchVisual: false
    }
  };
  
  // Define formats that the editor should allow - stick to known working formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'align', 'link', 'blockquote',
    // Use only the validated table formats from quillConfig
    ...tableFormats
  ];
  
  // Handle changes in the editor
  const handleChange = (html: string) => {
    setEditorHtml(html);
    onChange(html);
  };
  
  // Safely get editor instance
  const getEditor = () => {
    try {
      return quillInstance || (quillRef.current?.getEditor ? quillRef.current.getEditor() : null);
    } catch (error) {
      console.error("Error getting editor instance:", error);
      return null;
    }
  };
  
  // Queue variable insertion for safe processing
  const queueVariableInsertion = (variableName: string) => {
    safeInsertionRef.current.pendingInsertions.push({
      type: 'variable',
      value: variableName
    });
    
    // Try to process immediately if editor is ready
    if (editorReady && !safeInsertionRef.current.processing) {
      processPendingInsertions();
    }
  };
  
  // Direct variable insertion implementation
  const insertVariableDirectly = (editor: any, variableName: string) => {
    try {
      // Focus editor
      editor.focus();
      
      // Try to get selection or set default position
      let range = editor.getSelection();
      if (!range) {
        const length = editor.getLength() || 1;
        editor.setSelection(length - 1, 0);
        range = { index: length - 1, length: 0 };
      }
      
      const position = range.index;
      
      // Insert the variable
      editor.insertText(position, `{{${variableName}}}`, {
        'color': '#2563eb',
        'background': '#dbeafe',
        'bold': true,
      });
      
      // Try to move cursor after the inserted variable
      try {
        editor.setSelection(position + variableName.length + 4, 0);
      } catch (error) {
        console.warn("Could not set selection after variable insertion:", error);
      }
    } catch (error) {
      console.error("Error directly inserting variable:", error);
      // Last-ditch effort: append at end
      try {
        const length = editor.getLength() || 1;
        editor.insertText(length - 1, `{{${variableName}}}`, {
          'color': '#2563eb',
          'background': '#dbeafe',
          'bold': true,
        });
      } catch (appendError) {
        console.error("Failed even to append variable:", appendError);
      }
    }
  };
  
  // Public-facing variable insertion function
  const insertVariable = (variableName: string) => {
    // Use queueing mechanism for safer insertion
    queueVariableInsertion(variableName);
  };
  
  // Queue HTML insertion for safe processing
  const queueHtmlInsertion = (html: string) => {
    safeInsertionRef.current.pendingInsertions.push({
      type: 'html',
      value: html
    });
    
    if (editorReady && !safeInsertionRef.current.processing) {
      processPendingInsertions();
    }
  };
  
  // Direct HTML insertion implementation
  const insertHtmlDirectly = (editor: any, html: string) => {
    try {
      editor.focus();
      
      let range = editor.getSelection();
      if (!range) {
        const length = editor.getLength() || 1;
        editor.setSelection(length - 1, 0);
        range = { index: length - 1, length: 0 };
      }
      
      editor.clipboard.dangerouslyPasteHTML(range.index, html);
    } catch (error) {
      console.error("Error directly inserting HTML:", error);
      // Try to append at end
      try {
        const length = editor.getLength() || 1;
        editor.clipboard.dangerouslyPasteHTML(length - 1, html);
      } catch (appendError) {
        console.error("Failed even to append HTML:", appendError);
      }
    }
  };
  
  // Apply custom format with safer implementation
  const applyCustomFormat = (formatClass: string, wrapperTag: string = 'div') => {
    try {
      const editor = getEditor();
      if (!editor) return;
      
      editor.focus();
      
      let range = editor.getSelection();
      if (!range) {
        console.warn("No selection for custom format - creating placeholder");
        editor.setSelection(0, 0);
        range = { index: 0, length: 0 };
        
        // Create placeholder content
        editor.insertText(0, "Your content here", {});
        editor.setSelection(0, 16);
        range = { index: 0, length: 16 };
      }
      
      // Get the selected text
      const selectedText = editor.getText(range.index, range.length) || "Your content here";
      
      // Delete the selected text
      editor.deleteText(range.index, range.length);
      
      // Create the formatted element
      const formattedHTML = `<${wrapperTag} class="${formatClass}">${selectedText}</${wrapperTag}>`;
      
      // Insert the formatted element
      editor.clipboard.dangerouslyPasteHTML(range.index, formattedHTML);
    } catch (error) {
      console.error("Error applying custom format:", error);
    }
  };
  
  // Queue table insertion for safe processing
  const queueTableInsertion = (rows: number, cols: number) => {
    safeInsertionRef.current.pendingInsertions.push({
      type: 'table',
      rows,
      cols
    });
    
    if (editorReady && !safeInsertionRef.current.processing) {
      processPendingInsertions();
    }
  };
  
  // Insert table directly using HTML
  const insertTableDirectly = (editor: any, rows: number, cols: number) => {
    try {
      editor.focus();
      
      // Create table HTML
      let tableHTML = '<table style="width:100%; border-collapse:collapse; margin:10px 0;">';
      tableHTML += '<tbody>';
      
      for (let r = 0; r < rows; r++) {
        tableHTML += '<tr>';
        for (let c = 0; c < cols; c++) {
          if (r === 0) {
            tableHTML += `<th style="border:1px solid #ccc; padding:8px; background-color:#f3f3f3; font-weight:bold; text-align:left;">Header ${c+1}</th>`;
          } else {
            tableHTML += `<td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell ${r}-${c}</td>`;
          }
        }
        tableHTML += '</tr>';
      }
      
      tableHTML += '</tbody></table><p><br></p>';
      
      // Insert at current position or end
      let range = editor.getSelection();
      if (!range) {
        const length = editor.getLength() || 1;
        editor.setSelection(length - 1, 0);
        range = { index: length - 1, length: 0 };
      }
      
      editor.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
    } catch (error) {
      console.error("Error inserting table HTML directly:", error);
    }
  };
  
  // Public-facing function for table insertion
  const insertBetterTable = () => {
    try {
      const editor = getEditor();
      if (!editor) {
        console.warn("Editor not available for table insertion");
        return;
      }
      
      // Prompt for rows and columns
      const rows = parseInt(prompt('Number of rows:', '3') || '3', 10);
      const cols = parseInt(prompt('Number of columns:', '3') || '3', 10);
      
      if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
        // Try to use better-table module
        try {
          const betterTableModule = editor.getModule('better-table');
          if (betterTableModule && typeof betterTableModule.insertTable === 'function') {
            betterTableModule.insertTable(rows, cols);
            return;
          }
        } catch (moduleError) {
          console.warn("Better table module not available:", moduleError);
        }
        
        // Fallback to direct HTML insertion
        queueTableInsertion(rows, cols);
      }
    } catch (error) {
      console.error("Error inserting better table:", error);
      // No fallback needed as queueTableInsertion is already called above
    }
  };

  // Common variables that might be used in templates
  const commonVariables = [
    'customerName', 
    'agentName', 
    'issueDescription', 
    'productName', 
    'teamName', 
    'responseTime'
  ];

  // Customer-focused variables
  const customerVariables = [
    'customerEmail',
    'customerCompany',
    'customerPhone',
    'accountNumber',
    'planType'
  ];
  
  // Support-focused variables
  const supportVariables = [
    'ticketNumber',
    'ticketStatus',
    'ticketPriority',
    'assignedTeam',
    'supportHours'
  ];

  // Render table insertion options
  const renderTableInsertOptions = () => (
    <div className="mb-3">
      <h4 className="text-xs font-medium text-gray-700 mb-1">Insert Table:</h4>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => queueTableInsertion(3, 3)}
          className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 cursor-pointer"
        >
          3×3 Table
        </button>
        <button
          type="button"
          onClick={() => queueTableInsertion(2, 2)}
          className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 cursor-pointer"
        >
          2×2 Table
        </button>
        <button
          type="button"
          onClick={insertBetterTable}
          className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 cursor-pointer"
        >
          Custom Table
        </button>
      </div>
    </div>
  );

  return (
    <div className="rich-text-editor">
      <style>{editorStyle}</style>
      
      {/* Display editor loading state if needed */}
      {!editorReady && (
        <div className="bg-blue-50 p-2 mb-2 text-sm text-blue-800 rounded">
          Initializing editor...
        </div>
      )}
      
      <ReactQuillWithRef
        ref={quillRef}
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      
      <div className="mt-2">
        <div className="flex flex-wrap items-center mb-2">
          <span className="text-xs text-gray-500 mr-2">Insert variable:</span>
          {commonVariables.map(varName => (
            <button
              key={varName}
              type="button"
              onClick={() => insertVariable(varName)}
              className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
            >
              {varName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const varName = prompt('Enter custom variable name:');
              if (varName) insertVariable(varName);
            }}
            className="text-xs m-1 px-2 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 flex items-center"
          >
            + Custom
          </button>
          
          <button
            type="button"
            onClick={() => setShowExpandedToolbar(!showExpandedToolbar)}
            className="text-xs ml-2 px-2 py-1 text-blue-600 hover:text-blue-800 border border-blue-200 rounded"
          >
            {showExpandedToolbar ? '▲ Show Less' : '▼ More Options'}
          </button>
        </div>
        
        {/* Expanded options section */}
        {showExpandedToolbar && (
          <div className="border rounded-md p-3 bg-gray-50 mb-3">
            {/* Format section */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Template Formats:</h4>
              <div className="flex flex-wrap items-center">
                {customFormats.map(format => (
                  <button
                    key={format.className}
                    type="button"
                    onClick={() => applyCustomFormat(format.className, format.wrapperTag)}
                    className="text-xs m-1 px-2 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 cursor-pointer"
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Table insertion section */}
            {renderTableInsertOptions()}
            
            {/* Customer variables section */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Customer Variables:</h4>
              <div className="flex flex-wrap items-center">
                {customerVariables.map(varName => (
                  <button
                    key={varName}
                    type="button"
                    onClick={() => insertVariable(varName)}
                    className="text-xs m-1 px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 cursor-pointer"
                  >
                    {varName}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Support variables section */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Support Variables:</h4>
              <div className="flex flex-wrap items-center">
                {supportVariables.map(varName => (
                  <button
                    key={varName}
                    type="button"
                    onClick={() => insertVariable(varName)}
                    className="text-xs m-1 px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 cursor-pointer"
                  >
                    {varName}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Template snippets section */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Common Snippets:</h4>
              <div className="flex flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => queueHtmlInsertion('<p>Thank you for contacting our support team. We appreciate your patience.</p>')}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Thank You Message
                </button>
                <button
                  type="button"
                  onClick={() => queueHtmlInsertion('<p>Please let us know if you have any other questions.</p><p>Best regards,<br>{{agentName}}<br>{{teamName}} Support</p>')}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Closing Message
                </button>
                <button
                  type="button"
                  onClick={() => queueHtmlInsertion('<div class="info-note">For additional information, please visit our knowledge base or documentation.</div>')}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Resources Info
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;