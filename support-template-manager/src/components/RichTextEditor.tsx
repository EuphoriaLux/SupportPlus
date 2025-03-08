import React from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// This is a wrapper around SimpleRichTextEditor to ensure backward compatibility
const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {
  return <SimpleRichTextEditor {...props} />;
};

export default RichTextEditor;