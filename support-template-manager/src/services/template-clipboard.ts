import { Template } from '../types';
import { parseTemplate } from '../utils/parser';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Copy a template's content to clipboard with variable replacement
 * 
 * @param template The template to copy
 * @param variableValues Optional values for template variables
 * @returns Promise that resolves when the template is copied
 */
export const copyTemplate = async (
  template: Template,
  variableValues: Record<string, string> = {}
): Promise<void> => {
  // Parse the template with variable values
  const { content } = parseTemplate(template, variableValues);
  
  console.log("Copying to clipboard:", content);
  console.log("Variables used:", variableValues);
  
  // Copy to clipboard and show notification
  return copyToClipboard(content, 'Template copied to clipboard!');
};

/**
 * Copy a template's raw content (with variable placeholders) to clipboard
 * 
 * @param template The template to copy
 * @returns Promise that resolves when the template is copied
 */
export const copyRawTemplate = async (template: Template): Promise<void> => {
  // Copy the raw template content with variables still in place
  return copyToClipboard(
    template.content, 
    'Raw template copied to clipboard (variables not replaced)'
  );
};

/**
 * Copy a template as a JSON object to clipboard
 * This allows sharing templates between users or instances
 * 
 * @param template The template to copy as JSON
 * @returns Promise that resolves when the template JSON is copied
 */
export const copyTemplateAsJson = async (template: Template): Promise<void> => {
  // Create a simplified template object without id and timestamps
  const templateData = {
    name: template.name,
    category: template.category,
    content: template.content,
    variables: template.variables
  };
  
  // Stringify the template
  const jsonString = JSON.stringify(templateData, null, 2);
  
  // Copy to clipboard and show notification
  return copyToClipboard(
    jsonString, 
    'Template JSON copied to clipboard'
  );
};