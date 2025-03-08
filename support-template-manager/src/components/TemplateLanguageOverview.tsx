import React, { useState } from 'react';
import { Template, TemplateGroup } from '../types';

interface TemplateLanguageOverviewProps {
  templateGroups: TemplateGroup[];
  onSelectTemplate: (templateId: string) => void;
  onAddTranslation: (baseId: string, language: 'EN' | 'FR' | 'DE') => void;
}

// Type guard to check if a string is a valid language code
const isValidLanguage = (lang: string): lang is 'EN' | 'FR' | 'DE' => {
  return lang === 'EN' || lang === 'FR' || lang === 'DE';
};

const TemplateLanguageOverview: React.FC<TemplateLanguageOverviewProps> = ({
  templateGroups,
  onSelectTemplate,
  onAddTranslation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  // Get all unique categories from template groups
  const categories = [...new Set(templateGroups.map(group => group.category))].sort();
  
  // Filter template groups by search term and category
  const filteredGroups = templateGroups.filter(group => {
    // Filter by search term
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === '' || group.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  // Helper function to get a display name for a language
  const getLanguageName = (code: 'EN' | 'FR' | 'DE') => {
    return code === 'EN' ? 'English' : code === 'FR' ? 'French' : 'German';
  };
  
  // Helper function to get CSS class for a language badge
  const getLanguageClass = (code: 'EN' | 'FR' | 'DE') => {
    return code === 'EN' 
      ? 'bg-green-100 text-green-800' 
      : code === 'FR' 
        ? 'bg-purple-100 text-purple-800' 
        : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full px-3 py-2 border rounded"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="px-3 py-2 border rounded w-48"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available Languages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Missing Languages
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGroups.map(group => {
              // Get available languages
              const availableLanguages: ('EN' | 'FR' | 'DE')[] = (['EN', 'FR', 'DE'] as const).filter(
                lang => group.templates[lang] !== null
              );
              
              // Get missing languages
              const missingLanguages: ('EN' | 'FR' | 'DE')[] = (['EN', 'FR', 'DE'] as const).filter(
                lang => group.templates[lang] === null
              );
              
              // Find primary template (English or first available)
              const primaryTemplate = group.templates['EN'] || 
                (availableLanguages.length > 0 ? group.templates[availableLanguages[0]] : null);
                
              if (!primaryTemplate) return null; // Skip if no template is available
              
              return (
                <tr key={group.baseId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{group.name}</div>
                    {primaryTemplate && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {primaryTemplate.content.substring(0, 80)}
                        {primaryTemplate.content.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {group.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {availableLanguages.map(lang => {
                        const template = group.templates[lang];
                        if (!template) return null;
                        
                        return (
                          <button 
                            key={lang}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${getLanguageClass(lang)}`}
                            onClick={() => onSelectTemplate(template.id)}
                          >
                            {getLanguageName(lang)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {missingLanguages.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {missingLanguages.map(lang => (
                          <button
                            key={lang}
                            className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer bg-gray-200 text-gray-600 hover:bg-gray-300"
                            onClick={() => onAddTranslation(group.baseId, lang)}
                          >
                            + Add {getLanguageName(lang)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">
                        All languages available
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredGroups.length === 0 && (
        <div className="text-center py-8 bg-white shadow-md rounded">
          <p className="text-gray-500">No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateLanguageOverview;