import React, { useState } from 'react';
import { Variable } from '../types';
import { storageService } from '../services/storage';

interface GlobalVariablesManagerProps {
  variables: Variable[];
  onVariablesUpdated: () => void;
}

const GlobalVariablesManager: React.FC<GlobalVariablesManagerProps> = ({
  variables,
  onVariablesUpdated
}) => {
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ description: string; defaultValue: string }>({
    description: '',
    defaultValue: ''
  });

  const handleEdit = (variable: Variable) => {
    setEditingVar(variable.name);
    setEditValues({
      description: variable.description,
      defaultValue: variable.defaultValue || ''
    });
  };

  const handleSave = async () => {
    if (!editingVar) return;

    await storageService.updateGlobalVariable(editingVar, {
      description: editValues.description,
      defaultValue: editValues.defaultValue
    });

    setEditingVar(null);
    onVariablesUpdated();
  };

  const handleCancel = () => {
    setEditingVar(null);
  };

  const handleChange = (field: 'description' | 'defaultValue', value: string) => {
    setEditValues({
      ...editValues,
      [field]: value
    });
  };

  // Group variables by prefix (e.g., customer, agent, etc.)
  const groupedVariables = variables.reduce((groups, variable) => {
    // Try to extract a group from the variable name
    let group = 'Other';
    
    // Check for common prefixes like 'customer', 'agent', etc.
    const prefixMatch = variable.name.match(/^([a-zA-Z]+)[A-Z]/);
    if (prefixMatch && prefixMatch[1]) {
      group = prefixMatch[1].charAt(0).toUpperCase() + prefixMatch[1].slice(1);
    }
    
    if (!groups[group]) {
      groups[group] = [];
    }
    
    groups[group].push(variable);
    return groups;
  }, {} as Record<string, Variable[]>);

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-xl font-bold mb-4">Global Variables Management</h2>
      <p className="text-sm text-gray-600 mb-4">
        Configure the behavior of variables across all templates. These settings will be used whenever a variable is not specifically configured in a template.
      </p>

      {Object.entries(groupedVariables).map(([group, groupVars]) => (
        <div key={group} className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{group} Variables</h3>
          <div className="bg-white border rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variable Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default Value
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupVars.map(variable => (
                  <tr key={variable.name}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-mono">{variable.name}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {editingVar === variable.name ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                        />
                      ) : (
                        variable.description
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {editingVar === variable.name ? (
                        <input
                          type="text"
                          className="w-full px-2 py-1 border rounded"
                          value={editValues.defaultValue}
                          onChange={(e) => handleChange('defaultValue', e.target.value)}
                          placeholder="Default value (optional)"
                        />
                      ) : (
                        <span className={variable.defaultValue ? '' : 'text-gray-400 italic'}>
                          {variable.defaultValue || 'No default value'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      {editingVar === variable.name ? (
                        <div className="flex space-x-2">
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={handleSave}
                          >
                            Save
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEdit(variable)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalVariablesManager;