// Background script for our Chrome extension
import { STORAGE_KEY } from './services/storage';
import { Template } from './types';

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set up initial template examples
    const initialTemplates: Template[] = [
      {
        id: crypto.randomUUID(),
        name: 'Welcome Response',
        category: 'General',
        content: 'Hi {{customerName}},\n\nThank you for reaching out to our support team! We\'re happy to help you with your inquiry about {{productName}}.\n\nI\'ll look into this right away and get back to you within {{responseTime}} hours.\n\nBest regards,\n{{agentName}}\n{{teamName}} Support',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'productName', description: 'Product name', defaultValue: 'our product' },
          { name: 'responseTime', description: 'Response time in hours', defaultValue: '24' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        name: 'Technical Issue Response',
        category: 'Technical',
        content: 'Hello {{customerName}},\n\nI understand you\'re experiencing an issue with {{feature}}. I apologize for any inconvenience this has caused.\n\nTo help troubleshoot this issue, could you please provide the following information:\n\n1. What version of {{productName}} are you currently using?\n2. When did you first notice this issue?\n3. {{additionalQuestions}}\n\nOnce I have this information, I\'ll be better equipped to help resolve your issue.\n\nThank you for your patience,\n{{agentName}}\n{{department}} Support Team',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'feature', description: 'Feature with issue', defaultValue: '' },
          { name: 'productName', description: 'Product name', defaultValue: 'our product' },
          { name: 'additionalQuestions', description: 'Any additional questions', defaultValue: 'Have you tried clearing your cache and cookies?' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'department', description: 'Your department', defaultValue: 'Technical' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        name: 'Follow-up Template',
        category: 'General',
        content: 'Hi {{customerName}},\n\nI wanted to follow up on your recent support request regarding {{issueDescription}}.\n\nHas the solution we provided resolved your issue? If you\'re still experiencing problems or have any questions, please don\'t hesitate to let me know.\n\nYour feedback is important to us as we strive to provide the best possible support.\n\nBest regards,\n{{agentName}}\n{{teamName}} Support',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'issueDescription', description: 'Brief description of the issue', defaultValue: '' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // Save initial templates to storage
    chrome.storage.sync.set({ [STORAGE_KEY]: initialTemplates }, () => {
      console.log('Initial templates created');
    });
  }
});

// Listen for context menu clicks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_TEMPLATE_MANAGER') {
    // Open the template manager popup
    chrome.action.openPopup();
  }
  
  return true;
});