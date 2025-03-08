import { Template } from '../types';
import { storageService } from '../services/storage';

/**
 * Migrate existing templates to the new structure with baseId
 * Organizes templates with the same name as translations of each other
 */
export const migrateToMultilingualStructure = async (): Promise<void> => {
  try {
    const templates = await storageService.getTemplates();
    let needsMigration = false;
    
    // Step 1: Add baseId to any templates missing it
    const templatesWithBaseId = templates.map(template => {
      if (!template.baseId) {
        needsMigration = true;
        return {
          ...template,
          baseId: template.id
        };
      }
      return template;
    });
    
    if (!needsMigration) {
      // Skip if all templates already have baseId
      console.log('All templates already have baseId, no migration needed');
      return;
    }
    
    // Step 2: Group templates by name to find potential translations
    const templatesByName: Record<string, Template[]> = {};
    
    templatesWithBaseId.forEach(template => {
      if (!templatesByName[template.name]) {
        templatesByName[template.name] = [];
      }
      templatesByName[template.name].push(template);
    });
    
    // Step 3: For each group, set the same baseId for all templates with the same name
    const migratedTemplates: Template[] = [];
    
    Object.values(templatesByName).forEach(group => {
      if (group.length > 1) {
        // Multiple templates with the same name - potential translations
        // Use the oldest template's id as the baseId for all
        const sortedByDate = [...group].sort((a, b) => a.createdAt - b.createdAt);
        const baseTemplate = sortedByDate[0];
        
        // Check for language conflicts (multiple templates with the same language)
        const languageCount: Record<string, number> = {};
        group.forEach(t => {
          const lang = t.language || 'EN';
          languageCount[lang] = (languageCount[lang] || 0) + 1;
        });
        
        // Resolve language conflicts by appending a number to duplicates
        const processedLanguages: Record<string, number> = {};
        
        sortedByDate.forEach(template => {
          const baseId = baseTemplate.id;
          let language = template.language || 'EN';
          
          // If there are multiple templates with this language, add a suffix to all but the first one
          processedLanguages[language] = (processedLanguages[language] || 0) + 1;
          
          if (processedLanguages[language] > 1 && languageCount[language] > 1) {
            // This is a duplicate language - we need to modify the template
            // We'll add a number suffix to the name to distinguish it
            const suffix = ` (${language} ${processedLanguages[language]})`;
            
            migratedTemplates.push({
              ...template,
              baseId,
              name: template.name + suffix
            });
          } else {
            // This is the first template with this language, or the only one
            migratedTemplates.push({
              ...template,
              baseId
            });
          }
        });
      } else {
        // Only one template with this name, just add it to the result
        migratedTemplates.push(group[0]);
      }
    });
    
    // Save the migrated templates
    console.log(`Migrating ${templates.length} templates to new structure`);
    await storageService.saveTemplates(migratedTemplates);
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Check if migration is needed
 */
export const checkMigrationNeeded = async (): Promise<boolean> => {
  const templates = await storageService.getTemplates();
  
  // Check if any template is missing a baseId
  return templates.some(template => !template.baseId);
};