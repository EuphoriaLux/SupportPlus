import React, { useState, useEffect } from 'react';
import { Template } from '../types';
import { parseTemplate } from '../utils/parser';
import { copyToClipboard } from '../utils/clipboard';

interface VariableModalProps {
  template: Template;
  initialValues?: Record<string, string>;
  title?: string;
  buttonText?: string;
  onApply: (values: Record<string, string>) => void;
  onCancel: () => void;
}

const VariableModal: React.FC<VariableModalProps> = ({
  template,
  initialValues = {},
  title = 'Fill Template Variables',
  buttonText = 'Apply Template',
  onApply,
  onCancel
}) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  // Initialize values with defaults from template
  useEffect(() => {
    const defaultValues = template.variables.reduce((acc: Record<string, string>, variable) => {
      if (variable.defaultValue && !initialValues[variable.name]) {
        acc[variable.name] = variable.defaultValue;
      }
      return acc;
    }, {});

    setValues({ ...defaultValues, ...initialValues });
  }, [template, initialValues]);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse the template with the provided variable values
    const { content } = parseTemplate(template, values);
    
    // Copy to clipboard directly from the component
    copyToClipboard(content, 'Template copied to clipboard!')
      .then(() => {
        // Notify parent component that variables were applied
        onApply(values);
      })
      .catch(error => {
        console.error('Error copying to clipboard:', error);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-6 w-96 max-w-full">
        <h2 className="text-lg font-bold mb-4">
          {title}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {template.variables.map((variable) => (
            <div key={variable.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {variable.description || variable.name}
              </label>
              
              {variable.type === 'dropdown' && variable.options && variable.options.length > 0 ? (
                <select
                  value={values[variable.name] || ''}
                  onChange={(e) => handleChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select an option</option>
                  {variable.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : variable.type === 'textarea' ? (
                <textarea
                  value={values[variable.name] || ''}
                  onChange={(e) => handleChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder={variable.defaultValue || `Value for ${variable.name}`}
                />
              ) : (
                <input
                  type="text"
                  value={values[variable.name] || ''}
                  onChange={(e) => handleChange(variable.name, e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder={variable.defaultValue || `Value for ${variable.name}`}
                />
              )}
            </div>
          ))}
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariableModal;