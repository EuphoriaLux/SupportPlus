export interface Variable {
  name: string;
  description: string;
  defaultValue?: string;
  type?: 'text' | 'dropdown' | 'textarea';
  options?: string[];
}

export interface Template {
  id: string;
  baseId: string; // All translations of the same template share a baseId
  name: string;
  category: string;
  content: string;
  variables: Variable[];
  language: 'EN' | 'FR' | 'DE'; // Language of the template
  createdAt: number;
  updatedAt: number;
}

export interface ParsedTemplate {
  content: string;
  missingVariables: string[];
}

// Utility type to represent a template group (all languages of the same template)
export interface TemplateGroup {
  baseId: string;
  name: string;
  category: string;
  templates: Record<'EN' | 'FR' | 'DE', Template | null>;
  variables: Variable[];
}