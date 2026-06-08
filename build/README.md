# Build 目录

该目录保存 Wails 3 构建所需的任务和平台资源。

- `config.yml`：Wails 3 项目构建配置
- `Taskfile.yml`：通用构建任务
- `darwin/`：macOS 构建资源和任务
- `windows/`：Windows 构建资源和任务
- `linux/`：Linux 构建任务
- `ios/` / `android/`：Wails 3 模板附带的移动端任务
- `appicon.png`：应用图标源文件

常用命令：

```bash
wails3 task dev
wails3 build
```
