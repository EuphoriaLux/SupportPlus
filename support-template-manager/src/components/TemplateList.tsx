import React from 'react';
import { Template } from '../types';
import TemplateItem from './TemplateItem';

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onCopy: (template: Template, e: React.MouseEvent) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ 
  templates, 
  onEdit, 
  onDelete, 
  onCopy 
}) => {
  if (templates.length === 0) {
    return (
      <div className="bg-white shadow-md rounded p-12 text-center">
        <p className="text-gray-500 mb-4">No templates found</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => onEdit({} as Template)}
        >
          Create Your First Template
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category/Language
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Content Preview
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Variables
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map(template => (
            <TemplateItem 
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TemplateList;