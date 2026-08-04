import { useMemo } from 'react';
import { QueryResult } from '../types';
import { RowsIcon, ClockIcon, TerminalIcon, AlertIcon, CheckIcon } from './icons';

interface Props {
  result: QueryResult | null;
}

export default function ResultTable({ result }: Props) {
  const rowData = useMemo(() => {
    if (!result || !result.columns || !result.rows) return [];
    return result.rows.map((row, idx) => ({ idx: idx + 1, values: row }));
  }, [result]);

  if (!result) {
    return (
      <div className="result-empty">
        <div className="empty-illustration"><TerminalIcon size={20} /></div>
        执行查询后查看结果
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="result-error">
        <div className="result-error-panel">
          <div className="result-error-header"><AlertIcon size={14} />执行出错</div>
          <pre>{result.error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="result-table">
      <div className="result-info">
        <span className="info-chip"><RowsIcon size={12} /><strong>{result.rows?.length || 0}</strong>行</span>
        <span className="info-chip"><ClockIcon size={12} /><strong>{result.duration}</strong>ms</span>
      </div>
      {result.columns.length === 0 ? (
        <div className="result-empty">
          <div className="empty-illustration"><CheckIcon size={20} /></div>
          执行成功，没有可展示的结果集
        </div>
      ) : (
        <div className="plain-result-wrapper">
          <table className="plain-result-table">
            <thead>
              <tr>
                <th className="row-number">#</th>
                {result.columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowData.map(row => (
                <tr key={row.idx}>
                  <td className="row-number">{row.idx}</td>
                  {result.columns.map((col, index) => (
                    <td key={`${row.idx}-${col}`}>{row.values[index] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
