package database

import (
	"database/sql"
	"fmt"
	"quickquery/internal/config"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type QueryResult struct {
	Columns  []string   `json:"columns"`
	Rows     [][]string `json:"rows"`
	Error    string     `json:"error"`
	Duration int64      `json:"duration"` // milliseconds
}

type ColumnInfo struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Nullable string `json:"nullable"`
	Key      string `json:"key"`
	Default  string `json:"default"`
	Extra    string `json:"extra"`
}

func dsn(conn config.Connection) string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&charset=utf8mb4&timeout=5s&readTimeout=10s&writeTimeout=10s",
		conn.User, conn.Password, conn.Host, conn.Port, conn.Database)
}

func TestConnection(conn config.Connection) error {
	db, err := sql.Open("mysql", dsn(conn))
	if err != nil {
		return err
	}
	defer db.Close()
	return db.Ping()
}

func ListDatabases(conn config.Connection) ([]string, error) {
	db, err := sql.Open("mysql", dsn(conn))
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SHOW DATABASES")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var databases []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		databases = append(databases, name)
	}
	return databases, nil
}

func ListTables(conn config.Connection, database string) ([]string, error) {
	c := conn
	c.Database = database
	db, err := sql.Open("mysql", dsn(c))
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SHOW TABLES")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		tables = append(tables, name)
	}
	return tables, nil
}

func ListColumns(conn config.Connection, database, table string) ([]ColumnInfo, error) {
	c := conn
	c.Database = database
	db, err := sql.Open("mysql", dsn(c))
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SHOW COLUMNS FROM `" + table + "`")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var col ColumnInfo
		var def sql.NullString
		if err := rows.Scan(&col.Name, &col.Type, &col.Nullable, &col.Key, &def, &col.Extra); err != nil {
			return nil, err
		}
		if def.Valid {
			col.Default = def.String
		}
		columns = append(columns, col)
	}
	return columns, nil
}

func ExecuteQuery(conn config.Connection, database string, query string) *QueryResult {
	if database != "" {
		conn.Database = database
	}

	start := time.Now()
	db, err := sql.Open("mysql", dsn(conn))
	if err != nil {
		return &QueryResult{Error: err.Error()}
	}
	defer db.Close()

	rows, err := db.Query(query)
	if err != nil {
		return &QueryResult{Error: err.Error()}
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return &QueryResult{Error: err.Error()}
	}

	var resultRows [][]string
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			return &QueryResult{Error: err.Error()}
		}
		var row []string
		for _, v := range values {
			switch value := v.(type) {
			case nil:
				row = append(row, "NULL")
			case []byte:
				row = append(row, string(value))
			default:
				row = append(row, fmt.Sprintf("%v", value))
			}
		}
		resultRows = append(resultRows, row)
	}

	duration := time.Since(start).Milliseconds()

	return &QueryResult{
		Columns:  columns,
		Rows:     resultRows,
		Duration: duration,
	}
}
