# QuickQuery

<p align="center">
  <strong>轻量级 MySQL 查询桌面工具</strong>
</p>

<p align="center">
  基于 Go + Wails 3 + React + TypeScript 构建，Mac 原生体验
</p>

---

## ✨ 功能

- 🔌 **连接管理** — 管理 MySQL 连接，支持测试连接
- 🗂 **数据库浏览** — 树形结构浏览数据库、表、字段
- 📝 **SQL 编辑器** — Monaco Editor 驱动，支持语法高亮与自动补全
- 📊 **多 Tab 查询** — 同时打开多个查询标签页，独立 SQL 和结果
- 🎨 **主题切换** — 跟随系统 / 亮色 / 暗色，编辑器主题同步
- ↕️ **可调布局** — 侧边栏宽度、编辑器高度均可拖拽调整
- 💾 **工作区记忆** — 按连接记住数据库选择和 SQL 文本
- ⌨️ **快捷键管理** — 可查看和自定义快捷键

## 🖼 截图

> TODO: 添加截图

## 🔧 支持的数据库

| 数据库 | 版本 |
|--------|------|
| MySQL | 5.5+ |
| MySQL | 5.7 / 8.0 ✅ |
| MariaDB | 10.x（大概率支持） |

## 🚀 快速开始

### 前置要求

- Go 1.25+
- Node.js 18+
- Wails 3 CLI

### 安装 Wails 3

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### 运行开发模式

```bash
git clone https://github.com/invisibleDesigner/QuickQuery.git
cd QuickQuery
wails3 task dev
```

### 构建

```bash
wails3 build
```

## 🧪 测试

外部 MySQL 连接测试默认跳过，如需运行请配置环境变量：

```bash
export QUICKQUERY_TEST_MYSQL_HOST=127.0.0.1
export QUICKQUERY_TEST_MYSQL_PORT=3306
export QUICKQUERY_TEST_MYSQL_USER=root
export QUICKQUERY_TEST_MYSQL_PASSWORD=your-password
```

```bash
go test ./...
```

## ⚠️ 注意事项

- MySQL 驱动固定为 `go-sql-driver/mysql v1.8.1`，v1.10.x 在部分代理/跳板机场景下会触发兼容问题
- 当前基于 Wails v3 alpha 版本，API 可能变化
- macOS 首次打开可能需要右键 → 打开，或执行 `xattr -dr com.apple.quarantine QuickQuery.app`

## 📂 项目结构

```
├── main.go                  # 应用入口
├── app.go                   # Wails 服务绑定
├── internal/
│   ├── config/config.go     # 连接配置管理
│   └── database/mysql.go    # MySQL 查询与元数据
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # 主界面
│   │   ├── components/      # UI 组件
│   │   ├── types/           # TypeScript 类型
│   │   └── utils/           # 工具函数
│   └── bindings/            # Wails 3 自动生成的绑定
├── build/                   # 构建配置与资源
└── Taskfile.yml             # 任务定义
```

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Go, Wails v3 |
| 前端 | React, TypeScript |
| 编辑器 | Monaco Editor |
| 数据库 | go-sql-driver/mysql |
| 构建 | Wails 3, Vite, Taskfile |

## 📄 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源。
