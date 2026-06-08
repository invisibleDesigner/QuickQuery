package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
)

type Connection struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	Database string `json:"database"`
}

func configDir() string {
	var dir string
	switch runtime.GOOS {
	case "darwin":
		home, _ := os.UserHomeDir()
		dir = filepath.Join(home, "Library", "Application Support", "QuickQuery")
	case "windows":
		dir = filepath.Join(os.Getenv("APPDATA"), "QuickQuery")
	default:
		home, _ := os.UserHomeDir()
		dir = filepath.Join(home, ".config", "quickquery")
	}
	return dir
}

func configPath() string {
	return filepath.Join(configDir(), "connections.json")
}

func LoadConnections() ([]Connection, error) {
	data, err := os.ReadFile(configPath())
	if err != nil {
		if os.IsNotExist(err) {
			return []Connection{}, nil
		}
		return nil, err
	}
	var conns []Connection
	if err := json.Unmarshal(data, &conns); err != nil {
		return nil, err
	}
	return conns, nil
}

func SaveConnections(conns []Connection) error {
	dir := configDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(conns, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(configPath(), data, 0644)
}
