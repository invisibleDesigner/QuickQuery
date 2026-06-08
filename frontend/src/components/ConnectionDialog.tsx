import { useState, useEffect } from 'react';
import { Connection } from '../types';

interface Props {
  open: boolean;
  connection: Connection | null;
  onSave: (conn: Connection) => void;
  onClose: () => void;
  onTest: (conn: Connection) => Promise<string>;
}

const empty: Connection = {
  id: '',
  name: '',
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: '',
};

export default function ConnectionDialog({ open, connection, onSave, onClose, onTest }: Props) {
  const [form, setForm] = useState<Connection>(connection || { ...empty });
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    setForm(connection || { ...empty });
    setTestResult('');
  }, [connection, open]);

  if (!open) return null;

  const update = (field: keyof Connection, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTest = async () => {
    setTestResult('测试中...');
    try {
      const result = await onTest(form);
      setTestResult(result);
    } catch (err) {
      setTestResult(`错误：${err}`);
    }
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={e => e.stopPropagation()}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h3>{connection ? '编辑连接' : '新建连接'}</h3>
        <div className="form-group">
          <label>名称</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="我的数据库" />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 3 }}>
            <label>主机</label>
            <input value={form.host} onChange={e => update('host', e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>端口</label>
            <input type="number" value={form.port} onChange={e => update('port', parseInt(e.target.value) || 3306)} />
          </div>
        </div>
        <div className="form-group">
          <label>用户名</label>
          <input value={form.user} onChange={e => update('user', e.target.value)} />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} />
        </div>
        <div className="form-group">
          <label>数据库（可选）</label>
          <input value={form.database} onChange={e => update('database', e.target.value)} placeholder="留空可查看全部数据库" />
        </div>
        {testResult && (
          <div className={`test-result ${testResult === '连接成功' ? 'success' : 'error'}`}>
            {testResult}
          </div>
        )}
        <div className="dialog-actions">
          <button className="btn-secondary" onClick={handleTest}>测试连接</button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
