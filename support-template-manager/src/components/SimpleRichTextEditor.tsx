import React, { useEffect, useRef, useState, RefObject, ClipboardEvent } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  }
`;

// Define the props for the enhanced ReactQuill component
interface EnhancedReactQuillProps {
  forwardedRef: RefObject<ReactQuill>;
  value: string;
  onChange: (value: string) => void;
  theme?: string;
  modules?: any;
  formats?: string[];
  placeholder?: string;
}

// Custom wrapper for ReactQuill that enhances clipboard handling for HTML content
const EnhancedReactQuill: React.FC<EnhancedReactQuillProps> = ({ 
  forwardedRef,
  ...props 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Handle paste events to better preserve formatting and variables
    const handlePaste = (e: ClipboardEvent) => {
      if (containerRef.current && e.target instanceof Node && containerRef.current.contains(e.target)) {
        const clipboardData = e.clipboardData;
        if (clipboardData) {
          const html = clipboardData.getData('text/html');
          if (html) {
            // Look for variables in the pasted content
            const varRegex = /\{\{([^}]+)\}\}/g;
            if (varRegex.test(html)) {
              // Let Quill handle the paste event normally, but we'll format variables after
              setTimeout(() => {
                if (forwardedRef.current) {
                  const editor = forwardedRef.current.getEditor();
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
                }
              }, 10);
            }
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste as unknown as EventListener, true);
    return () => {
      document.removeEventListener('paste', handlePaste as unknown as EventListener, true);
    };
  }, [forwardedRef]);
  
  return (
    <div ref={containerRef}>
      <ReactQuill ref={forwardedRef} {...props} />
    </div>
  );
};

// Create a forwardRef version of the component with correct typing
const ForwardedReactQuill = React.forwardRef<ReactQuill, Omit<EnhancedReactQuillProps, 'forwardedRef'>>((props, ref) => (
  <EnhancedReactQuill {...props} forwardedRef={ref as RefObject<ReactQuill>} />
));

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...'
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [editorHtml, setEditorHtml] = useState(value);
  
  // Sync the editor content with the parent component's state
  useEffect(() => {
    setEditorHtml(value);
    
    // After setting content, find and style all variable placeholders
    // This is now handled in a more controlled way using the ref
    setTimeout(() => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
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
  }, [value]);

  // Define toolbar options for Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      // Skip the default handling mechanism to better preserve our variables
      matchVisual: false
    }
  };

  // Define formats that the editor should allow
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  // Handle changes in the editor
  const handleChange = (html: string) => {
    // Preserve variables in the editor content
    // This is a simpler approach that works well with the forwardRef implementation
    setEditorHtml(html);
    onChange(html);
  };

  // Custom function to insert a variable placeholder at cursor position
  const insertVariable = (variableName: string) => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    const position = range ? range.index : 0;
    
    // Insert the variable placeholder at the cursor position
    quill.insertText(position, `{{${variableName}}}`, {
      'color': '#2563eb',
      'background': '#dbeafe',
      'bold': true,
    });
    
    // Move cursor after the inserted variable
    quill.setSelection(position + variableName.length + 4, 0);
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

  return (
    <div className="rich-text-editor">
      <style>{editorStyle}</style>
      <ForwardedReactQuill
        ref={quillRef}
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      
      <div className="mt-2 flex flex-wrap items-center">
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
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;