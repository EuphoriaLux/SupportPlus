import { useState, useEffect } from 'react';
import { Template, Variable } from '../types';
import { storageService } from '../services/storage';
import { generateVariableObjects, extractVariables, parseTemplate } from '../utils/parser';
import { copyToClipboard } from '../utils/clipboard';

export const useTemplateManager = () => {
  // State variables
  const [templates, setTemplates] = useState<Template[]>([]);
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current editing state
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit' | null>(null);
  
  // Template form fields
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Variable[]>([]);
  const [templateLanguage, setTemplateLanguage] = useState<'EN' | 'FR' | 'DE'>('EN');
  
  // For importing/exporting
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  // For variable handling
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, Record<string, string>>>({});
  const [templateToCopy, setTemplateToCopy] = useState<Template | null>(null);

  // Load templates and global variables from storage
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Get templates and existing global variables
      const [templates, existingGlobalVars] = await Promise.all([
        storageService.getTemplates(),
        storageService.getGlobalVariables()
      ]);
      
      setTemplates(templates);

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

  // Handle starting to create a new template
  const handleCreateNew = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setTemplateCategory('General');
    setTemplateContent('');
    setTemplateVariables([]);
    setTemplateLanguage('EN');
    setEditMode('create');
  };

  // Handle starting to edit a template
  const handleEdit = (template: Template) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setTemplateCategory(template.category);
    setTemplateContent(template.content);
    setTemplateVariables([...template.variables]);
    setTemplateLanguage(template.language || 'EN');
    setEditMode('edit');
  };

  // Handle saving a template (create or update)
  const handleSaveTemplate = async () => {
    if (!templateName || !templateCategory || !templateContent) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editMode === 'create') {
        // Create new template
        await storageService.addTemplate({
          name: templateName,
          category: templateCategory,
          content: templateContent,
          variables: templateVariables,
          language: templateLanguage
        });
      } else if (editMode === 'edit' && currentTemplate) {
        // Update existing template
        await storageService.updateTemplate(currentTemplate.id, {
          name: templateName,
          category: templateCategory,
          content: templateContent,
          variables: templateVariables,
          language: templateLanguage
        });
      }

      // Reload templates and reset form
      await loadTemplates();
      setEditMode(null);
      setCurrentTemplate(null);
    } catch (err) {
      setError('Failed to save template');
      console.error(err);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await storageService.deleteTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    }
  };

  // Handle updating a variable's properties
  const handleVariableUpdate = (
    index: number,
    field: 'description' | 'defaultValue',
    value: string
  ) => {
    const updatedVars = [...templateVariables];
    updatedVars[index] = {
      ...updatedVars[index],
      [field]: value
    };
    setTemplateVariables(updatedVars);
  };

  // Handle updating a variable's type
  const handleVariableTypeUpdate = (index: number, type: 'text' | 'dropdown' | 'textarea') => {
    const updatedVars = [...templateVariables];
    updatedVars[index] = {
      ...updatedVars[index],
      type
    };
    
    // Initialize options array if switching to dropdown
    if (type === 'dropdown' && !updatedVars[index].options) {
      updatedVars[index].options = [updatedVars[index].defaultValue || ''];
    }
    
    setTemplateVariables(updatedVars);
  };

  // Handle updating a variable's options (for dropdowns)
  const handleVariableOptionsUpdate = (index: number, options: string[]) => {
    const updatedVars = [...templateVariables];
    updatedVars[index] = {
      ...updatedVars[index],
      options
    };
    setTemplateVariables(updatedVars);
  };

  // Handle adding an option to a dropdown variable
  const handleAddVariableOption = (index: number) => {
    const updatedVars = [...templateVariables];
    updatedVars[index].options = [...(updatedVars[index].options || []), ''];
    setTemplateVariables(updatedVars);
  };

  // Handle removing an option from a dropdown variable
  const handleRemoveVariableOption = (varIndex: number, optionIndex: number) => {
    const updatedVars = [...templateVariables];
    const options = [...(updatedVars[varIndex].options || [])];
    options.splice(optionIndex, 1);
    updatedVars[varIndex].options = options;
    setTemplateVariables(updatedVars);
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
  
  // Handle copying a template with variables
  const handleCopyTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if template has variables that need filling
    const varsWithNoDefault = template.variables.filter(v => !v.defaultValue);
    
    if (varsWithNoDefault.length > 0) {
      // Show variable modal
      setTemplateToCopy(template);
      setShowVariableModal(true);
    } else {
      // All variables have defaults, copy directly
      const templateVars: Record<string, string> = {};
      template.variables.forEach(v => {
        if (v.defaultValue) {
          templateVars[v.name] = v.defaultValue;
        }
      });
      
      const { content } = parseTemplate(template, templateVars);
      copyToClipboard(content, 'Template copied to clipboard!');
    }
  };
  
  // Handle when variable values are submitted
  const handleVariableSubmit = (values: Record<string, string>) => {
    if (!templateToCopy) return;
    
    // Update stored variable values
    setVariableValues(prev => ({
      ...prev,
      [templateToCopy.id]: values
    }));
    
    // Copy template with filled variables
    const { content } = parseTemplate(templateToCopy, values);
    copyToClipboard(content, 'Template copied to clipboard!');
    
    // Reset state
    setShowVariableModal(false);
    setTemplateToCopy(null);
  };

  // Effect to load templates on initial mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Effect to update template variables when content changes
  useEffect(() => {
    if (templateContent) {
      const vars = generateVariableObjects(templateContent);
      
      // Preserve existing variable values if possible
      if (currentTemplate) {
        const existingVarMap = new Map(
          currentTemplate.variables.map(v => [v.name, v])
        );
        
        vars.forEach((v, i) => {
          const existing = existingVarMap.get(v.name);
          if (existing) {
            vars[i] = {
              ...v,
              description: existing.description,
              defaultValue: existing.defaultValue,
              type: existing.type,
              options: existing.options
            };
          }
        });
      }
      
      setTemplateVariables(vars);
    } else {
      setTemplateVariables([]);
    }
  }, [templateContent, currentTemplate]);

  // Cancel editing
  const handleCancelEdit = () => {
    setEditMode(null);
    setCurrentTemplate(null);
  };
  
  // Cancel import/export
  const handleCancelImportExport = () => {
    setShowImportExport(false);
    setExportData('');
    setImportData('');
  };
  
  // Cancel variable modal
  const handleCancelVariableModal = () => {
    setShowVariableModal(false);
    setTemplateToCopy(null);
  };
  
  // Handle import data change
  const handleImportDataChange = (value: string) => {
    setImportData(value);
  };

  return {
    // State
    templates,
    globalVariables,
    loading,
    error,
    currentTemplate,
    editMode,
    templateName,
    templateCategory,
    templateContent,
    templateVariables,
    templateLanguage,
    exportData,
    importData,
    showImportExport,
    showVariableModal,
    templateToCopy,
    
    // Form actions
    setTemplateName,
    setTemplateCategory,
    setTemplateContent,
    setTemplateLanguage,
    handleVariableUpdate,
    handleVariableTypeUpdate,
    handleVariableOptionsUpdate,
    handleAddVariableOption,
    handleRemoveVariableOption,
    
    // Template actions
    handleCreateNew,
    handleEdit,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleCancelEdit,
    
    // Import/Export
    handleExport,
    handleImport,
    handleImportDataChange,
    handleCancelImportExport,
    
    // Variable handling
    handleCopyTemplate,
    handleVariableSubmit,
    handleCancelVariableModal,
    
    // Data loading
    loadTemplates
  };
};

export default useTemplateManager;