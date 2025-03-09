declare module 'react-quill-new' {
    import React from 'react';
    
    export interface QuillOptions {
      debug?: boolean | string;
      modules?: Record<string, any>;
      placeholder?: string;
      readOnly?: boolean;
      theme?: string;
      formats?: string[];
      bounds?: HTMLElement | string;
      scrollingContainer?: HTMLElement | string;
      tabIndex?: number;
    }
    
    export interface RangeStatic {
      index: number;
      length: number;
    }
    
    export interface DeltaOperation {
      insert?: any;
      delete?: number;
      retain?: number;
      attributes?: Record<string, any>;
    }
    
    export interface DeltaStatic {
      ops: DeltaOperation[];
      retain(length: number, attributes?: Record<string, any>): DeltaStatic;
      delete(length: number): DeltaStatic;
      filter(predicate: (op: DeltaOperation) => boolean): DeltaOperation[];
      forEach(predicate: (op: DeltaOperation) => void): void;
      insert(text: any, attributes?: Record<string, any>): DeltaStatic;
      map<T>(predicate: (op: DeltaOperation) => T): T[];
      partition(predicate: (op: DeltaOperation) => boolean): [DeltaOperation[], DeltaOperation[]];
      reduce<T>(predicate: (acc: T, curr: DeltaOperation, idx: number, arr: DeltaOperation[]) => T, initialValue: T): T;
      chop(): DeltaStatic;
      length(): number;
      slice(start?: number, end?: number): DeltaStatic;
      compose(other: DeltaStatic): DeltaStatic;
      concat(other: DeltaStatic): DeltaStatic;
      diff(other: DeltaStatic, index?: number): DeltaStatic;
      eachLine(predicate: (line: DeltaStatic, attributes: Record<string, any>, idx: number) => any, newline?: string): void;
      transform(index: number, priority?: boolean): number;
      transform(other: DeltaStatic, priority: boolean): DeltaStatic;
      transformPosition(index: number, priority?: boolean): number;
    }
    
    export interface QuillEditor {
      root: HTMLDivElement;
      clipboard: {
        convert(html?: string): DeltaStatic;
        dangerouslyPasteHTML(html: string): void;
        dangerouslyPasteHTML(index: number, html: string): void;
      };
      getLength(): number;
      getText(index?: number, length?: number): string;
      getContents(index?: number, length?: number): DeltaStatic;
      getSelection(focus?: boolean): RangeStatic;
      getBounds(index: number, length?: number): any;
      getFormat(range?: RangeStatic): Record<string, any>;
      getFormat(index: number, length?: number): Record<string, any>;
      getLine(index: number): [any, number];
      getLines(index?: number, length?: number): any[];
      getModule(name: string): any;
      focus(): void;
      blur(): void;
      hasFocus(): boolean;
      disable(): void;
      enable(enabled?: boolean): void;
      update(source?: string): void;
      insertText(index: number, text: string, source?: string): void;
      insertText(index: number, text: string, format: string, value: any, source?: string): void;
      insertText(index: number, text: string, formats: Record<string, any>, source?: string): void;
      insertEmbed(index: number, type: string, value: any, source?: string): void;
      deleteText(index: number, length: number, source?: string): void;
      formatText(index: number, length: number, formats: Record<string, any>, source?: string): void;
      formatText(index: number, length: number, format: string, value: any, source?: string): void;
      formatLine(index: number, length: number, formats: Record<string, any>, source?: string): void;
      formatLine(index: number, length: number, format: string, value: any, source?: string): void;
      setContents(delta: DeltaStatic, source?: string): void;
      setText(text: string, source?: string): void;
      updateContents(delta: DeltaStatic, source?: string): void;
      setSelection(range: RangeStatic, source?: string): void;
      setSelection(index: number, length: number, source?: string): void;
      scrollIntoView(): void;
      history: {
        undo(): void;
        redo(): void;
        clear(): void;
      };
      on(eventName: string, callback: (delta: DeltaStatic, oldContents: DeltaStatic, source: string) => void): void;
      on(eventName: 'text-change', callback: (delta: DeltaStatic, oldContents: DeltaStatic, source: string) => void): void;
      on(eventName: 'selection-change', callback: (range: RangeStatic, oldRange: RangeStatic, source: string) => void): void;
      on(eventName: 'editor-change', callback: (name: string, ...args: any[]) => void): void;
      once(eventName: string, handler: Function): void;
      off(eventName: string, handler: Function): void;
    }
    
    export interface UnprivilegedEditor {
      getLength(): number;
      getText(index?: number, length?: number): string;
      getHTML(): string;
      getContents(index?: number, length?: number): DeltaStatic;
      getSelection(focus?: boolean): RangeStatic;
      getBounds(index: number, length?: number): any;
    }
    
    export interface ReactQuillProps {
      bounds?: string | HTMLElement;
      children?: React.ReactElement<any>;
      className?: string;
      defaultValue?: string | DeltaStatic;
      formats?: string[];
      id?: string;
      modules?: Record<string, any>;
      onChange?: (
        content: string,
        delta: DeltaStatic,
        source: string,
        editor: UnprivilegedEditor
      ) => void;
      onChangeSelection?: (
        range: RangeStatic,
        source: string,
        editor: UnprivilegedEditor
      ) => void;
      onFocus?: (
        range: RangeStatic,
        source: string,
        editor: UnprivilegedEditor
      ) => void;
      onBlur?: (
        previousRange: RangeStatic,
        source: string,
        editor: UnprivilegedEditor
      ) => void;
      onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
      onKeyPress?: React.KeyboardEventHandler<HTMLDivElement>;
      onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
      placeholder?: string;
      preserveWhitespace?: boolean;
      readOnly?: boolean;
      scrollingContainer?: string | HTMLElement;
      style?: React.CSSProperties;
      tabIndex?: number;
      theme?: string;
      value?: string | DeltaStatic;
    }
    
    class ReactQuill extends React.Component<ReactQuillProps> {
      focus(): void;
      blur(): void;
      getEditor(): QuillEditor;
    }
    
    export interface Quill {
      find(domNode: Node | HTMLElement): ReactQuill | null;
      register(path: string, def: any, suppressWarning?: boolean): void;
      register(defs: Record<string, any>, suppressWarning?: boolean): void;
      import(name: string): any;
    }
    
    namespace ReactQuill {
      export const Quill: Quill;
    }
    
    export default ReactQuill;
  }