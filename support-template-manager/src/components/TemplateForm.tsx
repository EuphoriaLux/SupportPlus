import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { extractVariables } from '../utils/parser';

interface TemplateFormProps {
  template?: Template;
  onSave: (data: { 
    name: string; 
    category: string; 
    content: string;
    language: 'EN' | 'FR' | 'DE';
  }) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'General');
  const [content, setContent] = useState(template?.content || '');
  const [language, setLanguage] = useState<'EN' | 'FR' | 'DE'>(template?.language || 'EN');
  const [variables, setVariables] = useState<string[]>([]);

  // Extract variables when content changes
  useEffect(() => {
    if (content) {
      const extractedVars = extractVariables(content);
      setVariables(extractedVars);
    } else {
      setVariables([]);
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !content) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSave({
      name,
      category,
      content,
      language
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name*
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="e.g., Welcome Response"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category*
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="e.g., General, Technical, Billing"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'EN' | 'FR' | 'DE')}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="EN">English</option>
          <option value="FR">French</option>
          <option value="DE">German</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Content*
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border rounded font-mono"
          rows={10}
          placeholder="Hi {{customerName}},\n\nThank you for contacting us about {{issue}}.\n\nBest regards,\n{{agentName}}"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Use {"{{variableName}}"} syntax for dynamic content
        </p>
      </div>

      {variables.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            Detected Variables:
          </h3>
          <div className="flex flex-wrap gap-2">
            {variables.map(variable => (
              <span 
                key={variable}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

export default TemplateForm;