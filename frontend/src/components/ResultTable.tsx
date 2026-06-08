import { useMemo } from 'react';
import { QueryResult } from '../types';

interface Props {
  result: QueryResult | null;
}

export default function ResultTable({ result }: Props) {
  const rowData = useMemo(() => {
    if (!result || !result.columns || !result.rows) return [];
    return result.rows.map((row, idx) => ({ idx: idx + 1, values: row }));
  }, [result]);

  if (!result) {
    return <div className="result-empty">执行查询后查看结果</div>;
  }

  if (result.error) {
    return (
      <div className="result-error">
        <pre>{result.error}</pre>
      </div>
    );
  }

  return (
    <div className="result-table">
      <div className="result-info">
        {result.rows?.length || 0} 行 · {result.duration}ms
      </div>
      {result.columns.length === 0 ? (
        <div className="result-empty">执行成功，没有可展示的结果集</div>
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
