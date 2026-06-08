export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface QueryResult {
  columns: string[];
  rows: string[][];
  error: string;
  duration: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: string;
  extra: string;
}

export interface QueryTab {
  id: string;
  name: string;
  sql: string;
  database: string;
  result: QueryResult | null;
}
