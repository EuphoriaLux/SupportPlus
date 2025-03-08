import React, { useState, useEffect } from 'react';
import { Template, Variable, TemplateGroup } from '../types';
import { extractVariables } from '../utils/parser';
import { storageService } from '../services/storage';

interface MultilingualTemplateFormProps {
  template?: Template;
  onSave: (data: { 
    name: string; 
    category: string; 
    content: string;
    language: 'EN' | 'FR' | 'DE';
  }) => void;
  onCancel: () => void;
}

const MultilingualTemplateForm: React.FC<MultilingualTemplateFormProps> = ({ 
  template, 
  onSave, 
  onCancel 
}) => {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'General');
  const [content, setContent] = useState(template?.content || '');
  const [language, setLanguage] = useState<'EN' | 'FR' | 'DE'>(template?.language || 'EN');
  const [variables, setVariables] = useState<string[]>([]);
  const [templateGroup, setTemplateGroup] = useState<TemplateGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template group data (all language versions of this template)
  useEffect(() => {
    const loadTemplateGroup = async () => {
      if (!template) return;
      
      setLoading(true);
      try {
        const allTemplates = await storageService.getTemplates();
        
        // Find all templates with the same baseId
        const relatedTemplates = allTemplates.filter(t => 
          t.baseId === template.baseId
        );
        
        // Create a template group
        const group: TemplateGroup = {
          baseId: template.baseId,
          name: template.name,
          category: template.category,
          templates: {
            'EN': null,
            'FR': null,
            'DE': null
          },
          variables: template.variables
        };
        
        // Add each template to its language slot
        relatedTemplates.forEach(t => {
          const lang = t.language || 'EN';
          if (lang === 'EN' || lang === 'FR' || lang === 'DE') {
            group.templates[lang] = t;
          }
        });
        
        setTemplateGroup(group);
      } catch (err) {
        setError('Failed to load template translations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplateGroup();
  }, [template]);

  // Extract variables when content changes
  useEffect(() => {
    if (content) {
      const extractedVars = extractVariables(content);
      setVariables(extractedVars);
    } else {
      setVariables([]);
    }
  }, [content]);

  // Handle switching between language versions
  const handleLanguageChange = (lang: 'EN' | 'FR' | 'DE') => {
    if (!templateGroup) return;
    
    // Check if we're editing an existing translation
    if (template && templateGroup.templates[lang]) {
      // We have a translation in this language, navigate to it
      const selectedTemplate = templateGroup.templates[lang];
      if (selectedTemplate) {
        // Instead of updating state, we'll navigate to the other template
        if (confirm('Switch to the existing translation in this language?')) {
          // Tell the parent to change the template being edited
          // This requires a callback to be passed from the parent
          window.location.href = `?edit=${selectedTemplate.id}`;
          return;
        }
      }
    }
    
    // We're creating a new translation or the user canceled navigation
    setLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !content) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if we're trying to create a duplicate language version
    if (templateGroup && !template && templateGroup.templates[language]) {
      alert(`A ${language} translation already exists for this template. Please select a different language.`);
      return;
    }
    
    try {
      onSave({
        name,
        category,
        content,
        language
      });
    } catch (err) {
      alert('Failed to save template: ' + (err as Error).message);
    }
  };

  // Get available languages (those that don't already have a template)
  const getAvailableLanguages = () => {
    if (!template || !templateGroup) {
      return ['EN', 'FR', 'DE'];
    }
    
    return ['EN', 'FR', 'DE'].filter(lang => 
      !templateGroup.templates[lang] || templateGroup.templates[lang]?.id === template.id
    );
  };

  // Check if this is a new template or a translation of an existing one
  const isNewTemplate = !template;
  const isEditingExistingTranslation = template && templateGroup && Object.values(templateGroup.templates).filter(t => t !== null).length > 1;
  
  // Determine if name/category should be editable
  const isNameEditable = isNewTemplate || (template && !isEditingExistingTranslation);
  const isCategoryEditable = isNameEditable;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading && <div className="text-center py-4">Loading template data...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {templateGroup && (
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-medium text-blue-800 mb-2">Available Translations</h3>
          <div className="flex gap-2">
            {(['EN', 'FR', 'DE'] as const).map(lang => {
              const hasTranslation = templateGroup.templates[lang] !== null;
              const isCurrentLanguage = template?.language === lang;
              
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded-full text-xs font-medium 
                    ${isCurrentLanguage 
                      ? 'bg-blue-500 text-white' 
                      : hasTranslation 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  disabled={isCurrentLanguage}
                >
                  {lang === 'EN' ? 'English' : lang === 'FR' ? 'French' : 'German'}
                  {hasTranslation && ' ✓'}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {isEditingExistingTranslation 
              ? 'This template has translations. Name and category are shared across all translations.' 
              : 'You can add translations after saving this template.'}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template Name*
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded ${!isNameEditable ? 'bg-gray-100' : ''}`}
          placeholder="e.g., Welcome Response"
          required
          disabled={!isNameEditable}
        />
        {!isNameEditable && (
          <p className="text-xs text-gray-500 mt-1">
            Template name is shared across all translations.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category*
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full px-3 py-2 border rounded ${!isCategoryEditable ? 'bg-gray-100' : ''}`}
          placeholder="e.g., General, Technical, Billing"
          required
          disabled={!isCategoryEditable}
        />
        {!isCategoryEditable && (
          <p className="text-xs text-gray-500 mt-1">
            Category is shared across all translations.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language*
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'EN' | 'FR' | 'DE')}
          className="w-full px-3 py-2 border rounded"
          disabled={!!template} // Can't change language of existing template
        >
          {getAvailableLanguages().map(lang => (
            <option key={lang} value={lang}>
              {lang === 'EN' ? 'English' : lang === 'FR' ? 'French' : 'German'}
            </option>
          ))}
        </select>
        {!!template && (
          <p className="text-xs text-gray-500 mt-1">
            Language cannot be changed for existing templates. Create a new translation instead.
          </p>
        )}
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
          {isEditingExistingTranslation && (
            <p className="text-xs text-blue-600 mt-2">
              Try to keep the same variables across all translations for consistent functionality.
            </p>
          )}
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

export default MultilingualTemplateForm;