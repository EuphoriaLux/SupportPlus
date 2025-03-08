import { Template, Variable } from '../types';

export const STORAGE_KEY = 'support_templates';
export const GLOBAL_VARIABLES_KEY = 'support_global_variables';

export const storageService = {
  // Get all templates
  getTemplates: (): Promise<Template[]> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(STORAGE_KEY, (result) => {
        resolve(result[STORAGE_KEY] || []);
      });
    });
  },

  // Save templates
  saveTemplates: (templates: Template[]): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEY]: templates }, () => {
        resolve();
      });
    });
  },

  // Add new template
  addTemplate: async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    const templates = await storageService.getTemplates();
    const timestamp = Date.now();
    
    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await storageService.saveTemplates([...templates, newTemplate]);
    return newTemplate;
  },

  // Update existing template
  updateTemplate: async (id: string, updates: Partial<Template>): Promise<Template | null> => {
    const templates = await storageService.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const updatedTemplate = {
      ...templates[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    templates[index] = updatedTemplate;
    await storageService.saveTemplates(templates);
    return updatedTemplate;
  },

  // Delete template
  deleteTemplate: async (id: string): Promise<boolean> => {
    const templates = await storageService.getTemplates();
    const filteredTemplates = templates.filter(t => t.id !== id);
    
    if (filteredTemplates.length === templates.length) return false;
    
    await storageService.saveTemplates(filteredTemplates);
    return true;
  },

  // Get global variables
  getGlobalVariables: (): Promise<Variable[]> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(GLOBAL_VARIABLES_KEY, (result) => {
        resolve(result[GLOBAL_VARIABLES_KEY] || []);
      });
    });
  },

  // Save global variables
  saveGlobalVariables: (variables: Variable[]): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [GLOBAL_VARIABLES_KEY]: variables }, () => {
        resolve();
      });
    });
  },

  // Update a global variable
  updateGlobalVariable: async (name: string, updates: Partial<Variable>): Promise<Variable | null> => {
    const variables = await storageService.getGlobalVariables();
    const index = variables.findIndex(v => v.name === name);
    
    if (index === -1) {
      // If variable doesn't exist, add it
      const newVariable: Variable = {
        name,
        description: updates.description || `Value for ${name}`,
        defaultValue: updates.defaultValue || ''
      };
      
      await storageService.saveGlobalVariables([...variables, newVariable]);
      return newVariable;
    }
    
    // Update existing variable
    const updatedVariable = {
      ...variables[index],
      ...updates
    };
    
    variables[index] = updatedVariable;
    await storageService.saveGlobalVariables(variables);
    return updatedVariable;
  },

  // Export all data (templates and global variables)
  exportData: async (): Promise<{ templates: Template[], globalVariables: Variable[] }> => {
    const [templates, globalVariables] = await Promise.all([
      storageService.getTemplates(),
      storageService.getGlobalVariables()
    ]);
    
    return {
      templates,
      globalVariables
    };
  },

  // Import data (templates and global variables)
  importData: async (data: { templates?: Template[], globalVariables?: Variable[] }): Promise<void> => {
    if (data.templates) {
      await storageService.saveTemplates(data.templates);
    }
    
    if (data.globalVariables) {
      await storageService.saveGlobalVariables(data.globalVariables);
    }
  }
};