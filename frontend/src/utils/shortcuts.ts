const STORAGE_KEY = 'quickquery.shortcuts';

export interface ShortcutDef {
  id: string;
  label: string;
  defaultKeys: string;
}

// All shortcuts in the app
export const SHORTCUT_DEFS: ShortcutDef[] = [
  { id: 'execute', label: '执行 SQL', defaultKeys: 'Cmd+Enter' },
];

export interface ShortcutsMap {
  [id: string]: string;
}

export function loadShortcuts(): ShortcutsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveShortcuts(map: ShortcutsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getShortcutKeys(id: string): string {
  const custom = loadShortcuts()[id];
  return custom || SHORTCUT_DEFS.find(d => d.id === id)?.defaultKeys || '';
}

export function resetShortcuts() {
  localStorage.removeItem(STORAGE_KEY);
}

// Parse shortcut string like "Cmd+Enter" into Monaco keybinding
export function parseMonacoKeybinding(keys: string): { ctrlCmd: boolean; keyCode: number } | null {
  const parts = keys.split('+').map(p => p.trim());
  const ctrlCmd = parts.some(p => p === 'Cmd' || p === 'Ctrl');
  const key = parts.find(p => p !== 'Cmd' && p !== 'Ctrl' && p !== 'Shift' && p !== 'Alt');

  const keyMap: Record<string, number> = {
    'Enter': 3, 'Tab': 2, 'Escape': 9, 'Space': 10,
    'A': 31, 'B': 32, 'C': 33, 'D': 34, 'E': 35, 'F': 36,
    'G': 37, 'H': 38, 'I': 39, 'J': 40, 'K': 41, 'L': 42,
    'M': 43, 'N': 44, 'O': 45, 'P': 46, 'Q': 47, 'R': 48,
    'S': 49, 'T': 50, 'U': 51, 'V': 52, 'W': 53, 'X': 54,
    'Y': 55, 'Z': 56,
    'F1': 59, 'F2': 60, 'F3': 61, 'F4': 62, 'F5': 63,
    'F6': 64, 'F7': 65, 'F8': 66, 'F9': 67, 'F10': 68,
    'F11': 69, 'F12': 70,
  };

  const keyCode = key ? keyMap[key] : undefined;
  if (keyCode === undefined) return null;
  return { ctrlCmd, keyCode };
}

// Format key for display (ensure Cmd on Mac)
export function formatDisplayKeys(keys: string): string {
  return keys.replace(/\bCtrl\b/g, '⌘').replace(/\bCmd\b/g, '⌘').replace(/\bShift\b/g, '⇧').replace(/\bAlt\b/g, '⌥').replace(/\+/g, ' ');
}
