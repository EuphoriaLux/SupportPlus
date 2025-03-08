import { Template, Variable, ParsedTemplate } from '../types';

// Regex to find variables in format {{variableName}}
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Extract variable names from template content
 */
export const extractVariables = (content: string): string[] => {
  const variables: string[] = [];
  
  // Reset regex lastIndex to ensure we start from the beginning
  VARIABLE_REGEX.lastIndex = 0;
  
  let match;
  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    if (match[1]) {
      variables.push(match[1].trim());
    }
  }
  
  // Log extracted variables for debugging
  console.log("Extracted variables from content:", variables);
  
  return [...new Set(variables)]; // Remove duplicates
};

/**
 * Parse a template with provided variable values
 */
export const parseTemplate = (
  template: Template, 
  variableValues: Record<string, string> = {}
): ParsedTemplate => {
  let parsedContent = template.content;
  const missingVariables: string[] = [];
  
  const variableNames = extractVariables(template.content);
  console.log("Variable names to replace:", variableNames);
  console.log("Variable values provided:", variableValues);
  
  variableNames.forEach(varName => {
    const value = variableValues[varName] || 
                 template.variables.find(v => v.name === varName)?.defaultValue || 
                 '';
    
    console.log(`Replacing {{${varName}}} with "${value}"`);
                 
    if (!value) {
      missingVariables.push(varName);
    }
    
    // Use string replace with a global regex to replace all occurrences
    parsedContent = parsedContent.replace(
      new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), 
      value
    );
  });
  
  console.log("Final parsed content:", parsedContent);
  console.log("Missing variables:", missingVariables);
  
  return {
    content: parsedContent,
    missingVariables
  };
};

/**
 * Generate variable objects from variable names in content
 */
export const generateVariableObjects = (content: string): Variable[] => {
  const variableNames = extractVariables(content);
  
  return variableNames.map(name => ({
    name,
    description: `Value for ${name}`,
    defaultValue: ''
  }));
};