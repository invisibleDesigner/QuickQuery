import { getExecutionSql } from '../src/utils/sqlExecution.js';

function assertEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const fullSql = 'SELECT * FROM users;\nSELECT * FROM orders;';
assertEqual(
  getExecutionSql('SELECT * FROM orders;', fullSql),
  'SELECT * FROM orders;',
  'executes the non-empty selection'
);
assertEqual(
  getExecutionSql(' \n ', fullSql),
  fullSql,
  'falls back to the complete editor content for a whitespace selection'
);
