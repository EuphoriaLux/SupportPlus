import React, { forwardRef } from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Create a forwardRef version of the component to avoid findDOMNode warnings
const RichTextEditor = forwardRef<any, RichTextEditorProps>((props, ref) => {
  return <SimpleRichTextEditor {...props} />;
});

// Set display name for better debugging
RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;