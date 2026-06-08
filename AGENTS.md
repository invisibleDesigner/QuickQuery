# QuickQuery 开发规范

## 原则
- 最小代码解决问题，不做投机性抽象
- 只改必须改的，不顺手优化无关代码
- 每个改动都能追溯到具体需求

## 代码风格
- Go: 遵循 gofmt，错误处理不省略
- React: 函数组件 + hooks，TypeScript strict mode
- 命名：Go 用 camelCase/PascalCase，前端用 camelCase

## 目录约定
- `internal/` - Go 内部包，不对外暴露
- `frontend/src/components/` - React 组件
- `frontend/src/hooks/` - 自定义 hooks
- `frontend/src/types/` - TypeScript 类型定义

## 提交规范
- feat: 新功能
- fix: 修复
- refactor: 重构
- chore: 构建/工具链
