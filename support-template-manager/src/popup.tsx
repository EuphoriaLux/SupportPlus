import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { useTemplates } from './hooks/useTemplates';
import TemplateForm from './components/TemplateForm';
import VariableModal from './components/VariableModal';
import { copyTemplate } from './services/template-clipboard';
import './assets/styles.css';

// Main Popup Component
const Popup = () => {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate
  } = useTemplates();

  const [activeView, setActiveView] = useState<'list' | 'edit' | 'create'>('list');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, Record<string, string>>>({});
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'apply' | 'copy'>('apply');

  // Filter templates by search term
  const filteredTemplates = templates.filter(template => {
    const term = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(term) ||
      template.category.toLowerCase().includes(term) ||
      template.content.toLowerCase().includes(term)
    );
  });

  // Group templates by category
  const templatesByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  // Handle creating a new template
  const handleCreateTemplate = (data: {
    name: string;
    category: string;
    content: string;
  }) => {
    createTemplate(data.name, data.category, data.content);
    setActiveView('list');
  };

  // Handle updating an existing template
  const handleUpdateTemplate = (data: {
    name: string;
    category: string;
    content: string;
  }) => {
    if (activeTemplate) {
      updateTemplate(activeTemplate, {
        name: data.name,
        category: data.category,
        content: data.content
      });
      setActiveTemplate(null);
      setActiveView('list');
    }
  };

  // Handle applying template to the active email composer
  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Get variable values for this template
    const templateVars = variableValues[templateId] || {};
    
    // Parse the template with variable values
    const { content, missingVariables } = applyTemplate(template, templateVars);
    
    if (missingVariables.length > 0) {
      // Show modal for filling in missing variables
      setActiveTemplate(templateId);
      setCurrentAction('apply');
      // Pre-populate with existing values
      setVariableValues(prev => ({
        ...prev,
        [templateId]: { ...templateVars }
      }));
      setShowVariableModal(true);
      return;
    }
    
    // Insert the parsed template into the active email composer
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'INSERT_TEMPLATE',
          content
        });
      }
    });
  };

  // Handle copying a template to clipboard
  const handleCopyTemplate = async (templateId: string, e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) {
      e.stopPropagation();
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Debug: Log template content and variables
    console.log("Template content:", template.content);
    console.log("Template variables:", template.variables);

    // Get variable values for this template
    const templateVars = variableValues[templateId] || {};
    console.log("Current variable values:", templateVars);
    
    try {
      // Force showing the variable modal by checking if there are any variables at all
      const variableNames = template.variables.map(v => v.name);
      
      if (variableNames.length > 0) {
        console.log("Template has variables:", variableNames);
        // Show modal for filling in variables
        setActiveTemplate(templateId);
        setCurrentAction('copy');
        // Pre-populate with existing values
        setVariableValues(prev => ({
          ...prev,
          [templateId]: { ...templateVars }
        }));
        setShowVariableModal(true);
      } else {
        // No variables at all, copy directly
        console.log("Template has no variables, copying directly");
        await copyTemplate(template, templateVars);
      }
    } catch (error) {
      console.error('Failed to copy template to clipboard:', error);
    }
  };

  // Handle variable values being applied
  const handleVariableApply = (values: Record<string, string>) => {
    if (!activeTemplate) return;
    
    console.log("Variable values submitted:", values);
    console.log("Current action:", currentAction);
    
    // Update variable values for this template
    setVariableValues(prev => ({
      ...prev,
      [activeTemplate]: values
    }));
    
    // Get the template
    const template = templates.find(t => t.id === activeTemplate);
    if (!template) return;
    
    if (currentAction === 'copy') {
      // Copy to clipboard with variables
      console.log("Copying with variables after modal:", values);
      copyTemplate(template, values).catch(err => {
        console.error('Failed to copy template:', err);
      });
    } else {
      // Insert into email composer
      const { content } = applyTemplate(template, values);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'INSERT_TEMPLATE',
            content
          });
        }
      });
    }
    
    // Reset UI state
    setShowVariableModal(false);
    setActiveTemplate(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-4 w-80">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 w-80">
        <div className="text-red-500">Error: {error}</div>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render variable modal if active
  if (showVariableModal && activeTemplate) {
    const template = templates.find(t => t.id === activeTemplate);
    if (!template) return null;
    
    return (
      <VariableModal
        template={template}
        initialValues={variableValues[activeTemplate] || {}}
        title={currentAction === 'copy' ? 'Fill Variables for Copying' : 'Fill Variables'}
        buttonText={currentAction === 'copy' ? 'Copy to Clipboard' : 'Apply Template'}
        onApply={handleVariableApply}
        onCancel={() => {
          setShowVariableModal(false);
          setActiveTemplate(null);
        }}
      />
    );
  }

  // Render template create/edit view
  if (activeView === 'create' || activeView === 'edit') {
    const template = activeTemplate 
      ? templates.find(t => t.id === activeTemplate)
      : undefined;
    
    return (
      <div className="p-4 w-96">
        <h1 className="text-xl font-bold mb-4">
          {activeView === 'create' ? 'Create Template' : 'Edit Template'}
        </h1>
        
        <TemplateForm
          template={template}
          onSave={activeView === 'create' ? handleCreateTemplate : handleUpdateTemplate}
          onCancel={() => {
            setActiveView('list');
            setActiveTemplate(null);
          }}
        />
      </div>
    );
  }

  // Render template list view
  return (
    <div className="p-4 w-96 max-h-[600px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Support Templates</h1>
        <button
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Advanced Settings
        </button>
      </div>
      
      {/* Search and Add buttons */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          className="flex-1 px-3 py-2 border rounded"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          className="px-3 py-2 bg-green-500 text-white rounded"
          onClick={() => setActiveView('create')}
        >
          +
        </button>
      </div>
      
      {/* Template categories */}
      {Object.keys(templatesByCategory).length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No templates found. Click + to create your first template.
        </div>
      ) : (
        Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-4">
            <h2 className="font-bold text-gray-700 mb-2">{category}</h2>
            <div className="space-y-2">
              {categoryTemplates.map(template => (
                <div 
                  key={template.id}
                  className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{template.name}</div>
                    <div className="flex gap-1">
                      <button
                        className="p-1 text-green-500 hover:text-green-700"
                        onClick={(e) => handleCopyTemplate(template.id, e)}
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                      <button
                        className="p-1 text-blue-500 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTemplate(template.id);
                          setActiveView('edit');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this template?')) {
                            deleteTemplate(template.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {template.content.substring(0, 100)}
                    {template.content.length > 100 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Render the app
const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<Popup />);