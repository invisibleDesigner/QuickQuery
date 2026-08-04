package database

import (
	"database/sql"
	"fmt"
	"net"
	"os"
	"quickquery/internal/config"
	"strconv"
	"testing"

	_ "github.com/go-sql-driver/mysql"
)

type testMySQLConfig struct {
	host     string
	port     int
	user     string
	password string
}

func loadTestMySQLConfig(t *testing.T) testMySQLConfig {
	t.Helper()

	host := os.Getenv("QUICKQUERY_TEST_MYSQL_HOST")
	portText := os.Getenv("QUICKQUERY_TEST_MYSQL_PORT")
	user := os.Getenv("QUICKQUERY_TEST_MYSQL_USER")
	password := os.Getenv("QUICKQUERY_TEST_MYSQL_PASSWORD")

	if host == "" || portText == "" || user == "" || password == "" {
		t.Skip("未配置测试数据库环境变量，跳过外部 MySQL 连接测试")
	}

	port, err := strconv.Atoi(portText)
	if err != nil {
		t.Fatalf("QUICKQUERY_TEST_MYSQL_PORT 非法：%v", err)
	}

	return testMySQLConfig{host: host, port: port, user: user, password: password}
}

func TestRawTCP(t *testing.T) {
	cfg := loadTestMySQLConfig(t)
	addr := net.JoinHostPort(cfg.host, strconv.Itoa(cfg.port))
	t.Logf("Dialing TCP %s ...", addr)
	conn, err := net.DialTimeout("tcp", addr, 5e9)
	if err != nil {
		t.Fatalf("TCP dial failed: %v", err)
	}
	defer conn.Close()
	t.Log("TCP connected successfully")

	buf := make([]byte, 1024)
	n, err := conn.Read(buf)
	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}
	t.Logf("Received %d bytes from server", n)
	t.Logf("First 32 bytes (hex): %x", buf[:min(n, 32)])
	if n >= 4 {
		t.Logf("Packet length bytes: %d %d %d, sequence: %d", buf[0], buf[1], buf[2], buf[3])
	}
	if n >= 5 {
		t.Logf("Protocol version: %d", buf[4])
	}
}

func TestDSNIncludesShanghaiLocation(t *testing.T) {
	conn := config.Connection{
		Host:     "db.example.com",
		Port:     3306,
		User:     "alice",
		Password: "secret",
		Database: "analytics",
	}

	const want = "alice:secret@tcp(db.example.com:3306)/analytics?parseTime=true&loc=Asia%2FShanghai&charset=utf8mb4&timeout=5s&readTimeout=10s&writeTimeout=10s"
	if got := dsn(conn); got != want {
		t.Errorf("dsn() = %q, want %q", got, want)
	}
}

func TestDSNVariants(t *testing.T) {
	cfg := loadTestMySQLConfig(t)
	variants := []struct {
		name string
		dsn  string
	}{
		{
			"basic",
			fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s&readTimeout=5s&writeTimeout=5s",
				cfg.user, cfg.password, cfg.host, cfg.port),
		},
		{
			"no-tls",
			fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s&readTimeout=5s&writeTimeout=5s&tls=false",
				cfg.user, cfg.password, cfg.host, cfg.port),
		},
		{
			"allowNativePasswords",
			fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s&readTimeout=5s&writeTimeout=5s&allowNativePasswords=true",
				cfg.user, cfg.password, cfg.host, cfg.port),
		},
		{
			"allowOldPasswords",
			fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s&readTimeout=5s&writeTimeout=5s&allowOldPasswords=true",
				cfg.user, cfg.password, cfg.host, cfg.port),
		},
		{
			"charset-utf8",
			fmt.Sprintf("%s:%s@tcp(%s:%d)/?timeout=5s&readTimeout=5s&writeTimeout=5s&charset=utf8",
				cfg.user, cfg.password, cfg.host, cfg.port),
		},
	}

	for _, v := range variants {
		t.Run(v.name, func(t *testing.T) {
			db, err := sql.Open("mysql", v.dsn)
			if err != nil {
				t.Fatalf("sql.Open failed: %v", err)
			}
			defer db.Close()

			err = db.Ping()
			if err != nil {
				t.Errorf("Ping failed: %v", err)
			} else {
				t.Log("Ping succeeded!")
			}
		})
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
