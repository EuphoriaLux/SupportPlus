import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Template, Variable, TemplateGroup } from './types';
import { storageService } from './services/storage';
import { extractVariables } from './utils/parser';
import { migrateToMultilingualStructure, checkMigrationNeeded } from './utils/migrationUtils';
import GlobalVariablesManager from './components/GlobalVariablesManager';
import MultilingualTemplateForm from './components/MultilingualTemplateForm';
import TemplateList from './components/TemplateList';
import VariableModal from './components/VariableModal';
import TemplateLanguageOverview from './components/TemplateLanguageOverview';
import './assets/styles.css';

// Options Page Component
const Options = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'variables' | 'multilingual'>('templates');

  // Current editing state
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  
  // For importing/exporting
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  // Variable modal state
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<Template | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'ALL' | 'EN' | 'FR' | 'DE'>('ALL');
  const [groupTranslations, setGroupTranslations] = useState<boolean>(true);

  // Check if migration is needed
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const needsMigration = await checkMigrationNeeded();
        setMigrationNeeded(needsMigration);
      } catch (err) {
        console.error('Failed to check migration status:', err);
      }
    };
    
    checkMigration();
  }, []);

  // Run migration if needed
  const handleRunMigration = async () => {
    try {
      setMigrationInProgress(true);
      await migrateToMultilingualStructure();
      setMigrationNeeded(false);
      await loadTemplates();
    } catch (err) {
      setError('Migration failed: ' + (err as Error).message);
    } finally {
      setMigrationInProgress(false);
    }
  };

  // Load templates and global variables from storage
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Get templates, template groups, and existing global variables
      const [templates, templateGroups, existingGlobalVars] = await Promise.all([
        storageService.getTemplates(),
        storageService.getTemplateGroups(),
        storageService.getGlobalVariables()
      ]);
      
      setTemplates(templates);
      setTemplateGroups(templateGroups);

      // Extract all unique variables across all templates
      const allVars = new Set<string>();
      templates.forEach(template => {
        extractVariables(template.content).forEach(varName => {
          allVars.add(varName);
        });
      });

      // Convert existing global variables to a map for easy lookup
      const existingVarsMap = new Map(
        existingGlobalVars.map(v => [v.name, v])
      );

      // Create or update global variables list
      const globalVars: Variable[] = Array.from(allVars).map(name => {
        const existing = existingVarsMap.get(name);
        if (existing) {
          return existing;
        }
        return {
          name,
          description: `Global value for ${name}`,
          defaultValue: ''
        };
      });

      setGlobalVariables(globalVars);
      setError(null);
      
      // If there are global variables that aren't saved yet, save them
      if (globalVars.length > existingGlobalVars.length) {
        await storageService.saveGlobalVariables(globalVars);
      }
    } catch (err) {
      setError('Failed to load templates and variables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load templates on initial mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Handle creating a new template
  const handleCreateNew = () => {
    setCurrentTemplate(null);
    setEditMode('create');
  };

  // Handle creating a new translation of an existing template
  const handleCreateTranslation = (template: Template, language: 'EN' | 'FR' | 'DE') => {
    // Create a new pre-filled template for the translation
    const newTemplate: Template = {
      ...template,
      id: '', // This will be generated when saved
      language,
      content: '' // Start with empty content
    };
    
    setCurrentTemplate(newTemplate);
    setEditMode('edit');
  };

  // Handle editing a template
  const handleEdit = (template: Template) => {
    setCurrentTemplate(template);
    setEditMode('edit');
  };

  // Handle saving a template
  const handleSaveTemplate = async (data: {
    name: string;
    category: string;
    content: string;
    language: 'EN' | 'FR' | 'DE';
  }) => {
    try {
      if (editMode === 'create') {
        // Create new template
        await storageService.addTemplate({
          name: data.name,
          category: data.category,
          content: data.content,
          variables: [],
          language: data.language
        });
      } else if (editMode === 'edit' && currentTemplate) {
        if (currentTemplate.id) {
          // Update existing template
          await storageService.updateTemplate(currentTemplate.id, {
            name: data.name,
            category: data.category,
            content: data.content,
            language: data.language
          });
        } else {
          // Create a new translation
          const templateToTranslate = templates.find(t => t.baseId === currentTemplate.baseId);
          if (templateToTranslate) {
            await storageService.addTranslation(
              templateToTranslate,
              data.language,
              data.content
            );
          } else {
            throw new Error('Could not find template to translate');
          }
        }
      }

      // Reload templates and reset form
      await loadTemplates();
      setEditMode(null);
      setCurrentTemplate(null);
    } catch (err) {
      setError('Failed to save template: ' + (err as Error).message);
      console.error(err);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (templateId: string) => {
    // Find the template to delete
    const templateToDelete = templates.find(t => t.id === templateId);
    if (!templateToDelete) return;
    
    // Find all templates with the same baseId
    const relatedTemplates = templates.filter(t => 
      t.baseId === templateToDelete.baseId && 
      t.id !== templateId
    );
    
    let confirmMessage = 'Are you sure you want to delete this template?';
    
    if (relatedTemplates.length > 0) {
      confirmMessage = `This template has ${relatedTemplates.length} translation(s). Do you want to delete all language versions or just this one?
      
• Click "OK" to delete only this language version (${templateToDelete.language || 'EN'})
• Click "Cancel" then confirm to delete ALL language versions`;
      
      if (confirm(confirmMessage)) {
        // Delete only this template
        try {
          await storageService.deleteTemplate(templateId);
          await loadTemplates();
        } catch (err) {
          setError('Failed to delete template');
          console.error(err);
        }
        return;
      }
      
      // User cancelled - ask if they want to delete all translations
      if (confirm(`Delete ALL language versions of "${templateToDelete.name}"?`)) {
        try {
          // Delete all templates with this baseId
          await storageService.deleteTemplateGroup(templateToDelete.baseId);
          await loadTemplates();
        } catch (err) {
          setError('Failed to delete templates');
          console.error(err);
        }
      }
      return;
    }
    
    // No translations - simple delete with confirmation
    if (confirm(confirmMessage)) {
      try {
        await storageService.deleteTemplate(templateId);
        await loadTemplates();
      } catch (err) {
        setError('Failed to delete template');
        console.error(err);
      }
    }
  };

  // Handle copying a template with variables
  const handleCopyTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Find translations of this template
    const translations = templates.filter(t => 
      t.baseId === template.baseId && 
      t.id !== template.id
    );
    
    // If there are translations, prompt for language selection
    if (translations.length > 0) {
      // Create an array of available languages
      const availableLanguages = [
        { code: template.language || 'EN', id: template.id }
      ];
      
      translations.forEach(t => {
        availableLanguages.push({ code: t.language || 'EN', id: t.id });
      });
      
      // Construct options for prompt
      const languageOptions = availableLanguages.map(lang => 
        `${lang.code} (${lang.code === template.language ? 'current' : 'translation'})`
      ).join(', ');
      
      // Show prompt to select language
      const selectedLang = prompt(
        `Which language version would you like to copy?\nAvailable: ${languageOptions}`,
        template.language || 'EN'
      );
      
      if (!selectedLang) return; // User cancelled
      
      // Find the template with the selected language
      const selectedTemplate = availableLanguages.find(l => l.code === selectedLang)?.id;
      if (selectedTemplate) {
        const templateToUse = templates.find(t => t.id === selectedTemplate);
        if (templateToUse) {
          setTemplateToCopy(templateToUse);
          setShowVariableModal(true);
          return;
        }
      }
    }
    
    // No translations or language selection failed, use the original template
    setTemplateToCopy(template);
    setShowVariableModal(true);
  };

  // Handle variable values submitted from modal
  const handleVariableSubmit = (values: Record<string, string>) => {
    if (!templateToCopy) return;
    
    // Reset state - actual copying is handled by the VariableModal component
    setShowVariableModal(false);
    setTemplateToCopy(null);
  };

  // Handle exporting templates and global variables
  const handleExport = async () => {
    const exportData = await storageService.exportData();
    
    const exportObj = {
      templates: exportData.templates,
      globalVariables: exportData.globalVariables,
      exportDate: new Date().toISOString()
    };
    
    setExportData(JSON.stringify(exportObj, null, 2));
    setShowImportExport(true);
  };

  // Handle importing templates and global variables
  const handleImport = () => {
    try {
      const importObj = JSON.parse(importData);
      
      // Validate import data
      if (!importObj.templates || !Array.isArray(importObj.templates)) {
        throw new Error('Invalid import data format - templates missing or invalid');
      }

      const hasGlobalVars = importObj.globalVariables && Array.isArray(importObj.globalVariables);
      
      // Confirm import
      const importMessage = `Are you sure you want to import ${importObj.templates.length} templates${
        hasGlobalVars ? ` and ${importObj.globalVariables.length} global variables` : ''
      }?`;
      
      if (!confirm(importMessage)) {
        return;
      }

      // Process import
      const processImport = async () => {
        // First, handle templates import
        for (const template of importObj.templates) {
          // For each template, make sure it has the required fields
          if (!template.name || !template.category || !template.content) {
            console.warn('Skipping invalid template:', template);
            continue;
          }
          
          await storageService.addTemplate({
            name: template.name,
            category: template.category,
            content: template.content,
            variables: template.variables || [],
            language: template.language || 'EN'
          });
        }
        
        // Then, handle global variables if present
        if (hasGlobalVars) {
          await storageService.saveGlobalVariables(importObj.globalVariables);
        }
        
        // Reload everything and reset the import state
        await loadTemplates();
        setShowImportExport(false);
        setImportData('');
      };

      processImport();
    } catch (err) {
      alert('Invalid import data: ' + (err as Error).message);
    }
  };

  // Process templates to group translations if needed
  const processTemplates = (templates: Template[]) => {
    if (!groupTranslations) {
      return templates;
    }

    // Create a map of templates by baseId
    const templateGroups: Record<string, Template[]> = {};
    templates.forEach(template => {
      if (!templateGroups[template.baseId]) {
        templateGroups[template.baseId] = [];
      }
      templateGroups[template.baseId].push(template);
    });

    // Keep only primary language template or the first one found for each group
    return Object.values(templateGroups).map(group => {
      // Try to find a template in the current language filter
      if (languageFilter !== 'ALL') {
        const matchingLang = group.find(t => t.language === languageFilter);
        if (matchingLang) return matchingLang;
      }
      
      // Otherwise try English as default
      const english = group.find(t => t.language === 'EN');
      if (english) return english;
      
      // Fallback to first template
      return group[0];
    });
  };

  // Filter templates by search term and language
  const filteredTemplates = templates.filter(template => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      template.name.toLowerCase().includes(term) ||
      template.category.toLowerCase().includes(term) ||
      template.content.toLowerCase().includes(term);
    
    const matchesLanguage = 
      languageFilter === 'ALL' || 
      template.language === languageFilter || 
      (languageFilter === 'EN' && !template.language); // Treat templates without language as English
    
    return matchesSearch && matchesLanguage;
  });

  // Apply grouping if needed
  const displayTemplates = processTemplates(filteredTemplates);

  // Render migration notice if needed
  if (migrationNeeded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">Database Migration Required</h2>
          <p className="mb-4">
            Your templates need to be updated to support the new multilingual features. 
            This will group templates with the same name as translations of each other.
          </p>
          <button 
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            onClick={handleRunMigration}
            disabled={migrationInProgress}
          >
            {migrationInProgress ? 'Migration in progress...' : 'Run Migration'}
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading && templates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            setError(null);
            loadTemplates();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render template form (create/edit)
  if (editMode === 'create' || editMode === 'edit') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">
          {editMode === 'create' ? 'Create Template' : 'Edit Template'}
        </h1>
        <MultilingualTemplateForm 
          template={currentTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setEditMode(null);
            setCurrentTemplate(null);
          }}
        />
      </div>
    );
  }

  // Render import/export modal
  if (showImportExport) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Import/Export Templates</h1>

        <div className="bg-white shadow-md rounded p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Export Templates</h3>
            <p className="text-sm text-gray-600 mb-2">
              Copy this JSON data to save your templates or share with others.
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded font-mono"
              rows={10}
              value={exportData}
              readOnly
            />
            <div className="mt-2">
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                  alert('Exported data copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Import Templates</h3>
            <p className="text-sm text-gray-600 mb-2">
              Paste previously exported template JSON data here.
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded font-mono"
              rows={10}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste template export data here..."
            />
            <div className="mt-2">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleImport}
                disabled={!importData}
              >
                Import Templates
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              className="px-4 py-2 border rounded hover:bg-gray-100"
              onClick={() => {
                setShowImportExport(false);
                setExportData('');
                setImportData('');
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render variable input modal
  if (showVariableModal && templateToCopy) {
    return (
      <VariableModal
        template={templateToCopy}
        initialValues={{}}
        title="Fill Template Variables"
        buttonText="Copy to Clipboard"
        onApply={handleVariableSubmit}
        onCancel={() => {
          setShowVariableModal(false);
          setTemplateToCopy(null);
        }}
      />
    );
  }

  // Render template list (main view)
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Template Manager</h1>
        <div className="space-x-2">
          <button 
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={() => setShowImportExport(true)}
          >
            Import/Export
          </button>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleCreateNew}
          >
            Create New Template
          </button>
        </div>
      </div>

      {/* Tabs for switching between Templates, Multilingual View, and Variables */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'multilingual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('multilingual')}
          >
            Multilingual View
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'variables'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('variables')}
          >
            Variables Configuration
          </button>
        </nav>
      </div>

      {/* Templates Tab Content */}
      {activeTab === 'templates' && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search templates..."
              className="flex-1 px-3 py-2 border rounded"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            
            <select
              className="px-3 py-2 border rounded"
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value as 'ALL' | 'EN' | 'FR' | 'DE')}
            >
              <option value="ALL">All Languages</option>
              <option value="EN">English</option>
              <option value="FR">French</option>
              <option value="DE">German</option>
            </select>
            
            <div className="flex items-center px-3 py-2 border rounded">
              <input
                type="checkbox"
                id="groupTranslations"
                checked={groupTranslations}
                onChange={e => setGroupTranslations(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="groupTranslations" className="text-sm">
                Group Translations
              </label>
            </div>
              
            <button
              className="px-3 py-2 bg-green-500 text-white rounded"
              onClick={handleCreateNew}
            >
              +
            </button>
          </div>

          <TemplateList
            templates={displayTemplates}
            allTemplates={templates} // Pass all templates for finding translations
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onCopy={handleCopyTemplate}
            onTranslate={(template) => {
              // Show available languages to add translations for
              const availableLanguages: ('EN' | 'FR' | 'DE')[] = ['EN', 'FR', 'DE'];
              
              // Find existing translations
              const translations = templates.filter(t => 
                t.baseId === template.baseId && 
                t.id !== template.id
              );
              
              // Get languages that already have translations
              const existingLanguages = [
                template.language || 'EN',
                ...translations.map(t => t.language || 'EN')
              ] as ('EN' | 'FR' | 'DE')[];
              
              // Get languages that need translations
              const missingLanguages = availableLanguages.filter(
                lang => !existingLanguages.includes(lang)
              );
              
              if (missingLanguages.length === 0) {
                alert('This template already has translations in all languages.');
                return;
              }
              
              // Ask user which language to add
              let languageOptions = '';
              missingLanguages.forEach(lang => {
                const langName = lang === 'EN' ? 'English' : lang === 'FR' ? 'French' : 'German';
                languageOptions += `- ${lang} (${langName})\n`;
              });
              
              const selectedLang = prompt(
                `Select a language to add a translation for "${template.name}":\n${languageOptions}`,
                missingLanguages[0]
              ) as 'EN' | 'FR' | 'DE' | null;
              
              if (!selectedLang || !missingLanguages.includes(selectedLang)) {
                return; // Invalid selection or user cancelled
              }
              
              // Create a new translation
              handleCreateTranslation(template, selectedLang);
            }}
          />
        </>
      )}

      {/* Multilingual Tab Content */}
      {activeTab === 'multilingual' && (
        <TemplateLanguageOverview
          templateGroups={templateGroups}
          onSelectTemplate={(templateId) => {
            const template = templates.find(t => t.id === templateId);
            if (template) {
              handleEdit(template);
            }
          }}
          onAddTranslation={(baseId, language) => {
            const template = templates.find(t => t.baseId === baseId);
            if (template) {
              handleCreateTranslation(template, language);
            }
          }}
        />
      )}

      {/* Variables Tab Content */}
      {activeTab === 'variables' && (
        <GlobalVariablesManager 
          variables={globalVariables}
          onVariablesUpdated={loadTemplates}
        />
      )}
    </div>
  );
};

// Render the app
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<Options />);
}