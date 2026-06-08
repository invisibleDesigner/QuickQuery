package main

import (
	"fmt"
	"quickquery/internal/config"
	"quickquery/internal/database"

	"github.com/google/uuid"
)

type App struct {
	connections []config.Connection
}

func NewApp() *App {
	conns, _ := config.LoadConnections()
	return &App{connections: conns}
}

func (a *App) saveConnections() error {
	return config.SaveConnections(a.connections)
}

func (a *App) GetConnections() []config.Connection {
	return a.connections
}

func (a *App) AddConnection(conn config.Connection) error {
	if conn.ID == "" {
		conn.ID = uuid.New().String()
	}
	a.connections = append(a.connections, conn)
	return a.saveConnections()
}

func (a *App) UpdateConnection(conn config.Connection) error {
	for i, c := range a.connections {
		if c.ID == conn.ID {
			a.connections[i] = conn
			return a.saveConnections()
		}
	}
	return nil
}

func (a *App) DeleteConnection(id string) error {
	for i, c := range a.connections {
		if c.ID == id {
			a.connections = append(a.connections[:i], a.connections[i+1:]...)
			return a.saveConnections()
		}
	}
	return nil
}

func (a *App) TestConnection(conn config.Connection) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("连接错误：%v", r)
		}
	}()
	return database.TestConnection(conn)
}

func (a *App) ExecuteQuery(connID string, dbName string, sql string) (result *database.QueryResult) {
	defer func() {
		if r := recover(); r != nil {
			result = &database.QueryResult{Error: fmt.Sprintf("查询错误：%v", r)}
		}
	}()
	conn := a.findConnection(connID)
	if conn == nil {
		return &database.QueryResult{Error: "未找到连接"}
	}
	return database.ExecuteQuery(*conn, dbName, sql)
}

func (a *App) GetDatabases(connID string) (dbs []string) {
	defer func() {
		if r := recover(); r != nil {
			dbs = nil
		}
	}()
	conn := a.findConnection(connID)
	if conn == nil {
		return nil
	}
	dbs, _ = database.ListDatabases(*conn)
	return dbs
}

func (a *App) GetTables(connID string, dbName string) (tables []string) {
	defer func() {
		if r := recover(); r != nil {
			tables = nil
		}
	}()
	conn := a.findConnection(connID)
	if conn == nil {
		return nil
	}
	tables, _ = database.ListTables(*conn, dbName)
	return tables
}

func (a *App) GetColumns(connID string, dbName string, table string) (cols []database.ColumnInfo) {
	defer func() {
		if r := recover(); r != nil {
			cols = nil
		}
	}()
	conn := a.findConnection(connID)
	if conn == nil {
		return nil
	}
	cols, _ = database.ListColumns(*conn, dbName, table)
	return cols
}

func (a *App) findConnection(id string) *config.Connection {
	for _, c := range a.connections {
		if c.ID == id {
			return &c
		}
	}
	return nil
}
