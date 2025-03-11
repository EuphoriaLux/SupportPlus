import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Suppress table format registration warnings
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
  
  /* Table styles */
  .rich-text-editor .ql-editor table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
    table-layout: fixed;
    border: 1px solid #ccc;
  }
  
  .rich-text-editor .ql-editor table tbody {
    display: table-row-group;
  }
  
  .rich-text-editor .ql-editor table tr {
    display: table-row;
  }
  
  .rich-text-editor .ql-editor table td,
  .rich-text-editor .ql-editor table th {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
    min-width: 80px;
    position: relative;
    display: table-cell;
  }
  
  .rich-text-editor .ql-editor table th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
`;

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

// Create a ref-based version of ReactQuill to avoid findDOMNode
const ReactQuillWithRef = forwardRef<any, any>((props, ref) => {
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur(),
    getContainerRef: () => containerRef.current
  }));
  
  return (
    <div ref={containerRef} className="quill-container">
      <ReactQuill ref={quillRef} {...props} />
    </div>
  );
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
  
  // Handle paste events to better preserve formatting and variables
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const editor = quillInstance || quillRef.current?.getEditor();
    if (!editor) return;
    
    // Handle variables in pasted content
    setTimeout(() => {
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
    }, 10);
  }, [quillInstance]);
  
  // Get the Quill instance after mounting
  useEffect(() => {
    // This effect runs once to capture the Quill instance
    if (quillRef.current && quillRef.current.getEditor) {
      const editor = quillRef.current.getEditor();
      setQuillInstance(editor);
    }
  }, []);

  // Sync the editor content with the parent component's state
  useEffect(() => {
    setEditorHtml(value);
    
    // After setting content, find and style all variable placeholders
    if (quillInstance || quillRef.current?.getEditor()) {
      setTimeout(() => {
        const editor = quillInstance || quillRef.current?.getEditor();
        if (editor) {
          const content = editor.getText();
          const variableRegex = /\{\{([^}]+)\}\}/g;
          let match;
          
          // Find and format variables
          while ((match = variableRegex.exec(content)) !== null) {
            const start = match.index;
            const length = match[0].length;
            
            editor.formatText(start, length, {
              'color': '#2563eb',
              'background': '#dbeafe',
              'bold': true,
            }, 'api');
          }
        }
      }, 10);
    }
  }, [value, quillInstance]);

  // Add event listener for paste
  useEffect(() => {
    const container = quillRef.current?.getContainerRef?.();
    
    if (container) {
      // Add paste event listener to the container rather than document
      container.addEventListener('paste', handlePaste as unknown as EventListener, true);
      return () => {
        container.removeEventListener('paste', handlePaste as unknown as EventListener, true);
      };
    } else {
      // Fallback to document if container ref isn't available
      document.addEventListener('paste', handlePaste as unknown as EventListener, true);
      return () => {
        document.removeEventListener('paste', handlePaste as unknown as EventListener, true);
      };
    }
  }, [handlePaste, quillRef]);

  // Define enhanced toolbar options for Quill
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'blockquote'],
        ['clean']
      ],
    },
    clipboard: {
      // Skip the default handling mechanism to better preserve our variables
      matchVisual: false
    }
  };

  // Define formats that the editor should allow - fixed for Quill 2.x
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'align', 'link', 'blockquote'
  ];

  // Handle changes in the editor
  const handleChange = (html: string) => {
    setEditorHtml(html);
    onChange(html);
  };

  // Custom function to insert a variable placeholder at cursor position
  const insertVariable = (variableName: string) => {
    const editor = quillInstance || quillRef.current?.getEditor();
    if (!editor) return;
    
    const range = editor.getSelection();
    const position = range ? range.index : 0;
    
    // Insert the variable placeholder at the cursor position
    editor.insertText(position, `{{${variableName}}}`, {
      'color': '#2563eb',
      'background': '#dbeafe',
      'bold': true,
    });
    
    // Move cursor after the inserted variable
    editor.setSelection(position + variableName.length + 4, 0);
  };

  // Apply custom format (support note, warning note, etc.)
  const applyCustomFormat = (formatClass: string, wrapperTag: string = 'div') => {
    const editor = quillInstance || quillRef.current?.getEditor();
    if (!editor) return;
    
    const range = editor.getSelection();
    if (!range) return;
    
    // Get the selected text
    const selectedText = editor.getText(range.index, range.length);
    
    // Delete the selected text
    editor.deleteText(range.index, range.length);
    
    // Create the formatted element
    const formattedHTML = `<${wrapperTag} class="${formatClass}">${selectedText}</${wrapperTag}>`;
    
    // Insert the formatted element
    editor.clipboard.dangerouslyPasteHTML(range.index, formattedHTML);
    
    // Select the newly inserted content
    editor.setSelection(range.index + formattedHTML.length, 0);
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

  return (
    <div className="rich-text-editor">
      <style>{editorStyle}</style>
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
                
                {/* Simple table button - using direct HTML insertion */}
                <button
                  type="button"
                  onClick={() => {
                    const editor = quillInstance || quillRef.current?.getEditor();
                    if (editor) {
                      const range = editor.getSelection();
                      const index = range ? range.index : 0;
                      
                      // Simple table HTML with traditional HTML attributes
                      const tableHTML = `
                        <table border="1" cellpadding="5" cellspacing="0" style="width:100%; margin:10px 0; border-collapse:collapse;">
                          <tbody>
                            <tr>
                              <th style="background-color:#f3f3f3; font-weight:bold; text-align:left; border:1px solid #ccc; padding:8px;">Header 1</th>
                              <th style="background-color:#f3f3f3; font-weight:bold; text-align:left; border:1px solid #ccc; padding:8px;">Header 2</th>
                              <th style="background-color:#f3f3f3; font-weight:bold; text-align:left; border:1px solid #ccc; padding:8px;">Header 3</th>
                            </tr>
                            <tr>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 1-1</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 1-2</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 1-3</td>
                            </tr>
                            <tr>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 2-1</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 2-2</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell 2-3</td>
                            </tr>
                          </tbody>
                        </table>
                        <p><br></p>
                      `;
                      
                      // Insert the table HTML directly
                      editor.clipboard.dangerouslyPasteHTML(index, tableHTML);
                      
                      // Move cursor after the table
                      setTimeout(() => {
                        editor.setSelection(index + 1, 0);
                      }, 10);
                    }
                  }}
                  className="text-xs m-1 px-2 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 cursor-pointer"
                >
                  Insert Table
                </button>
              </div>
            </div>
            
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
                  onClick={() => {
                    const editor = quillInstance || quillRef.current?.getEditor();
                    if (editor) {
                      const range = editor.getSelection();
                      const position = range ? range.index : 0;
                      editor.clipboard.dangerouslyPasteHTML(position, '<p>Thank you for contacting our support team. We appreciate your patience.</p>');
                    }
                  }}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Thank You Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const editor = quillInstance || quillRef.current?.getEditor();
                    if (editor) {
                      const range = editor.getSelection();
                      const position = range ? range.index : 0;
                      editor.clipboard.dangerouslyPasteHTML(position, '<p>Please let us know if you have any other questions.</p><p>Best regards,<br>{{agentName}}<br>{{teamName}} Support</p>');
                    }
                  }}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Closing Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const editor = quillInstance || quillRef.current?.getEditor();
                    if (editor) {
                      const range = editor.getSelection();
                      const position = range ? range.index : 0;
                      editor.clipboard.dangerouslyPasteHTML(position, '<div class="info-note">For additional information, please visit our knowledge base or documentation.</div>');
                    }
                  }}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Resources Info
                </button>
                
                {/* Simple 2x2 table button for quick tables */}
                <button
                  type="button"
                  onClick={() => {
                    const editor = quillInstance || quillRef.current?.getEditor();
                    if (editor) {
                      const range = editor.getSelection();
                      const position = range ? range.index : 0;
                      
                      // Simple 2x2 table that works everywhere
                      const smallTableHTML = `
                        <table border="1" cellpadding="5" cellspacing="0" style="width:100%; margin:10px 0; border-collapse:collapse;">
                          <tbody>
                            <tr>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left; font-weight:bold;">Item</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left; font-weight:bold;">Description</td>
                            </tr>
                            <tr>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Item 1</td>
                              <td style="border:1px solid #ccc; padding:8px; text-align:left;">Description 1</td>
                            </tr>
                          </tbody>
                        </table>
                        <p><br></p>
                      `;
                      
                      editor.clipboard.dangerouslyPasteHTML(position, smallTableHTML);
                      editor.setSelection(position + 1, 0);
                    }
                  }}
                  className="text-xs m-1 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Simple Table
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