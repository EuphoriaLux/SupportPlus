import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// Import Quill directly for direct access to its features
import Quill from 'quill';

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
interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Create a ref-based version of ReactQuill to avoid findDOMNode
const ReactQuillWithRef = forwardRef((props: any, ref) => {
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
      <ReactQuillWithRef
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