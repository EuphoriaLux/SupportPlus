import React from 'react';
import { Template } from '../types';

interface TemplateLanguageSelectorProps {
  templateName: string;
  templates: Template[];
  currentLanguage: string;
  onLanguageChange: (templateId: string) => void;
}

const TemplateLanguageSelector: React.FC<TemplateLanguageSelectorProps> = ({
  templateName,
  templates,
  currentLanguage,
  onLanguageChange
}) => {
  // Filter templates that share the same name
  const availableTemplates = templates.filter(t => t.name === templateName);
  
  // If only one template is available, don't show the selector
  if (availableTemplates.length <= 1) {
    return null;
  }
  
  // Group templates by language
  const templatesByLanguage: Record<string, Template> = {};
  availableTemplates.forEach(template => {
    const language = template.language || 'EN';
    templatesByLanguage[language] = template;
  });
  
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 mr-2">
          Edit language version:
        </label>
        <select
          className="px-3 py-1 border rounded"
          value={currentLanguage}
          onChange={(e) => {
            const selectedLang = e.target.value;
            const template = templatesByLanguage[selectedLang];
            if (template) {
              onLanguageChange(template.id);
            }
          }}
        >
          {Object.entries(templatesByLanguage).map(([language, template]) => (
            <option key={language} value={language}>
              {language === 'EN' ? 'English' : 
               language === 'FR' ? 'French' : 
               language === 'DE' ? 'German' : language}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Object.entries(templatesByLanguage).map(([language, template]) => (
          <span 
            key={language}
            onClick={() => onLanguageChange(template.id)}
            className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
              language === currentLanguage 
                ? 'bg-blue-200 text-blue-800 font-bold border-2 border-blue-400' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {language}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TemplateLanguageSelector;