import { useState } from 'react';
import { SHORTCUT_DEFS, loadShortcuts, saveShortcuts, formatDisplayKeys, resetShortcuts } from '../utils/shortcuts';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutDialog({ open, onClose }: Props) {
  const [shortcuts, setShortcuts] = useState(() => loadShortcuts());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKeys, setEditingKeys] = useState('');

  if (!open) return null;

  const getKeys = (id: string) => shortcuts[id] || SHORTCUT_DEFS.find(d => d.id === id)?.defaultKeys || '';

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setEditingKeys('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('Cmd');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const key = e.key;
    if (!['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
      // Normalize key name
      const keyMap: Record<string, string> = {
        ' ': 'Space',
      };
      parts.push(keyMap[key] || key.length === 1 ? key.toUpperCase() : key);
    }

    const combo = parts.join('+');
    setEditingKeys(combo);

    // Save on a full combo (modifier + key)
    if (parts.length >= 2 && !['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
      const next = { ...shortcuts, [editingId!]: combo };
      setShortcuts(next);
      saveShortcuts(next);
      setEditingId(null);
      setEditingKeys('');
    }
  };

  const handleReset = () => {
    resetShortcuts();
    setShortcuts({});
  };

  return (
    <div className="dialog-overlay" onClick={e => e.stopPropagation()}>
      <div className="dialog shortcut-dialog" onClick={e => e.stopPropagation()}>
        <h3>快捷键管理</h3>
        <div className="shortcut-list">
          {SHORTCUT_DEFS.map(def => (
            <div key={def.id} className="shortcut-row">
              <span className="shortcut-label">{def.label}</span>
              {editingId === def.id ? (
                <span
                  className="shortcut-key editing"
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  ref={el => el?.focus()}
                >
                  {editingKeys || '按下快捷键…'}
                </span>
              ) : (
                <span
                  className="shortcut-key"
                  onClick={() => handleStartEdit(def.id)}
                  title="点击修改"
                >
                  {formatDisplayKeys(getKeys(def.id))}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="dialog-actions">
          <button className="btn-secondary" onClick={handleReset}>恢复默认</button>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={onClose}>确定</button>
        </div>
      </div>
    </div>
  );
}
