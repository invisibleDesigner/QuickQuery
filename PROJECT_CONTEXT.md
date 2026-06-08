# QuickQuery - 项目上下文

## 概述
轻量级数据库查询工具，对标 DBeaver/DataGrip，专注数据查询。

## 技术栈
- **后端**: Go + Wails v3
- **前端**: React + TypeScript
- **SQL 编辑器**: Monaco Editor
- **结果表格**: 原生 HTML 表格
- **数据库驱动**: go-sql-driver/mysql v1.8.1

## 架构
```
Wails 桌面应用
├── 前端 (React + TS)
│   ├── Sidebar (连接/数据库/表树形浏览)
│   ├── SQL Editor (Monaco)
│   └── Result Table (分页/排序)
└── 后端 (Go)
    ├── 连接管理
    ├── MySQL 查询
    └── 配置读写
```

## 配置存储
- 位置: `~/Library/Application Support/QuickQuery/connections.json` (macOS)
- Wails 自动处理跨平台路径

## 支持数据库
- MVP: MySQL only

## 项目结构
```
quickquery/
├── main.go
├── app.go               # Wails App 绑定方法
├── internal/
│   ├── database/        # MySQL 连接/查询
│   └── config/          # 连接信息读写
├── frontend/            # React 项目
│   └── src/
│       ├── components/
│       └── App.tsx
├── PROJECT_CONTEXT.md
└── TODO.md
```

## 当前状态
- 2026-06-02: 项目启动，MVP 开发中
- 2026-06-06: 升级到 Wails v3，移除 Wails v2 绑定与 AG Grid 展示依赖

## 后续迭代方向（非 MVP）
- PostgreSQL/SQLite 支持
- SQL 历史记录
- 查询结果导出 CSV
- 主题切换
- 快捷键优化
