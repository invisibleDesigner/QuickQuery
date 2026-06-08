import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import SQLEditor from './components/SQLEditor';
import ResultTable from './components/ResultTable';
import ConnectionDialog from './components/ConnectionDialog';
import ShortcutDialog from './components/ShortcutDialog';
import { Connection, QueryTab } from './types';
import { parseMonacoKeybinding } from './utils/shortcuts';
import './App.css';

import {
  GetConnections,
  AddConnection,
  UpdateConnection,
  DeleteConnection,
  TestConnection,
  ExecuteQuery,
  GetDatabases,
  GetTables,
  GetColumns,
} from '../bindings/quickquery/app';

const systemDatabases = new Set(['information_schema', 'mysql', 'performance_schema', 'sys']);

let tabCounter = 0;
function nextTabId() {
  return `tab-${Date.now()}-${++tabCounter}`;
}

function createTab(database = '', sql = 'SELECT 1'): QueryTab {
  return { id: nextTabId(), name: '查询 1', sql, database, result: null };
}

interface WorkspaceState {
  tabs: QueryTab[];
  activeTabId: string;
}

function workspaceKey(connId: string) {
  return `quickquery.workspace.${connId}`;
}

function loadWorkspace(connId: string): WorkspaceState | null {
  try {
    const raw = localStorage.getItem(workspaceKey(connId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveWorkspace(connId: string, state: WorkspaceState) {
  localStorage.setItem(workspaceKey(connId), JSON.stringify(state));
}

function removeWorkspace(connId: string) {
  localStorage.removeItem(workspaceKey(connId));
}

function pickDefaultDatabase(dbs: string[], configuredDatabase?: string, savedDatabase?: string) {
  if (savedDatabase && dbs.includes(savedDatabase)) return savedDatabase;
  if (configuredDatabase && dbs.includes(configuredDatabase)) return configuredDatabase;
  return dbs.find(db => !systemDatabases.has(db)) || dbs[0] || '';
}

const layoutStorageKey = 'quickquery.layout';
const themeStorageKey = 'quickquery.theme';
type ThemeMode = 'system' | 'light' | 'dark';

function loadLayout() {
  try {
    return JSON.parse(localStorage.getItem(layoutStorageKey) || '{}');
  } catch {
    return {};
  }
}

function App() {
  const layout = loadLayout();
  const [sidebarWidth, setSidebarWidth] = useState(layout.sidebarWidth || 280);
  const [editorHeight, setEditorHeight] = useState(layout.editorHeight || 260);
  const [themeMode, setThemeMode] = useState<ThemeMode>((localStorage.getItem(themeStorageKey) as ThemeMode) || 'system');
  const [systemIsDark, setSystemIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<QueryTab[]>([createTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [databases, setDatabases] = useState<Record<string, string[]>>({});
  const [tables, setTables] = useState<Record<string, string[]>>({});
  const [columns, setColumns] = useState<Record<string, any[]>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<Connection | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcutVersion, setShortcutVersion] = useState(0);
  const [tabWidths, setTabWidths] = useState<Record<string, number>>({});
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateTab = useCallback((tabId: string, patch: Partial<QueryTab>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...patch } : t));
  }, []);

  useEffect(() => {
    localStorage.setItem(layoutStorageKey, JSON.stringify({ sidebarWidth, editorHeight }));
  }, [sidebarWidth, editorHeight]);

  useEffect(() => {
    localStorage.setItem(themeStorageKey, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setSystemIsDark(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    GetConnections().then(conns => {
      setConnections(conns || []);
      if (conns && conns.length > 0) {
        setActiveConnectionId(conns[0].id);
      }
    });
  }, []);

  // Load workspace when connection changes
  useEffect(() => {
    if (!activeConnectionId) {
      const tab = createTab();
      setTabs([tab]);
      setActiveTabId(tab.id);
      return;
    }
    const conn = connections.find(c => c.id === activeConnectionId);
    const workspace = loadWorkspace(activeConnectionId);
    if (workspace && Array.isArray(workspace.tabs) && workspace.tabs.length > 0) {
      setTabs(workspace.tabs);
      setActiveTabId(workspace.activeTabId || workspace.tabs[0].id);
    } else {
      const defaultDb = conn?.database || '';
      const tab = createTab(defaultDb);
      setTabs([tab]);
      setActiveTabId(tab.id);
    }
    GetDatabases(activeConnectionId).then(dbs => {
      const list = dbs || [];
      setDatabases(prev => ({ ...prev, [activeConnectionId]: list }));
      // Fix tab databases if needed
      setTabs(prev => prev.map(t => {
        if (t.database && !list.includes(t.database)) {
          const fixed = pickDefaultDatabase(list, conn?.database);
          return { ...t, database: fixed };
        }
        return t;
      }));
    });
  }, [activeConnectionId, connections]);

  // Persist workspace
  useEffect(() => {
    if (!activeConnectionId) return;
    saveWorkspace(activeConnectionId, { tabs, activeTabId });
  }, [activeConnectionId, tabs, activeTabId]);

  const handleAddConnection = () => {
    setEditingConnection(null);
    setShowDialog(true);
  };

  const handleEditConnection = (conn: Connection) => {
    setEditingConnection(conn);
    setShowDialog(true);
  };

  const handleSaveConnection = async (conn: Connection) => {
    const isEditing = !!editingConnection;
    if (isEditing) {
      await UpdateConnection(conn);
    } else {
      await AddConnection(conn);
    }

    const updated = await GetConnections();
    setConnections(updated || []);

    const targetId = isEditing ? conn.id : updated?.[updated.length - 1]?.id;
    const savedConnection = updated?.find(c => c.id === targetId);
    if (targetId) {
      setActiveConnectionId(targetId);
      const dbs = await GetDatabases(targetId);
      const list = dbs || [];
      const defaultDatabase = pickDefaultDatabase(list, savedConnection?.database);
      setTabs(prev => prev.map(t => ({ ...t, database: t.database || defaultDatabase })));
      setDatabases(prev => ({ ...prev, [targetId]: list }));
    }
  };

  const handleDeleteConnection = (id: string) => {
    const conn = connections.find(c => c.id === id);
    if (conn) {
      setDeletingConnection(conn);
    }
  };

  const confirmDeleteConnection = async () => {
    if (!deletingConnection) return;

    await DeleteConnection(deletingConnection.id);
    removeWorkspace(deletingConnection.id);
    const updated = await GetConnections();
    setConnections(updated || []);
    if (activeConnectionId === deletingConnection.id) {
      setActiveConnectionId(updated && updated.length > 0 ? updated[0].id : null);
    }
    setDeletingConnection(null);
  };

  const handleTestConnection = async (conn: Connection): Promise<string> => {
    try {
      await TestConnection(conn);
      return '连接成功';
    } catch (e: any) {
      return `连接失败：${e}`;
    }
  };

  useEffect(() => {
    if (!activeConnectionId || !activeTab?.database) return;
    const key = `${activeConnectionId}/${activeTab.database}`;
    if (tables[key]) return;
    GetTables(activeConnectionId, activeTab.database).then(tbls => {
      setTables(prev => ({ ...prev, [key]: tbls || [] }));
    });
  }, [activeConnectionId, activeTab?.database, tables]);

  const startSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMove = (event: MouseEvent) => {
      const nextWidth = Math.min(Math.max(startWidth + event.clientX - startX, 220), 520);
      setSidebarWidth(nextWidth);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const startEditorResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = editorHeight;

    const handleMove = (event: MouseEvent) => {
      const nextHeight = Math.min(Math.max(startHeight + event.clientY - startY, 140), 600);
      setEditorHeight(nextHeight);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleExecute = useCallback(async () => {
    if (!activeConnectionId) {
      updateTab(activeTabId, { result: { columns: [], rows: [], error: '请先选择连接', duration: 0 } });
      return;
    }
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const res = await ExecuteQuery(activeConnectionId, tab.database, tab.sql);
    updateTab(activeTabId, { result: res });
  }, [activeConnectionId, activeTabId, tabs, updateTab]);

  const handleExpandDatabase = async (connId: string, db: string) => {
    const tbls = await GetTables(connId, db);
    setTables(prev => ({ ...prev, [`${connId}/${db}`]: tbls || [] }));
  };

  const handleExpandTable = async (connId: string, db: string, table: string) => {
    const cols = await GetColumns(connId, db, table);
    setColumns(prev => ({ ...prev, [`${connId}/${db}/${table}`]: cols || [] }));
  };

  const handleAddTab = () => {
    const conn = connections.find(c => c.id === activeConnectionId);
    const db = activeTab?.database || conn?.database || '';
    const tab = createTab(db);
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === tabId);
    const next = tabs.filter(t => t.id !== tabId);
    setTabs(next);
    if (activeTabId === tabId) {
      setActiveTabId(next[Math.min(idx, next.length - 1)].id);
    }
  };

  const startTabResize = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = tabWidths[tabId] || 120;
    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');

    const handleMove = (event: MouseEvent) => {
      const nextWidth = Math.min(Math.max(startWidth + event.clientX - startX, 80), 360);
      setTabWidths(prev => ({ ...prev, [tabId]: nextWidth }));
    };
    const handleUp = () => {
      target.classList.remove('dragging');
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const effectiveTheme = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;
  const activeTables = activeConnectionId && activeTab?.database ? tables[`${activeConnectionId}/${activeTab.database}`] || [] : [];
  const activeColumns = activeConnectionId && activeTab?.database
    ? Object.fromEntries(
        Object.entries(columns)
          .filter(([key]) => key.startsWith(`${activeConnectionId}/${activeTab.database}/`))
          .map(([key, value]) => [key.split('/').slice(2).join('/'), value])
      )
    : {};

  return (
    <div className="app" data-theme={themeMode}>
      <div className="sidebar-pane" style={{ width: sidebarWidth }}>
        <Sidebar
        connections={connections}
        activeConnectionId={activeConnectionId}
        databases={databases}
        tables={tables}
        columns={columns}
        onSelectConnection={setActiveConnectionId}
        onExpandDatabase={handleExpandDatabase}
        onExpandTable={handleExpandTable}
        onAddConnection={handleAddConnection}
        onEditConnection={handleEditConnection}
        onDeleteConnection={handleDeleteConnection}
        />
      </div>
      <div className="vertical-resizer" onMouseDown={startSidebarResize} />
      <div className="main-area">
        <div className="toolbar">
          {activeConnection && (
            <span className="connection-badge">
              🟢 {activeConnection.name || activeConnection.host}
              {activeConnection.database ? ` / ${activeConnection.database}` : ''}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <label className="theme-selector">
            <span>主题</span>
            <select value={themeMode} onChange={e => setThemeMode(e.target.value as ThemeMode)}>
              <option value="system">跟随系统</option>
              <option value="light">亮色</option>
              <option value="dark">暗色</option>
            </select>
          </label>
          <button className="btn-secondary shortcut-badge" onClick={() => setShowShortcuts(true)} title="快捷键管理">快捷键</button>
        </div>
        <div className="editor-pane" style={{ height: editorHeight }}>
          <div className="tab-bar">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
                style={tabWidths[tab.id] ? { width: tabWidths[tab.id], minWidth: tabWidths[tab.id], maxWidth: tabWidths[tab.id] } : undefined}
                onClick={() => setActiveTabId(tab.id)}
              >
                {editingTabId === tab.id ? (
                  <input
                    className="tab-name-input"
                    value={tab.name}
                    autoFocus
                    onChange={e => updateTab(tab.id, { name: e.target.value })}
                    onBlur={() => setEditingTabId(null)}
                    onKeyDown={e => { if (e.key === 'Enter') setEditingTabId(null); }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="tab-name" onDoubleClick={e => { e.stopPropagation(); setEditingTabId(tab.id); }}>{tab.name}</span>
                )}
                {tabs.length > 1 && (
                  <span className="tab-close" onClick={e => handleCloseTab(tab.id, e)}>×</span>
                )}
                <span className="tab-resizer" onMouseDown={e => startTabResize(tab.id, e)} />
              </div>
            ))}
            <button className="tab-add" onClick={handleAddTab} title="新建查询">+</button>
          </div>
          <SQLEditor
          value={activeTab?.sql || ''}
          databases={activeConnectionId ? databases[activeConnectionId] || [] : []}
          selectedDatabase={activeTab?.database || ''}
          tables={activeTables}
          columns={activeColumns}
          onChange={v => updateTab(activeTabId, { sql: v })}
          onDatabaseChange={v => updateTab(activeTabId, { database: v })}
          onExecute={handleExecute}
          height={`${Math.max(editorHeight - 38 - 32, 100)}px`}
          editorTheme={effectiveTheme === 'dark' ? 'vs-dark' : 'vs'}
          shortcutVersion={shortcutVersion}
          />
        </div>
        <div className="horizontal-resizer" onMouseDown={startEditorResize} />
        <ResultTable result={activeTab?.result || null} />
      </div>
      <ConnectionDialog
        open={showDialog}
        connection={editingConnection}
        onSave={handleSaveConnection}
        onClose={() => setShowDialog(false)}
        onTest={handleTestConnection}
      />
      {deletingConnection && (
        <div className="dialog-overlay" onClick={e => e.stopPropagation()}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h3>删除连接</h3>
            <p className="confirm-message">
              确定要删除连接「{deletingConnection.name || deletingConnection.host}」吗？
            </p>
            <div className="dialog-actions">
              <div style={{ flex: 1 }} />
              <button className="btn-secondary" onClick={() => setDeletingConnection(null)}>取消</button>
              <button className="btn-danger" onClick={confirmDeleteConnection}>删除</button>
            </div>
          </div>
        </div>
      )}
      <ShortcutDialog
        open={showShortcuts}
        onClose={() => { setShowShortcuts(false); setShortcutVersion(v => v + 1); }}
      />
    </div>
  );
}

export default App;
