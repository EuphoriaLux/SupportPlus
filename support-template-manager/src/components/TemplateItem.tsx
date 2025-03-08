import React from 'react';
import { Template } from '../types';

interface TemplateItemProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onCopy: (template: Template, e: React.MouseEvent) => void;
  onTranslate: (template: Template) => void;
  allTemplates: Template[]; // Add all templates to find translations
}

const TemplateItem: React.FC<TemplateItemProps> = ({ 
  template, 
  onEdit, 
  onDelete, 
  onCopy,
  onTranslate,
  allTemplates
}) => {
  // Find all translations of this template
  const translations = allTemplates.filter(t => 
    t.name === template.name && 
    t.id !== template.id
  );

  // Get all available languages for this template
  const availableLanguages = [
    template.language || 'EN',
    ...translations.map(t => t.language || 'EN')
  ];

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{template.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-2">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {template.category}
          </span>
          
          <div className="flex flex-wrap gap-1 mt-1">
            {/* Current template language */}
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              template.language === 'EN' ? 'bg-green-100 text-green-800' :
              template.language === 'FR' ? 'bg-purple-100 text-purple-800' :
              template.language === 'DE' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800' // Default to English styling if no language
            }`}>
              {template.language || 'EN'}
            </span>
            
            {/* Show available translations */}
            {translations.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">+</span>
                {translations.map(t => (
                  <span 
                    key={t.id}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      t.language === 'EN' ? 'bg-green-100 text-green-800' :
                      t.language === 'FR' ? 'bg-purple-100 text-purple-800' :
                      t.language === 'DE' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}
                    title={`Click 'Translate' to edit this translation`}
                  >
                    {t.language || 'EN'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 line-clamp-2">
          {template.content.substring(0, 100)}
          {template.content.length > 100 ? '...' : ''}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500">
          {template.variables.length > 0 ? (
            <span className="text-xs">
              {template.variables.map((v: { name: string }) => v.name).join(', ')}
            </span>
          ) : (
            <span className="text-xs italic">No variables</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          className="text-green-600 hover:text-green-900 mr-3 flex items-center"
          onClick={(e) => onCopy(template, e)}
        >
          <span>Copy</span>
          {translations.length > 0 && (
            <span className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
              {translations.length + 1} languages
            </span>
          )}
        </button>
        <button
          className="text-blue-600 hover:text-blue-900 mr-3"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template);
          }}
        >
          Edit
        </button>
        <button
          className="text-purple-600 hover:text-purple-900 mr-3"
          onClick={(e) => {
            e.stopPropagation();
            onTranslate(template);
          }}
        >
          Translate
        </button>
        <button
          className="text-red-600 hover:text-red-900"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this template?')) {
              onDelete(template.id);
            }
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default TemplateItem;