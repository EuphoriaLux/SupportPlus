export interface Variable {
  name: string;
  description: string;
  defaultValue?: string;
  type?: 'text' | 'dropdown' | 'textarea';
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: Variable[];
  language?: 'EN' | 'FR' | 'DE'; // Language of the template
  createdAt: number;
  updatedAt: number;
}

export interface ParsedTemplate {
  content: string;
  missingVariables: string[];
}