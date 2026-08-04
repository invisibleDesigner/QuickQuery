import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ColumnInfo } from '../types';
import { getShortcutKeys, parseMonacoKeybinding, formatDisplayKeys } from '../utils/shortcuts';
import { PlayIcon } from './icons';

interface Props {
  value: string;
  databases: string[];
  selectedDatabase: string;
  tables: string[];
  columns: Record<string, ColumnInfo[]>;
  onChange: (value: string) => void;
  onDatabaseChange: (database: string) => void;
  onExecute: (sql?: string) => void;
  height: string;
  editorTheme: string;
  shortcutVersion: number;
}

const sqlKeywords = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
  'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO',
  'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'AS', 'DESC', 'ASC'
];

function defineEditorThemes(monaco: any) {
  monaco.editor.defineTheme('qq-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'd7e0ee' },
      { token: 'keyword', foreground: '6cb2ff' },
      { token: 'predefined', foreground: 'c792ea' },
      { token: 'string', foreground: 'a6d189' },
      { token: 'string.sql', foreground: 'a6d189' },
      { token: 'number', foreground: 'e5a04c' },
      { token: 'comment', foreground: '58677d', fontStyle: 'italic' },
      { token: 'operator', foreground: '89ddff' },
      { token: 'identifier.quote', foreground: '7dc4e4' },
    ],
    colors: {
      'editor.background': '#0a0e15',
      'editor.foreground': '#d7e0ee',
      'editor.lineHighlightBackground': '#121a26',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#3b4a5f',
      'editorLineNumber.activeForeground': '#8fa0b6',
      'editorCursor.foreground': '#3ea6ff',
      'editor.selectionBackground': '#3ea6ff30',
      'editor.inactiveSelectionBackground': '#3ea6ff1a',
      'editorGutter.background': '#0a0e15',
      'editorIndentGuide.background1': '#1c2836',
      'editorIndentGuide.activeBackground1': '#2b3b52',
      'editorWhitespace.foreground': '#2b3b52',
      'editorWidget.background': '#10161f',
      'editorWidget.border': '#1f2b3c',
      'editorSuggestWidget.background': '#10161f',
      'editorSuggestWidget.border': '#1f2b3c',
      'editorSuggestWidget.selectedBackground': '#16324e',
      'editorSuggestWidget.highlightForeground': '#6cbaff',
      'editorHoverWidget.background': '#10161f',
      'editorHoverWidget.border': '#1f2b3c',
      'editorBracketMatch.background': '#3ea6ff26',
      'editorBracketMatch.border': '#3ea6ff66',
      'scrollbarSlider.background': '#8fa0b622',
      'scrollbarSlider.hoverBackground': '#8fa0b638',
      'scrollbarSlider.activeBackground': '#3ea6ff55',
    },
  });
  monaco.editor.defineTheme('qq-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '24344d' },
      { token: 'keyword', foreground: '0f6fd6' },
      { token: 'predefined', foreground: '8b46c7' },
      { token: 'string', foreground: '2f8a46' },
      { token: 'string.sql', foreground: '2f8a46' },
      { token: 'number', foreground: 'c07000' },
      { token: 'comment', foreground: '93a1b5', fontStyle: 'italic' },
      { token: 'operator', foreground: '0b8fa3' },
      { token: 'identifier.quote', foreground: '1a7f9e' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24344d',
      'editor.lineHighlightBackground': '#f1f6fc',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#b6c2d1',
      'editorLineNumber.activeForeground': '#5d6f85',
      'editorCursor.foreground': '#0f7ae0',
      'editor.selectionBackground': '#bcdcff99',
      'editor.inactiveSelectionBackground': '#bcdcff55',
      'editorGutter.background': '#ffffff',
      'editorIndentGuide.background1': '#e6edf5',
      'editorIndentGuide.activeBackground1': '#c2cedd',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#d9e1eb',
      'editorSuggestWidget.background': '#ffffff',
      'editorSuggestWidget.border': '#d9e1eb',
      'editorSuggestWidget.selectedBackground': '#d7e9fd',
      'editorSuggestWidget.highlightForeground': '#0b68c0',
      'editorHoverWidget.background': '#ffffff',
      'editorHoverWidget.border': '#d9e1eb',
      'editorBracketMatch.background': '#0f7ae01f',
      'editorBracketMatch.border': '#0f7ae059',
      'scrollbarSlider.background': '#5d6f8526',
      'scrollbarSlider.hoverBackground': '#5d6f8540',
      'scrollbarSlider.activeBackground': '#0f7ae055',
    },
  });
}

export default function SQLEditor({
  value,
  databases,
  selectedDatabase,
  tables,
  columns,
  onChange,
  onDatabaseChange,
  onExecute,
  height,
  editorTheme,
  shortcutVersion,
}: Props) {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const providerRef = useRef<any>(null);
  const executeRef = useRef(onExecute);
  const [monacoReady, setMonacoReady] = useState(false);

  useEffect(() => {
    executeRef.current = onExecute;
  }, [onExecute]);

  const executeEditorContent = () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!model || !selection) {
      executeRef.current();
      return;
    }

    const selectedSql = model.getValueInRange(selection);
    executeRef.current(selectedSql.trim() ? selectedSql : undefined);
  };

  // Rebind shortcuts when shortcutVersion changes
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const parsed = parseMonacoKeybinding(getShortcutKeys('execute'));
    if (parsed) {
      const mod = (parsed.ctrlCmd ? monaco.KeyMod.CtrlCmd : 0) | (parsed.shift ? monaco.KeyMod.Shift : 0);
      editor.addCommand(mod | parsed.keyCode, executeEditorContent);
    }
  }, [shortcutVersion]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    providerRef.current?.dispose();
    providerRef.current = monaco.languages.registerCompletionItemProvider('mysql', {
      triggerCharacters: [' ', '.', '`'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const linePrefix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        const tableMatch = linePrefix.match(/([`\w]+)\.\s*[`\w]*$/);
        const tableName = tableMatch?.[1]?.replace(/`/g, '');
        const columnSuggestions = tableName && columns[tableName]
          ? columns[tableName].map(col => ({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${col.type}${col.key === 'PRI' ? ' · 主键' : ''}`,
              insertText: col.name,
              range,
            }))
          : Object.entries(columns).flatMap(([table, cols]) => cols.map(col => ({
              label: `${table}.${col.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: col.type,
              insertText: col.name,
              range,
            })));

        const suggestions = [
          ...sqlKeywords.map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range,
          })),
          ...tables.map(table => ({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: '数据表',
            insertText: table,
            range,
          })),
          ...columnSuggestions,
        ];

        return { suggestions };
      },
    });

    return () => providerRef.current?.dispose();
  }, [monacoReady, tables, columns]);


  return (
    <div className="sql-editor">
      <div className="editor-toolbar">
        <label className="database-selector">
          <span>当前库</span>
          <select value={selectedDatabase} onChange={e => onDatabaseChange(e.target.value)}>
            <option value="">请选择数据库</option>
            {databases.map(db => (
              <option key={db} value={db}>{db}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary" onClick={executeEditorContent} title={`执行 (${formatDisplayKeys(getShortcutKeys('execute'))})`}>
          <PlayIcon size={11} />执行
        </button>
      </div>
      <Editor
        height={height}
        defaultLanguage="mysql"
        value={value}
        onChange={v => onChange(v || '')}
        beforeMount={defineEditorThemes}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          editorRef.current = editor;
          // Bind execute shortcut
          const parsed = parseMonacoKeybinding(getShortcutKeys('execute'));
          if (parsed) {
            const mod = (parsed.ctrlCmd ? monaco.KeyMod.CtrlCmd : 0) | (parsed.shift ? monaco.KeyMod.Shift : 0);
            editor.addCommand(mod | parsed.keyCode, executeEditorContent);
          }
          setMonacoReady(true);
        }}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: 21,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 10,
          folding: false,
          glyphMargin: false,
          renderLineHighlight: 'all',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 10, bottom: 10 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: false, indentation: false },
          fixedOverflowWidgets: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
}
