import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ColumnInfo } from '../types';
import { getShortcutKeys, parseMonacoKeybinding } from '../utils/shortcuts';

interface Props {
  value: string;
  databases: string[];
  selectedDatabase: string;
  tables: string[];
  columns: Record<string, ColumnInfo[]>;
  onChange: (value: string) => void;
  onDatabaseChange: (database: string) => void;
  onExecute: () => void;
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

  // Rebind shortcuts when shortcutVersion changes
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const parsed = parseMonacoKeybinding(getShortcutKeys('execute'));
    if (parsed) {
      const mod = (parsed.ctrlCmd ? monaco.KeyMod.CtrlCmd : 0) | (parsed.shift ? monaco.KeyMod.Shift : 0);
      editor.addCommand(mod | parsed.keyCode, () => {
        executeRef.current();
      });
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onExecute();
    }
  };

  return (
    <div className="sql-editor" onKeyDown={handleKeyDown}>
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
        <button className="btn-primary" onClick={onExecute}>
          ▶ 执行
        </button>
      </div>
      <Editor
        height={height}
        defaultLanguage="mysql"
        value={value}
        onChange={v => onChange(v || '')}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          editorRef.current = editor;
          // Bind execute shortcut
          const parsed = parseMonacoKeybinding(getShortcutKeys('execute'));
          if (parsed) {
            const mod = (parsed.ctrlCmd ? monaco.KeyMod.CtrlCmd : 0) | (parsed.shift ? monaco.KeyMod.Shift : 0);
            editor.addCommand(mod | parsed.keyCode, () => {
              executeRef.current();
            });
          }
          setMonacoReady(true);
        }}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 8 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
}
