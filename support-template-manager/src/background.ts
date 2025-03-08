// Background script for our Chrome extension
import { STORAGE_KEY } from './services/storage';
import { Template } from './types';

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set up initial template examples - all with isRichText=true
    const initialTemplates: Template[] = [
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(),
        name: 'Welcome Response',
        category: 'General',
        content: '<p>Hi {{customerName}},</p><p>Thank you for reaching out to our support team! We\'re happy to help you with your inquiry about {{productName}}.</p><p>I\'ll look into this right away and get back to you within {{responseTime}} hours.</p><p>Best regards,<br>{{agentName}}<br>{{teamName}} Support</p>',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'productName', description: 'Product name', defaultValue: 'our product' },
          { name: 'responseTime', description: 'Response time in hours', defaultValue: '24' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' },
        ],
        language: 'EN',
        isRichText: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(),
        name: 'Technical Issue Response',
        category: 'Technical',
        content: '<p>Hello {{customerName}},</p><p>I understand you\'re experiencing an issue with {{feature}}. I apologize for any inconvenience this has caused.</p><p>To help troubleshoot this issue, could you please provide the following information:</p><ol><li>What version of {{productName}} are you currently using?</li><li>When did you first notice this issue?</li><li>{{additionalQuestions}}</li></ol><p>Once I have this information, I\'ll be better equipped to help resolve your issue.</p><p>Thank you for your patience,<br>{{agentName}}<br>{{department}} Support Team</p>',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'feature', description: 'Feature with issue', defaultValue: '' },
          { name: 'productName', description: 'Product name', defaultValue: 'our product' },
          { name: 'additionalQuestions', description: 'Any additional questions', defaultValue: 'Have you tried clearing your cache and cookies?' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'department', description: 'Your department', defaultValue: 'Technical' }
        ],
        language: 'EN',
        isRichText: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        baseId: crypto.randomUUID(),
        name: 'Follow-up Template',
        category: 'General',
        content: '<p>Hi {{customerName}},</p><p>I wanted to follow up on your recent support request regarding {{issueDescription}}.</p><p>Has the solution we provided resolved your issue? If you\'re still experiencing problems or have any questions, please don\'t hesitate to let me know.</p><p>Your feedback is important to us as we strive to provide the best possible support.</p><p>Best regards,<br>{{agentName}}<br>{{teamName}} Support</p>',
        variables: [
          { name: 'customerName', description: 'Customer\'s name', defaultValue: '' },
          { name: 'issueDescription', description: 'Brief description of the issue', defaultValue: '' },
          { name: 'agentName', description: 'Your name', defaultValue: '' },
          { name: 'teamName', description: 'Team name', defaultValue: 'Customer' }
        ],
        language: 'EN',
        isRichText: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // Rich text example template
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
    // Migrate all templates to rich text format
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const templates = result[STORAGE_KEY] || [];
      
      // Check if any templates need migration
      const needsMigration = templates.some((t: Template) => t.isRichText !== true);
      
      if (needsMigration) {
        // Convert any plain text templates to rich text
        const migratedTemplates = templates.map((t: Template) => {
          if (t.isRichText !== true) {
            // Convert plain text to basic HTML by wrapping lines in <p> tags
            const htmlContent = t.content
              .split('\n')
              .filter(line => line.trim() !== '') // Skip empty lines
              .map(line => `<p>${line}</p>`)
              .join('');
            
            return {
              ...t,
              isRichText: true,
              content: htmlContent || '<p></p>' // Ensure there's at least an empty paragraph
            };
          }
          return t;
        });
        
        chrome.storage.sync.set({ [STORAGE_KEY]: migratedTemplates }, () => {
          console.log('Templates migrated to rich text format');
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