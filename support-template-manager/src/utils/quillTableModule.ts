// src/utils/quillTableModule.ts
import ReactQuill from 'react-quill-new';

// Create a custom table module for Quill
export default function createTableModule() {
  const Quill = ReactQuill.Quill;
  const Module = Quill.import('core/module');
  
  // First check if a table module already exists
  try {
    const ExistingTableModule = Quill.import('modules/table');
    console.log('Table module already exists, using existing module');
    return ExistingTableModule;
  } catch (e) {
    // If the module doesn't exist, create a new one
    class TableModule extends Module {
      constructor(quill, options) {
        super(quill, options);
        
        // Add formats for table elements if they don't exist
        this.registerTableFormats();
        
        // Register table handling
        this.listenForTableEvents();
      }
      
      registerTableFormats() {
        const Quill = this.quill.constructor;
        const Block = Quill.import('blots/block');
        const Container = Quill.import('blots/container');
        
        // Check if formats are already registered before registering them
        try {
          // Only try to register formats if they don't already exist
          if (!Quill.imports['formats/table']) {
            // Table Container
            class TableContainer extends Container {
              static create() {
                const node = super.create();
                node.setAttribute('style', 'width: 100%; border-collapse: collapse; margin-bottom: 1em;');
                return node;
              }
              
              optimize() {
                super.optimize();
                const next = this.next;
                if (next != null && next.prev === this &&
                    next.statics.blotName === this.statics.blotName &&
                    next.domNode.tagName === this.domNode.tagName) {
                  next.moveChildren(this);
                  next.remove();
                }
              }
            }
            
            TableContainer.blotName = 'table';
            TableContainer.tagName = 'table';
            
            // Table Body
            class TableBody extends Container {
              static create() {
                return super.create();
              }
            }
            
            TableBody.blotName = 'table-body';
            TableBody.tagName = 'tbody';
            
            // Table Row
            class TableRow extends Container {
              static create() {
                return super.create();
              }
            }
            
            TableRow.blotName = 'table-row';
            TableRow.tagName = 'tr';
            
            // Table Cell
            class TableCell extends Block {
              static create(value) {
                const node = super.create();
                node.setAttribute('style', 'border: 1px solid #ccc; padding: 8px;');
                if (value) {
                  if (typeof value === 'string') {
                    node.setAttribute('data-cell-type', value);
                  }
                  if (value === 'header') {
                    node.setAttribute('style', 'border: 1px solid #ccc; padding: 8px; background-color: #f3f3f3; font-weight: bold;');
                  }
                }
                return node;
              }
              
              format(name, value) {
                if (name === 'celltype') {
                  if (value) {
                    this.domNode.setAttribute('data-cell-type', value);
                    if (value === 'header') {
                      this.domNode.setAttribute('style', 'border: 1px solid #ccc; padding: 8px; background-color: #f3f3f3; font-weight: bold;');
                    }
                  } else {
                    this.domNode.removeAttribute('data-cell-type');
                    this.domNode.setAttribute('style', 'border: 1px solid #ccc; padding: 8px;');
                  }
                } else {
                  super.format(name, value);
                }
              }
            }
            
            TableCell.blotName = 'table-cell';
            TableCell.tagName = 'td';
            
            // Table Header Cell
            class TableHeaderCell extends TableCell {
              static create() {
                const node = super.create('header');
                return node;
              }
            }
            
            TableHeaderCell.blotName = 'table-header';
            TableHeaderCell.tagName = 'th';
            
            // Register the new formats safely - with try-catch for each one
            try { Quill.register(TableContainer); } catch (e) { console.warn('Could not register TableContainer:', e.message); }
            try { Quill.register(TableBody); } catch (e) { console.warn('Could not register TableBody:', e.message); }
            try { Quill.register(TableRow); } catch (e) { console.warn('Could not register TableRow:', e.message); }
            try { Quill.register(TableCell); } catch (e) { console.warn('Could not register TableCell:', e.message); }
            try { Quill.register(TableHeaderCell); } catch (e) { console.warn('Could not register TableHeaderCell:', e.message); }
            
            console.log('Table formats registered successfully');
          } else {
            console.log('Table formats already registered');
          }
        } catch (error) {
          console.warn('Error during table format registration:', error);
        }
      }
      
      listenForTableEvents() {
        // This is where you could add event listeners for table interactions
        // For example, keyboard navigation, cell selection, etc.
      }
      
      // Helper method to insert a table at the current cursor position
      insertTable(rows = 3, cols = 3, withHeaders = true) {
        const quill = this.quill;
        const range = quill.getSelection();
        if (!range) return;
        
        // Create table HTML string - using direct HTML insertion as a reliable fallback
        let tableHTML = '<table style="width:100%; border-collapse:collapse; margin:10px 0;">';
        tableHTML += '<tbody>';
        
        for (let r = 0; r < rows; r++) {
          tableHTML += '<tr>';
          for (let c = 0; c < cols; c++) {
            if (r === 0 && withHeaders) {
              tableHTML += `<th style="border:1px solid #ccc; padding:8px; background-color:#f3f3f3; font-weight:bold; text-align:left;">Header ${c+1}</th>`;
            } else {
              tableHTML += `<td style="border:1px solid #ccc; padding:8px; text-align:left;">Cell ${r}-${c}</td>`;
            }
          }
          tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table><p><br></p>';
        
        // Insert at current selection
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
        
        // Move cursor after the table
        quill.setSelection(range.index + 1, 0);
      }
    }
    
    // Return the new module class
    return TableModule;
  }
}