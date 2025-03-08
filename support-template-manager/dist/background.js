/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/services/storage.ts":
/*!*********************************!*\
  !*** ./src/services/storage.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GLOBAL_VARIABLES_KEY: () => (/* binding */ GLOBAL_VARIABLES_KEY),
/* harmony export */   STORAGE_KEY: () => (/* binding */ STORAGE_KEY),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   storageService: () => (/* binding */ storageService)
/* harmony export */ });
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STORAGE_KEY = 'support_templates';
const GLOBAL_VARIABLES_KEY = 'support_global_variables';
const storageService = {
    // Get all templates
    getTemplates: () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(STORAGE_KEY, (result) => {
                resolve(result[STORAGE_KEY] || []);
            });
        });
    },
    // Get template groups (templates organized by baseId)
    getTemplateGroups: () => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const groupsMap = {};
        // Group templates by baseId
        templates.forEach(template => {
            const baseId = template.baseId || template.id;
            if (!groupsMap[baseId]) {
                groupsMap[baseId] = {
                    baseId,
                    name: template.name,
                    category: template.category,
                    templates: {
                        'EN': null,
                        'FR': null,
                        'DE': null
                    },
                    variables: template.variables
                };
            }
            // Add the template to its language slot
            const language = template.language || 'EN';
            groupsMap[baseId].templates[language] = template;
        });
        return Object.values(groupsMap);
    }),
    // Save templates
    saveTemplates: (templates) => {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [STORAGE_KEY]: templates }, () => {
                resolve();
            });
        });
    },
    // Add new template
    addTemplate: (template) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const timestamp = Date.now();
        const newId = crypto.randomUUID();
        // Check if this is a new template or a translation
        // We'll determine if it's a translation by checking if a template with the same name already exists
        const existingTemplate = templates.find(t => t.name === template.name);
        const baseId = existingTemplate ? existingTemplate.baseId : newId;
        // Check if a template with this language already exists
        const duplicateLanguage = templates.find(t => t.baseId === baseId &&
            t.language === template.language);
        if (duplicateLanguage) {
            throw new Error(`A template in ${template.language} already exists for "${template.name}"`);
        }
        const newTemplate = Object.assign(Object.assign({}, template), { id: newId, baseId, isRichText: true, createdAt: timestamp, updatedAt: timestamp });
        yield storageService.saveTemplates([...templates, newTemplate]);
        return newTemplate;
    }),
    // Add a translation to an existing template
    addTranslation: (baseTemplate, language, content, isRichText // Keep parameter for backward compatibility
    ) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const timestamp = Date.now();
        // Check if a translation in this language already exists
        const existingTranslation = templates.find(t => t.baseId === baseTemplate.baseId &&
            t.language === language);
        if (existingTranslation) {
            throw new Error(`A translation in ${language} already exists for "${baseTemplate.name}"`);
        }
        const newTranslation = {
            id: crypto.randomUUID(),
            baseId: baseTemplate.baseId,
            name: baseTemplate.name,
            category: baseTemplate.category,
            content,
            variables: baseTemplate.variables,
            language,
            isRichText: true, // Always true
            createdAt: timestamp,
            updatedAt: timestamp
        };
        yield storageService.saveTemplates([...templates, newTranslation]);
        return newTranslation;
    }),
    // Update existing template
    updateTemplate: (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index === -1)
            return null;
        const templateToUpdate = templates[index];
        // If changing the language, check if there's already a template in that language
        if (updates.language && updates.language !== templateToUpdate.language) {
            const duplicateLanguage = templates.find(t => t.baseId === templateToUpdate.baseId &&
                t.language === updates.language &&
                t.id !== id);
            if (duplicateLanguage) {
                throw new Error(`A template in ${updates.language} already exists for "${templateToUpdate.name}"`);
            }
        }
        // Override isRichText to always be true
        if (updates.isRichText !== undefined) {
            updates.isRichText = true;
        }
        const updatedTemplate = Object.assign(Object.assign(Object.assign({}, templateToUpdate), updates), { isRichText: true, updatedAt: Date.now() });
        templates[index] = updatedTemplate;
        // If name or category is updated, update all templates with the same baseId
        if (updates.name || updates.category) {
            for (let i = 0; i < templates.length; i++) {
                if (templates[i].baseId === templateToUpdate.baseId && i !== index) {
                    templates[i] = Object.assign(Object.assign({}, templates[i]), { name: updates.name || templates[i].name, category: updates.category || templates[i].category, updatedAt: Date.now() });
                }
            }
        }
        yield storageService.saveTemplates(templates);
        return updatedTemplate;
    }),
    // Delete template
    deleteTemplate: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const filteredTemplates = templates.filter(t => t.id !== id);
        if (filteredTemplates.length === templates.length)
            return false;
        yield storageService.saveTemplates(filteredTemplates);
        return true;
    }),
    // Delete all templates with the same baseId
    deleteTemplateGroup: (baseId) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const filteredTemplates = templates.filter(t => t.baseId !== baseId);
        if (filteredTemplates.length === templates.length)
            return false;
        yield storageService.saveTemplates(filteredTemplates);
        return true;
    }),
    // Get global variables
    getGlobalVariables: () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(GLOBAL_VARIABLES_KEY, (result) => {
                resolve(result[GLOBAL_VARIABLES_KEY] || []);
            });
        });
    },
    // Save global variables
    saveGlobalVariables: (variables) => {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [GLOBAL_VARIABLES_KEY]: variables }, () => {
                resolve();
            });
        });
    },
    // Update a global variable
    updateGlobalVariable: (name, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const variables = yield storageService.getGlobalVariables();
        const index = variables.findIndex(v => v.name === name);
        if (index === -1) {
            // If variable doesn't exist, add it
            const newVariable = {
                name,
                description: updates.description || `Value for ${name}`,
                defaultValue: updates.defaultValue || ''
            };
            yield storageService.saveGlobalVariables([...variables, newVariable]);
            return newVariable;
        }
        // Update existing variable
        const updatedVariable = Object.assign(Object.assign({}, variables[index]), updates);
        variables[index] = updatedVariable;
        yield storageService.saveGlobalVariables(variables);
        return updatedVariable;
    }),
    // Export all data (templates and global variables)
    exportData: () => __awaiter(void 0, void 0, void 0, function* () {
        const [templates, globalVariables] = yield Promise.all([
            storageService.getTemplates(),
            storageService.getGlobalVariables()
        ]);
        return {
            templates,
            globalVariables
        };
    }),
    // Import data (templates and global variables)
    importData: (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data.templates) {
            // Make sure all templates have a baseId and isRichText property (for backwards compatibility)
            const templatesWithUpdates = data.templates.map(template => (Object.assign(Object.assign({}, template), { baseId: template.baseId || template.id, isRichText: true // Always true
             })));
            yield storageService.saveTemplates(templatesWithUpdates);
        }
        if (data.globalVariables) {
            yield storageService.saveGlobalVariables(data.globalVariables);
        }
    }),
    // Migrate existing templates to the new structure with baseId and isRichText
    migrateTemplates: () => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        let needsMigration = false;
        // Check if any template is missing a baseId or isRichText property
        const migratedTemplates = templates.map(template => {
            const updates = {};
            if (!template.baseId) {
                updates.baseId = template.id;
                needsMigration = true;
            }
            if (template.isRichText !== true) {
                updates.isRichText = true;
                needsMigration = true;
            }
            if (Object.keys(updates).length > 0) {
                return Object.assign(Object.assign({}, template), updates);
            }
            return template;
        });
        if (needsMigration) {
            yield storageService.saveTemplates(migratedTemplates);
        }
    }),
    // Migrate templates to rich text format
    migrateToRichText: () => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        let needsMigration = false;
        // Convert all templates to rich text
        const migratedTemplates = templates.map(template => {
            if (template.isRichText !== true) {
                needsMigration = true;
                // Convert plain text content to HTML
                const htmlContent = template.content
                    .split('\n')
                    .filter(line => line.trim() !== '') // Skip empty lines
                    .map(line => `<p>${line}</p>`)
                    .join('');
                return Object.assign(Object.assign({}, template), { isRichText: true, content: htmlContent || '<p></p>' // Ensure there's at least an empty paragraph
                 });
            }
            return template;
        });
        if (needsMigration) {
            yield storageService.saveTemplates(migratedTemplates);
            console.log('Migrated all templates to rich text format');
        }
    })
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (storageService);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _services_storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./services/storage */ "./src/services/storage.ts");
// Background script for our Chrome extension

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set up initial template examples - all with isRichText=true
        const initialTemplates = [
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
        chrome.storage.sync.set({ [_services_storage__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY]: initialTemplates }, () => {
            console.log('Initial templates created');
        });
    }
    else if (details.reason === 'update') {
        // Migrate all templates to rich text format
        chrome.storage.sync.get(_services_storage__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY, (result) => {
            const templates = result[_services_storage__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY] || [];
            // Check if any templates need migration
            const needsMigration = templates.some((t) => t.isRichText !== true);
            if (needsMigration) {
                // Convert any plain text templates to rich text
                const migratedTemplates = templates.map((t) => {
                    if (t.isRichText !== true) {
                        // Convert plain text to basic HTML by wrapping lines in <p> tags
                        const htmlContent = t.content
                            .split('\n')
                            .filter(line => line.trim() !== '') // Skip empty lines
                            .map(line => `<p>${line}</p>`)
                            .join('');
                        return Object.assign(Object.assign({}, t), { isRichText: true, content: htmlContent || '<p></p>' // Ensure there's at least an empty paragraph
                         });
                    }
                    return t;
                });
                chrome.storage.sync.set({ [_services_storage__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY]: migratedTemplates }, () => {
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

})();

/******/ })()
;
//# sourceMappingURL=background.js.map