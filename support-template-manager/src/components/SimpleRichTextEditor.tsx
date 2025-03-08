// This is a placeholder component that redirects to SimpleRichTextEditor
// It's here just to avoid build errors from existing imports

import React from 'react';
import SimpleRichTextEditor from './SimpleRichTextEditor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// This is just a wrapper around SimpleRichTextEditor to avoid build errors
const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {
  return <SimpleRichTextEditor {...props} />;
};

export default RichTextEditor;