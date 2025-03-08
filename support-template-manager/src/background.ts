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
        baseId: crypto.randomUUID(), // Add baseId (will be the same as id for first template)
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
        language: 'EN',
        isRichText: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(), // Add baseId (will be the same as id for first template)
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
        language: 'EN',
        isRichText: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(), // Add baseId (will be the same as id for first template)
        name: 'Follow-up Template',
        category: 'General',
        content: 'Hi {{customerName}},\n\nI wanted to follow up on your recent support request regarding {{issueDescription}}.\n\nHas the solution we provided resolved your issue? If you\'re still experiencing problems or have any questions, please don\'t hesitate to let me know.\n\nYour feedback is important to us as we strive to provide the best possible support.\n\nBest regards,\n{{agentName}}\n{{teamName}} Support',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'issueDescription', description: 'Brief description of the issue', defaultValue: '' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' }
        ],
        language: 'EN',
        isRichText: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // Add a rich text example template
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(),
        name: 'Rich Text Example',
        category: 'Examples',
        content: '<p>Hello <strong>{{customerName}}</strong>,</p><p>Thank you for contacting our support team about <em>{{issueDescription}}</em>.</p><ul><li>We have received your request</li><li>A support agent will review it shortly</li><li>You can expect a response within {{responseTime}} hours</li></ul><p>If you have any additional information to share, please reply to this email.</p><p>Best regards,<br>{{agentName}}<br><strong>{{teamName}} Support</strong></p>',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'issueDescription', description: 'Issue description', defaultValue: '' },
          { name: 'responseTime', description: 'Response time in hours', defaultValue: '24' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' }
        ],
        language: 'EN',
        isRichText: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // For each template, set the baseId to be the same as the id initially
    initialTemplates.forEach(template => {
      template.baseId = template.id;
    });

    // Save initial templates to storage
    chrome.storage.sync.set({ [STORAGE_KEY]: initialTemplates }, () => {
      console.log('Initial templates created');
    });
  } else if (details.reason === 'update') {
    // Check if we need to migrate templates to add isRichText property
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const templates = result[STORAGE_KEY] || [];
      const needsMigration = templates.some((t: any) => t.isRichText === undefined);
      
      if (needsMigration) {
        const migratedTemplates = templates.map((t: any) => ({
          ...t,
          isRichText: t.isRichText || false
        }));
        
        chrome.storage.sync.set({ [STORAGE_KEY]: migratedTemplates }, () => {
          console.log('Templates migrated to include isRichText property');
        });
      }
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