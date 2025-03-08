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
        const newTemplate = Object.assign(Object.assign({}, template), { id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp });
        yield storageService.saveTemplates([...templates, newTemplate]);
        return newTemplate;
    }),
    // Update existing template
    updateTemplate: (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
        const templates = yield storageService.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index === -1)
            return null;
        const updatedTemplate = Object.assign(Object.assign(Object.assign({}, templates[index]), updates), { updatedAt: Date.now() });
        templates[index] = updatedTemplate;
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
            yield storageService.saveTemplates(data.templates);
        }
        if (data.globalVariables) {
            yield storageService.saveGlobalVariables(data.globalVariables);
        }
    })
};


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
        // Set up initial template examples
        const initialTemplates = [
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
        chrome.storage.sync.set({ [_services_storage__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY]: initialTemplates }, () => {
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

})();

/******/ })()
;
//# sourceMappingURL=background.js.map