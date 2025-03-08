import { useState, useEffect, useCallback } from 'react';
import { Template } from '../types';
import { storageService } from '../services/storage';
import { generateVariableObjects, parseTemplate } from '../utils/parser';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load templates from storage
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await storageService.getTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new template
  const createTemplate = useCallback(async (
    name: string,
    category: string,
    content: string
  ) => {
    try {
      // Auto-detect variables in the content
      const variables = generateVariableObjects(content);
      
      const newTemplate = await storageService.addTemplate({
        name,
        category,
        content,
        variables
      });
      
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
      return null;
    }
  }, []);

  // Update an existing template
  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<Template>
  ) => {
    try {
      // If content is updated, regenerate variables
      if (updates.content) {
        const currentTemplate = templates.find(t => t.id === id);
        if (currentTemplate) {
          // Preserve existing variable descriptions and default values where possible
          const existingVarMap = Object.fromEntries(
            currentTemplate.variables.map(v => [v.name, v])
          );
          
          const newVarNames = generateVariableObjects(updates.content).map(v => v.name);
          
          updates.variables = newVarNames.map(name => 
            existingVarMap[name] || {
              name,
              description: `Value for ${name}`,
              defaultValue: ''
            }
          );
        }
      }
      
      const updated = await storageService.updateTemplate(id, updates);
      
      if (updated) {
        setTemplates(prev => 
          prev.map(t => t.id === id ? updated : t)
        );
      }
      
      return updated;
    } catch (err) {
      setError('Failed to update template');
      console.error(err);
      return null;
    }
  }, [templates]);

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const success = await storageService.deleteTemplate(id);
      
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
      
      return success;
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
      return false;
    }
  }, []);

  // Apply a template with variable values
  const applyTemplate = useCallback((
    template: Template,
    variableValues: Record<string, string> = {}
  ) => {
    return parseTemplate(template, variableValues);
  }, []);

  // Load templates on initial mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate
  };
};