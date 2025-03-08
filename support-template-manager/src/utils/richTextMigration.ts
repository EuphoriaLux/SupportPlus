import { Template } from '../types';
import { storageService } from '../services/storage';

/**
 * Converts plain text to HTML by wrapping lines in paragraph tags
 */
export const plainTextToHtml = (text: string): string => {
  if (!text) return '<p></p>'; // Return empty paragraph for empty text
  
  // Check if the text already contains HTML
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text; // Already contains HTML tags, return as is
  }
  
  // Convert newlines to paragraphs
  return text
    .split('\n')
    .filter(line => line.trim() !== '') // Remove empty lines
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('') || '<p></p>'; // Ensure there's at least one paragraph
};

/**
 * Escape HTML special characters to prevent XSS when converting to HTML
 */
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Migrate all templates to rich text format
 */
export const migrateTemplatesToRichText = async (): Promise<{
  migrated: number;
  total: number;
}> => {
  try {
    // Get all templates
    const templates = await storageService.getTemplates();
    let migratedCount = 0;
    
    // Convert non-rich text templates to rich text
    const updatedTemplates = templates.map(template => {
      if (template.isRichText !== true) {
        migratedCount++;
        
        return {
          ...template,
          content: plainTextToHtml(template.content),
          isRichText: true
        };
      }
      return template;
    });
    
    // Save updated templates if any were migrated
    if (migratedCount > 0) {
      await storageService.saveTemplates(updatedTemplates);
    }
    
    return {
      migrated: migratedCount,
      total: templates.length
    };
  } catch (error) {
    console.error('Error migrating templates to rich text:', error);
    throw error;
  }
};

/**
 * Check if any templates need migration to rich text
 */
export const checkRichTextMigrationNeeded = async (): Promise<boolean> => {
  try {
    const templates = await storageService.getTemplates();
    return templates.some(template => template.isRichText !== true);
  } catch (error) {
    console.error('Error checking migration status:', error);
    throw error;
  }
};