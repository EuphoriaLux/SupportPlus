import React, { useState, useEffect } from 'react';
import { Template, Variable } from '../types';
import { storageService } from '../services/storage';
import { extractVariables } from '../utils/parser';

interface TemplateTranslationManagerProps {
  template: Template;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateTranslationManager: React.FC<TemplateTranslationManagerProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [translations, setTranslations] = useState<{
    EN?: string;
    FR?: string;
    DE?: string;
  }>({});
  
  const [targetLanguage, setTargetLanguage] = useState<'EN' | 'FR' | 'DE'>(
    template.language === 'EN' ? 'FR' : 
    template.language === 'FR' ? 'DE' : 'EN'
  );
  
  const [existingTranslations, setExistingTranslations] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Find existing translations of this template
  useEffect(() => {
    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const allTemplates = await storageService.getTemplates();
        
        // Find templates with the same name but different languages
        const relatedTemplates = allTemplates.filter(t => 
          t.name === template.name && 
          t.id !== template.id
        );
        
        setExistingTranslations(relatedTemplates);
        
        // Map existing translations
        const translationMap: {[key: string]: string} = {};
        relatedTemplates.forEach(t => {
          if (t.language) {
            translationMap[t.language] = t.content;
          }
        });
        
        setTranslations(translationMap);
      } catch (error) {
        console.error('Error fetching translations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTranslations();
  }, [template]);

  // Create a new translation
  const handleCreateTranslation = async () => {
    if (!translations[targetLanguage]) {
      alert('Please enter content for the translation');
      return;
    }

    try {
      // Create a new template with the translated content
      await storageService.addTemplate({
        name: template.name,
        category: template.category,
        content: translations[targetLanguage] || '',
        variables: template.variables.map(v => ({
          ...v,
          // Allow modifications to variable descriptions in the future
        })),
        language: targetLanguage,
        isRichText: true // Add this to fix the TypeScript error
      });
      
      onSave();
    } catch (error) {
      console.error('Error creating translation:', error);
      alert('Failed to create translation');
    }
  };

  // Update an existing translation
  const handleUpdateTranslation = async () => {
    const existingTranslation = existingTranslations.find(
      t => t.language === targetLanguage
    );
    
    if (!existingTranslation) {
      handleCreateTranslation();
      return;
    }

    try {
      await storageService.updateTemplate(existingTranslation.id, {
        content: translations[targetLanguage] || ''
      });
      
      onSave();
    } catch (error) {
      console.error('Error updating translation:', error);
      alert('Failed to update translation');
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-xl font-bold mb-4">Manage Translations for "{template.name}"</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Current language: <strong>{template.language || 'EN'}</strong>
        </p>
        
        {existingTranslations.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Existing translations:
            </p>
            <div className="flex gap-2">
              {existingTranslations.map(t => (
                <span 
                  key={t.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {t.language}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Original content ({template.language || 'EN'})
        </label>
        <textarea
          className="w-full px-3 py-2 border rounded font-mono bg-gray-50"
          rows={6}
          value={template.content}
          readOnly
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Target language
          </label>
          <div className="text-xs text-gray-500">
            Variables: {extractVariables(template.content).join(', ')}
          </div>
        </div>
        <select
          className="w-full px-3 py-2 border rounded mb-2"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value as 'EN' | 'FR' | 'DE')}
        >
          {template.language !== 'EN' && <option value="EN">English</option>}
          {template.language !== 'FR' && <option value="FR">French</option>}
          {template.language !== 'DE' && <option value="DE">German</option>}
        </select>
        
        <textarea
          className="w-full px-3 py-2 border rounded font-mono"
          rows={6}
          value={translations[targetLanguage] || ''}
          onChange={(e) => setTranslations({
            ...translations,
            [targetLanguage]: e.target.value
          })}
          placeholder={`Translate the content to ${
            targetLanguage === 'EN' ? 'English' : 
            targetLanguage === 'FR' ? 'French' : 'German'
          }. Keep the {{variables}} as they are.`}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        
        {existingTranslations.some(t => t.language === targetLanguage) ? (
          <button
            type="button"
            onClick={handleUpdateTranslation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Update Translation
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreateTranslation}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Translation
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateTranslationManager;