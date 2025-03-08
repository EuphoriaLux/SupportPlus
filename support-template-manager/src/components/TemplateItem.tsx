import React from 'react';
import { Template } from '../types';

interface TemplateItemProps {
  template: Template;
  allTemplates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onCopy: (template: Template, e: React.MouseEvent) => void;
  onTranslate: (template: Template) => void;
  onLanguageSelect: (templateId: string) => void;
  expanded: boolean;
  toggleExpanded: () => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ 
  template, 
  allTemplates,
  onEdit, 
  onDelete, 
  onCopy,
  onTranslate,
  onLanguageSelect,
  expanded,
  toggleExpanded
}) => {
  // Find all translations of this template
  const translations = allTemplates.filter(t => 
    t.baseId === template.baseId && 
    t.id !== template.id
  );

  // Get all available languages and missing languages
  const availableLanguages = [
    template.language || 'EN',
    ...translations.map(t => t.language || 'EN')
  ];
  
  const allLanguages = ['EN', 'FR', 'DE'];
  const missingLanguages = allLanguages.filter(lang => 
    !availableLanguages.includes(lang as 'EN' | 'FR' | 'DE')
  );

  // Helper function to get language name
  const getLanguageName = (code: string): string => {
    switch(code) {
      case 'EN': return 'English';
      case 'FR': return 'French';
      case 'DE': return 'German';
      default: return code;
    }
  };

  // Helper function to get language color classes
  const getLanguageClasses = (lang: string): string => {
    switch (lang) {
      case 'EN': return 'bg-green-100 text-green-800 border-green-300';
      case 'FR': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DE': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <tr className={`${expanded ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`} 
          onClick={toggleExpanded}>
        <td className="px-6 py-4">
          <div className="font-medium text-gray-900 flex items-center">
            <span className={`mr-2 transform transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
            {template.name}
          </div>
        </td>
        
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {template.category}
          </span>
        </td>
        
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {/* Primary language */}
            <span 
              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border-2 ${
                getLanguageClasses(template.language || 'EN')
              } cursor-pointer`}
              title="This is the current language version"
            >
              {getLanguageName(template.language || 'EN')}
            </span>
            
            {/* Available translations */}
            {translations.map(t => (
              <span 
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onLanguageSelect(t.id);
                }}
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  getLanguageClasses(t.language || 'EN')
                } cursor-pointer hover:opacity-80`}
                title={`Click to switch to ${getLanguageName(t.language || 'EN')} version`}
              >
                {getLanguageName(t.language || 'EN')}
              </span>
            ))}
            
            {/* Missing translations */}
            {missingLanguages.length > 0 && (
              <span 
                className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onTranslate(template);
                }}
                title="Click to add a missing translation"
              >
                +{missingLanguages.length} more
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
            onClick={(e) => {
              e.stopPropagation();
              onCopy(template, e);
            }}
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
      
      {/* Expanded view */}
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">All Language Versions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allLanguages.map((lang) => {
                  const langTemplate = lang === (template.language || 'EN') 
                    ? template 
                    : translations.find(t => (t.language || 'EN') === lang);
                  
                  return (
                    <div key={lang} className={`border-l-4 p-3 rounded bg-white shadow-sm ${
                      langTemplate 
                        ? `border-${lang === 'EN' ? 'green' : lang === 'FR' ? 'purple' : 'orange'}-400` 
                        : 'border-gray-300'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          getLanguageClasses(lang)
                        }`}>
                          {getLanguageName(lang)}
                        </span>
                        
                        {langTemplate ? (
                          <div className="flex space-x-2">
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(langTemplate);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-xs text-green-600 hover:text-green-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopy(langTemplate, e as any);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="text-xs text-purple-600 hover:text-purple-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTranslate(template);
                            }}
                          >
                            Add Translation
                          </button>
                        )}
                      </div>
                      
                      {langTemplate ? (
                        <div className="text-sm text-gray-700 whitespace-pre-line overflow-hidden line-clamp-4 font-mono text-xs">
                          {langTemplate.content}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          No translation available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Variables</h3>
              {template.variables.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {template.variables.map(variable => (
                    <div key={variable.name} className="bg-white p-2 rounded border">
                      <div className="font-medium text-sm">{variable.name}</div>
                      <div className="text-xs text-gray-500">{variable.description}</div>
                      {variable.defaultValue && (
                        <div className="text-xs text-gray-500">
                          Default: <span className="font-mono">{variable.defaultValue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">
                  No variables defined
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default TemplateItem;