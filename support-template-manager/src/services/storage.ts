import { Template, Variable, TemplateGroup } from '../types';

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

  // Get template groups (templates organized by baseId)
  getTemplateGroups: async (): Promise<TemplateGroup[]> => {
    const templates = await storageService.getTemplates();
    const groupsMap: Record<string, TemplateGroup> = {};

    // Group templates by baseId
    templates.forEach(template => {
      const baseId = template.baseId || template.id;
      
      if (!groupsMap[baseId]) {
        groupsMap[baseId] = {
          baseId,
          name: template.name,
          category: template.category,
          templates: {
            'EN': null,
            'FR': null,
            'DE': null
          },
          variables: template.variables
        };
      }
      
      // Add the template to its language slot
      const language = template.language || 'EN';
      groupsMap[baseId].templates[language] = template;
    });

    return Object.values(groupsMap);
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
  addTemplate: async (template: Omit<Template, 'id' | 'baseId' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    const templates = await storageService.getTemplates();
    const timestamp = Date.now();
    const newId = crypto.randomUUID();
    
    // Check if this is a new template or a translation
    // We'll determine if it's a translation by checking if a template with the same name already exists
    const existingTemplate = templates.find(t => t.name === template.name);
    const baseId = existingTemplate ? existingTemplate.baseId : newId;
    
    // Check if a template with this language already exists
    const duplicateLanguage = templates.find(t => 
      t.baseId === baseId && 
      t.language === template.language
    );
    
    if (duplicateLanguage) {
      throw new Error(`A template in ${template.language} already exists for "${template.name}"`);
    }
    
    const newTemplate: Template = {
      ...template,
      id: newId,
      baseId,
      isRichText: true, // Always true
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await storageService.saveTemplates([...templates, newTemplate]);
    return newTemplate;
  },

  // Add a translation to an existing template
  addTranslation: async (
    baseTemplate: Template, 
    language: 'EN' | 'FR' | 'DE', 
    content: string,
    isRichText?: boolean // Keep parameter for backward compatibility
  ): Promise<Template> => {
    const templates = await storageService.getTemplates();
    const timestamp = Date.now();
    
    // Check if a translation in this language already exists
    const existingTranslation = templates.find(t => 
      t.baseId === baseTemplate.baseId && 
      t.language === language
    );
    
    if (existingTranslation) {
      throw new Error(`A translation in ${language} already exists for "${baseTemplate.name}"`);
    }
    
    const newTranslation: Template = {
      id: crypto.randomUUID(),
      baseId: baseTemplate.baseId,
      name: baseTemplate.name,
      category: baseTemplate.category,
      content,
      variables: baseTemplate.variables,
      language,
      isRichText: true, // Always true
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await storageService.saveTemplates([...templates, newTranslation]);
    return newTranslation;
  },

  // Update existing template
  updateTemplate: async (id: string, updates: Partial<Template>): Promise<Template | null> => {
    const templates = await storageService.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const templateToUpdate = templates[index];
    
    // If changing the language, check if there's already a template in that language
    if (updates.language && updates.language !== templateToUpdate.language) {
      const duplicateLanguage = templates.find(t => 
        t.baseId === templateToUpdate.baseId && 
        t.language === updates.language &&
        t.id !== id
      );
      
      if (duplicateLanguage) {
        throw new Error(`A template in ${updates.language} already exists for "${templateToUpdate.name}"`);
      }
    }
    
    // Override isRichText to always be true
    if (updates.isRichText !== undefined) {
      updates.isRichText = true;
    }
    
    const updatedTemplate = {
      ...templateToUpdate,
      ...updates,
      isRichText: true, // Ensure it's always true
      updatedAt: Date.now()
    };
    
    templates[index] = updatedTemplate;
    
    // If name or category is updated, update all templates with the same baseId
    if (updates.name || updates.category) {
      for (let i = 0; i < templates.length; i++) {
        if (templates[i].baseId === templateToUpdate.baseId && i !== index) {
          templates[i] = {
            ...templates[i],
            name: updates.name || templates[i].name,
            category: updates.category || templates[i].category,
            updatedAt: Date.now()
          };
        }
      }
    }
    
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
  
  // Delete all templates with the same baseId
  deleteTemplateGroup: async (baseId: string): Promise<boolean> => {
    const templates = await storageService.getTemplates();
    const filteredTemplates = templates.filter(t => t.baseId !== baseId);
    
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
      // Make sure all templates have a baseId and isRichText property (for backwards compatibility)
      const templatesWithUpdates = data.templates.map(template => ({
        ...template,
        baseId: template.baseId || template.id,
        isRichText: true // Always true
      }));
      
      await storageService.saveTemplates(templatesWithUpdates);
    }
    
    if (data.globalVariables) {
      await storageService.saveGlobalVariables(data.globalVariables);
    }
  },
  
  // Migrate existing templates to the new structure with baseId and isRichText
  migrateTemplates: async (): Promise<void> => {
    const templates = await storageService.getTemplates();
    let needsMigration = false;
    
    // Check if any template is missing a baseId or isRichText property
    const migratedTemplates = templates.map(template => {
      const updates: Partial<Template> = {};
      
      if (!template.baseId) {
        updates.baseId = template.id;
        needsMigration = true;
      }
      
      if (template.isRichText !== true) {
        updates.isRichText = true;
        needsMigration = true;
      }
      
      if (Object.keys(updates).length > 0) {
        return { ...template, ...updates };
      }
      
      return template;
    });
    
    if (needsMigration) {
      await storageService.saveTemplates(migratedTemplates);
    }
  },
  
  // Migrate templates to rich text format
  migrateToRichText: async (): Promise<void> => {
    const templates = await storageService.getTemplates();
    let needsMigration = false;
    
    // Convert all templates to rich text
    const migratedTemplates = templates.map(template => {
      if (template.isRichText !== true) {
        needsMigration = true;
        
        // Convert plain text content to HTML
        const htmlContent = template.content
          .split('\n')
          .filter(line => line.trim() !== '') // Skip empty lines
          .map(line => `<p>${line}</p>`)
          .join('');
        
        return {
          ...template,
          isRichText: true,
          content: htmlContent || '<p></p>' // Ensure there's at least an empty paragraph
        };
      }
      
      return template;
    });
    
    if (needsMigration) {
      await storageService.saveTemplates(migratedTemplates);
      console.log('Migrated all templates to rich text format');
    }
  }
};

export default storageService;