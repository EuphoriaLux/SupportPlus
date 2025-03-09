import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Template, TemplateGroup } from './types';
import { storageService } from './services/storage';
import './assets/styles.css';

// Main Popup Component
const Popup = () => {
  // State for templates and storage info
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  }>({ used: 0, total: 102400, percentage: 0 }); // Default total is 100KB for sync storage
  
  // Load templates and storage info on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load templates and template groups
        const [templates, templateGroups] = await Promise.all([
          storageService.getTemplates(),
          storageService.getTemplateGroups(),
        ]);
        
        setTemplates(templates);
        setTemplateGroups(templateGroups);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(templates.map(t => t.category))];
        setCategories(uniqueCategories);
        
        // Get storage usage
        chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
          const total = 102400; // 100KB is the default limit for chrome.storage.sync
          const percentage = (bytesInUse / total) * 100;
          setStorageInfo({
            used: bytesInUse,
            total,
            percentage
          });
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Get stats for different languages
  const getLanguageStats = () => {
    const stats = {
      EN: 0,
      FR: 0,
      DE: 0,
      total: templates.length
    };
    
    templates.forEach(template => {
      const lang = template.language || 'EN';
      if (lang === 'EN') stats.EN++;
      else if (lang === 'FR') stats.FR++;
      else if (lang === 'DE') stats.DE++;
    });
    
    return stats;
  };
  
  const languageStats = getLanguageStats();
  
  // Open options page
  const openOptionsPage = (params = {}) => {
    chrome.runtime.openOptionsPage(() => {
      // If params are provided, update the URL
      if (Object.keys(params).length > 0) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab && tab.id) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              searchParams.append(key, value as string);
            });
            
            chrome.tabs.update(tab.id, {
              url: chrome.runtime.getURL(`options.html?${searchParams.toString()}`)
            });
          }
        });
      }
    });
  };
  
  // Open options page with create new template form
  const openCreateNew = () => {
    openOptionsPage({ action: 'create' });
  };
  
  // Open options page filtered by category
  const openCategoryFilter = (category: string) => {
    openOptionsPage({ category });
  };
  
  // Format bytes to a readable format
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Format date to a readable format
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-white">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Support Template Manager</h1>
        <div className="flex space-x-2">
          <button
            onClick={openCreateNew}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            title="Create a new template"
          >
            + New
          </button>
          <button
            onClick={() => openOptionsPage()}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
          >
            Options
          </button>
        </div>
      </header>
      
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Templates Overview</h2>
        <div className="bg-gray-50 rounded p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Total Templates</p>
              <p className="text-xl font-bold">{languageStats.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Template Groups</p>
              <p className="text-xl font-bold">{templateGroups.length}</p>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-gray-500 mb-1">Languages</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                EN: {languageStats.EN}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                FR: {languageStats.FR}
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                DE: {languageStats.DE}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Storage Usage</h2>
        <div className="bg-gray-50 rounded p-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-500">Used: {formatBytes(storageInfo.used)}</span>
            <span className="text-gray-500">Total: {formatBytes(storageInfo.total)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                storageInfo.percentage > 80 ? 'bg-red-500' : 
                storageInfo.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${storageInfo.percentage}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500 text-right">
            {storageInfo.percentage.toFixed(1)}% used
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-gray-700">Categories</h2>
          <span className="text-xs text-gray-500">(Click to filter)</span>
        </div>
        <div className="bg-gray-50 rounded p-3 flex flex-wrap gap-1">
          {categories.length > 0 ? (
            categories.map(category => (
              <button
                key={category}
                onClick={() => openCategoryFilter(category)}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
              >
                {category}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No categories yet</p>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Recent Templates</h2>
        <div className="bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">
          {templates.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {templates
                .sort((a, b) => b.updatedAt - a.updatedAt) // Sort by most recent
                .slice(0, 3) // Show only the 3 most recent
                .map(template => (
                  <li 
                    key={template.id} 
                    className="py-2 px-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => openOptionsPage({ edit: template.id })}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium truncate w-48">{template.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(template.updatedAt)}</p>
                      </div>
                      <span 
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          template.language === 'EN' ? 'bg-green-100 text-green-800' :
                          template.language === 'FR' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {template.language || 'EN'}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No templates yet</p>
          )}
        </div>
      </div>
      
      <footer className="pt-2 border-t flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Templates: {templates.length}
        </span>
        <button
          onClick={() => openOptionsPage()}
          className="text-blue-500 text-xs hover:underline"
        >
          Manage All Templates
        </button>
      </footer>
    </div>
  );
};

// Render the popup
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
} else {
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  ReactDOM.createRoot(newRoot).render(<Popup />);
}