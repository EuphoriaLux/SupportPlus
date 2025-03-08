import React, { useState, useEffect } from 'react';
import { Template, TemplateGroup, Variable } from '../types';

interface ImprovedImportExportModalProps {
  templates: Template[];
  templateGroups: TemplateGroup[];
  globalVariables: Variable[];
  onImport: (data: string) => void;
  onClose: () => void;
}

const ImprovedImportExportModal: React.FC<ImprovedImportExportModalProps> = ({
  templates,
  templateGroups,
  globalVariables,
  onImport,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Prepare export data when component mounts
  useEffect(() => {
    const exportObj = {
      templates,
      globalVariables,
      exportDate: new Date().toISOString()
    };
    
    setExportData(JSON.stringify(exportObj, null, 2));
  }, [templates, globalVariables]);

  // Helper function to get language display name
  const getLanguageName = (code: 'EN' | 'FR' | 'DE' | undefined): string => {
    if (!code) return 'English';
    return code === 'EN' ? 'English' : code === 'FR' ? 'French' : 'German';
  };
  
  // Helper function to get language color class
  const getLanguageClass = (code: 'EN' | 'FR' | 'DE' | undefined): string => {
    if (!code) return 'bg-green-100 text-green-800';
    return code === 'EN' 
      ? 'bg-green-100 text-green-800' 
      : code === 'FR' 
        ? 'bg-purple-100 text-purple-800' 
        : 'bg-orange-100 text-orange-800';
  };

  // Handle copying export data to clipboard
  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportData);
    alert('Exported data copied to clipboard!');
  };

  // Handle importing data
  const handleImport = () => {
    onImport(importData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import/Export Templates</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('export')}
            >
              Export Templates
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('import')}
            >
              Import Templates
            </button>
          </nav>
        </div>

        {/* Export Tab Content */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Template Overview</h3>
                <div className="border rounded max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {templateGroups.map((group) => (
                        <tr 
                          key={group.baseId} 
                          onClick={() => setSelectedGroup(selectedGroup === group.baseId ? null : group.baseId)}
                          className={`cursor-pointer hover:bg-gray-50 ${selectedGroup === group.baseId ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{group.name}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {group.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {(['EN', 'FR', 'DE'] as const).map(lang => {
                                const hasLang = group.templates[lang] !== null;
                                if (!hasLang) return null;
                                
                                return (
                                  <span 
                                    key={lang}
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLanguageClass(lang)}`}
                                  >
                                    {getLanguageName(lang)}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedGroup && (
                  <div className="mt-4 border rounded p-4">
                    <h4 className="font-medium mb-2">Template Details</h4>
                    {templateGroups.find(g => g.baseId === selectedGroup) && (
                      <div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="text-sm text-gray-600">Name:</div>
                          <div className="text-sm font-medium">{templateGroups.find(g => g.baseId === selectedGroup)?.name}</div>
                          
                          <div className="text-sm text-gray-600">Category:</div>
                          <div className="text-sm font-medium">{templateGroups.find(g => g.baseId === selectedGroup)?.category}</div>
                        </div>

                        <div className="text-sm text-gray-600 mb-1">Available Languages:</div>
                        <div className="space-y-2">
                          {(['EN', 'FR', 'DE'] as const).map(lang => {
                            const template = templateGroups.find(g => g.baseId === selectedGroup)?.templates[lang];
                            if (!template) return null;
                            
                            return (
                              <div key={lang} className="border-l-4 pl-2 py-1" style={{ borderColor: lang === 'EN' ? '#10B981' : lang === 'FR' ? '#8B5CF6' : '#F59E0B' }}>
                                <div className="flex items-center mb-1">
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getLanguageClass(lang)}`}>
                                    {getLanguageName(lang)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-700 line-clamp-3">
                                  {template.content.substring(0, 200)}
                                  {template.content.length > 200 ? '...' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Export JSON</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Copy this JSON data to save your templates or share with others.
                </p>
                <textarea
                  className="w-full px-3 py-2 border rounded font-mono text-sm h-96"
                  value={exportData}
                  readOnly
                />
                <div className="mt-2">
                  <button 
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleCopyExport}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Export Summary</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded shadow">
                    <div className="text-sm text-gray-500">Total Templates</div>
                    <div className="text-2xl font-bold">{templates.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="text-sm text-gray-500">Template Groups</div>
                    <div className="text-2xl font-bold">{templateGroups.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="text-sm text-gray-500">Global Variables</div>
                    <div className="text-2xl font-bold">{globalVariables.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <div className="text-sm text-gray-500">Languages</div>
                    <div className="text-2xl font-bold flex gap-1">
                      <span className="text-green-600">EN</span>
                      <span className="text-purple-600">FR</span>
                      <span className="text-orange-600">DE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab Content */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Import Templates</h3>
              <p className="text-sm text-gray-600 mb-2">
                Paste previously exported template JSON data here.
              </p>
              <textarea
                className="w-full px-3 py-2 border rounded font-mono h-96"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste template export data here..."
              />
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleImport}
                  disabled={!importData}
                >
                  Import Templates
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
              <h4 className="text-yellow-800 font-medium mb-2">Import Instructions</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>The imported data will be added to your existing templates.</li>
                <li>If a template with the same name exists, you'll have both versions.</li>
                <li>Make sure the JSON format is correct (usually copied from the Export tab).</li>
                <li>Templates should include name, category, and content fields at minimum.</li>
                <li>After import, you may need to refresh your browser to see all changes.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button 
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedImportExportModal;