import { useEffect, useRef, useState } from 'react';
import { Connection } from '../types';
import { ChevronIcon, ServerIcon, DatabaseIcon, TableIcon, KeyIcon, FieldIcon, PlusIcon, PencilIcon, TrashIcon, PlugIcon } from './icons';

const tableClickDelayMs = 250;

interface Props {
  connections: Connection[];
  activeConnectionId: string | null;
  databases: Record<string, string[]>;
  tables: Record<string, string[]>;
  columns: Record<string, any[]>;
  onSelectConnection: (id: string) => void;
  onExpandDatabase: (connId: string, db: string) => void;
  onExpandTable: (connId: string, db: string, table: string) => void;
  onAddConnection: () => void;
  onEditConnection: (conn: Connection) => void;
  onDeleteConnection: (id: string) => void;
  onDoubleClickTable: (connId: string, db: string, table: string) => void;
}

export default function Sidebar({
  connections,
  activeConnectionId,
  databases,
  tables,
  columns,
  onSelectConnection,
  onExpandDatabase,
  onExpandTable,
  onAddConnection,
  onEditConnection,
  onDeleteConnection,
  onDoubleClickTable,
}: Props) {
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const tableClickTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!activeConnectionId) return;
    setExpandedConnections(prev => {
      if (prev.has(activeConnectionId)) return prev;
      const next = new Set(prev);
      next.add(activeConnectionId);
      return next;
    });
  }, [activeConnectionId]);

  useEffect(() => {
    return () => {
      tableClickTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const toggleConnection = (connId: string) => {
    setExpandedConnections(prev => {
      const next = new Set(prev);
      if (connId === activeConnectionId && next.has(connId)) {
        next.delete(connId);
      } else {
        next.add(connId);
        onSelectConnection(connId);
      }
      return next;
    });
  };

  const toggleDb = (connId: string, db: string) => {
    const key = `${connId}/${db}`;
    setExpandedDbs(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        onExpandDatabase(connId, db);
      }
      return next;
    });
  };

  const toggleTable = (connId: string, db: string, table: string) => {
    const key = `${connId}/${db}/${table}`;
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        onExpandTable(connId, db, table);
      }
      return next;
    });
  };

  const handleTableClick = (connId: string, db: string, table: string) => {
    const key = `${connId}/${db}/${table}`;
    clearTimeout(tableClickTimers.current.get(key));

    const timer = setTimeout(() => {
      tableClickTimers.current.delete(key);
      toggleTable(connId, db, table);
    }, tableClickDelayMs);
    tableClickTimers.current.set(key, timer);
  };

  const handleTableDoubleClick = (connId: string, db: string, table: string) => {
    const key = `${connId}/${db}/${table}`;
    clearTimeout(tableClickTimers.current.get(key));
    tableClickTimers.current.delete(key);
    onDoubleClickTable(connId, db, table);
  };

  const getTables = (connId: string, db: string) => {
    return tables[`${connId}/${db}`] || [];
  };

  const getColumns = (connId: string, db: string, table: string) => {
    return columns[`${connId}/${db}/${table}`] || [];
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>连接管理</span>
        <button className="btn-icon" onClick={onAddConnection} title="新建连接" aria-label="新建连接"><PlusIcon size={14} /></button>
      </div>
      <div className="sidebar-tree">
        {connections.map(conn => (
          <div key={conn.id} className="tree-item">
            <div
              className={`tree-node connection-node ${activeConnectionId === conn.id ? 'active' : ''}`}
              onClick={() => toggleConnection(conn.id)}
            >
              <span className={`tree-icon chevron ${expandedConnections.has(conn.id) ? 'open' : ''}`}><ChevronIcon size={12} /></span>
              <span className="tree-icon kind-connection"><ServerIcon size={13} /></span>
              <span className="tree-label">{conn.name || conn.host}</span>
              <span className="tree-actions">
                <button className="btn-icon-small" onClick={e => { e.stopPropagation(); onEditConnection(conn); }} title="编辑" aria-label="编辑连接"><PencilIcon size={11} /></button>
                <button className="btn-icon-small danger" onClick={e => { e.stopPropagation(); onDeleteConnection(conn.id); }} title="删除" aria-label="删除连接"><TrashIcon size={11} /></button>
              </span>
            </div>
            {activeConnectionId === conn.id && expandedConnections.has(conn.id) && (databases[conn.id] || []).map(db => (
              <div key={db} className="tree-item nested">
                <div className="tree-node" onClick={() => toggleDb(conn.id, db)}>
                  <span className={`tree-icon chevron ${expandedDbs.has(`${conn.id}/${db}`) ? 'open' : ''}`}><ChevronIcon size={12} /></span>
                  <span className="tree-icon"><DatabaseIcon size={13} /></span>
                  <span className="tree-label">{db}</span>
                </div>
                {expandedDbs.has(`${conn.id}/${db}`) && getTables(conn.id, db).map(table => (
                  <div key={table} className="tree-item nested">
                    <div
                      className="tree-node"
                      onClick={() => handleTableClick(conn.id, db, table)}
                      onDoubleClick={() => handleTableDoubleClick(conn.id, db, table)}
                    >
                      <span className={`tree-icon chevron ${expandedTables.has(`${conn.id}/${db}/${table}`) ? 'open' : ''}`}><ChevronIcon size={12} /></span>
                      <span className="tree-icon"><TableIcon size={13} /></span>
                      <span className="tree-label">{table}</span>
                    </div>
                    {expandedTables.has(`${conn.id}/${db}/${table}`) && getColumns(conn.id, db, table).map((col: any) => (
                      <div key={col.name} className="tree-item nested">
                        <div className="tree-node column-node">
                          <span className={`tree-icon ${col.key === 'PRI' ? 'kind-key' : ''}`}>{col.key === 'PRI' ? <KeyIcon size={12} /> : <FieldIcon size={9} />}</span>
                          <span className="tree-label">{col.name}</span>
                          <span className="tree-type">{col.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        {connections.length === 0 && (
          <div className="empty-state">
            <div className="empty-illustration"><PlugIcon size={20} /></div>
            <p>暂无连接</p>
            <button className="btn-primary" onClick={onAddConnection}>新建连接</button>
          </div>
        )}
      </div>
    </div>
  );
}
