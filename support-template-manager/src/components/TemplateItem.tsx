import React from 'react';
import { Template } from '../types';

interface TemplateItemProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onCopy: (template: Template, e: React.MouseEvent) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ 
  template, 
  onEdit, 
  onDelete, 
  onCopy 
}) => {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{template.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {template.category}
          </span>
          {template.language && (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              template.language === 'EN' ? 'bg-green-100 text-green-800' :
              template.language === 'FR' ? 'bg-purple-100 text-purple-800' :
              template.language === 'DE' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {template.language}
            </span>
          )}
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
          className="text-green-600 hover:text-green-900 mr-3"
          onClick={(e) => onCopy(template, e)}
        >
          Copy
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