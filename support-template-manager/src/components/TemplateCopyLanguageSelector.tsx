import React from 'react';
import { Template } from '../types';

interface TemplateCopyLanguageSelectorProps {
  template: Template;
  translations: Template[];
  onSelectLanguage: (templateId: string) => void;
  onCancel: () => void;
}

const TemplateCopyLanguageSelector: React.FC<TemplateCopyLanguageSelectorProps> = ({
  template,
  translations,
  onSelectLanguage,
  onCancel
}) => {
  // Combine current template with its translations
  const allVersions = [template, ...translations];
  
  // Get language display name
  const getLanguageDisplay = (lang: string): string => {
    switch (lang) {
      case 'EN': return 'English';
      case 'FR': return 'French';
      case 'DE': return 'German';
      default: return lang;
    }
  };
  
  // Get style classes for language buttons
  const getLanguageClasses = (lang: string): string => {
    switch (lang) {
      case 'EN': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'FR': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'DE': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-lg font-bold mb-4">Select Template Language</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          This template is available in multiple languages. Select the language version you wish to copy.
        </p>
        
        <div className="space-y-2">
          {allVersions.map(version => (
            <button
              key={version.id}
              onClick={() => onSelectLanguage(version.id)}
              className={`w-full py-3 px-4 rounded-md flex items-center justify-between ${
                getLanguageClasses(version.language || 'EN')
              }`}
            >
              <div className="flex items-center">
                <span className="font-medium">
                  {getLanguageDisplay(version.language || 'EN')}
                </span>
                {version.id === template.id && (
                  <span className="ml-2 text-xs italic">(current)</span>
                )}
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCopyLanguageSelector;