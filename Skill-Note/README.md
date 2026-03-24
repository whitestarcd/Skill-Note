# Skill-Note

> **中文** | [English](#english-1)

一个结合**思维导图**和**Markdown 笔记**的知识管理工具，专注于封装和管理可复用的 Skill（技能/知识点）。

A knowledge management tool that combines **mind mapping** and **Markdown notes**, focused on encapsulating and managing reusable Skills (skills/knowledge points).

---

## 中文 / Chinese

### 特性

- 🗺️ **思维导图视图**: 可视化展示知识结构 (主题 → 分类 → Skill)
- 📝 **Markdown 编辑器**: 支持语法高亮、媒体插入
- 🎨 **双视图切换**: 思维导图/编辑器/分屏模式
- 💾 **本地存储**: IndexedDB 持久化，支持 JSON 导入导出
- 🌙 **暗色模式**: 支持亮色/暗色主题切换

### 技术栈

- React 18 + TypeScript
- Zustand (状态管理)
- CodeMirror 6 (Markdown 编辑)
- Tailwind CSS (样式)
- IndexedDB (数据存储)
- Vite (构建工具)
- Tauri (桌面端打包)

### 快速开始

#### 安装依赖

```bash
cd Skill-Note
npm install
```

#### 开发模式

```bash
npm run dev
# OR for desktop development with Tauri
npm run tauri dev
```

浏览器打开 http://localhost:3000

#### 构建生产版本

```bash
npm run build
```

### 打包为可分发 EXE (Windows)

本项目使用 Tauri 打包，当前配置目标是 `nsis` 安装包（可分发给其他人直接安装运行）。

#### 前置环境（仅打包机器需要）

1. Node.js 18+
2. Rust 工具链（`rustup`）
3. Windows C++ 编译工具（Visual Studio Build Tools，安装"使用 C++ 的桌面开发"）

安装 Rust（PowerShell）：

```powershell
winget install Rustlang.Rustup
```

安装 C++ Build Tools（PowerShell）：

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

#### 执行打包

在项目根目录执行：

```bash
npm install
npm run tauri build
```

#### 仅生成 EXE（不生成安装程序）

如果你只需要可执行文件（`skill-note.exe`），不需要 `*-setup.exe` 安装包：

```bash
npm install
npm run tauri build -- --no-bundle
```

生成的 EXE 默认在：

```text
src-tauri/target/release/skill-note.exe
```

#### 打包产物位置

默认生成在：

```text
src-tauri/target/release/bundle/nsis/
```

常见产物：

1. `*-setup.exe`：安装程序（推荐发给其他用户）
2. `*.exe`：可执行文件

#### 分发给其他人

1. 推荐直接分发 `*-setup.exe`。
2. 对方双击安装后即可运行，不需要安装 Node.js 或 Rust。
3. 如对方机器缺少 WebView2 Runtime，首次启动可能提示安装（Windows 11 通常已内置）。

#### 常见问题

1. 打包失败并提示找不到编译器：请确认已安装 Visual Studio Build Tools 的 C++ 组件。
2. 打包失败并提示缺少 Rust：重新打开终端后执行 `rustc -V` 验证 Rust 是否生效。
3. 修改应用版本号：同步更新 `package.json` 与 `src-tauri/tauri.conf.json` 中的 `version`。
4. 出现 `failed to bundle project 'timeout: global'`（下载 `nsis-3.11.zip` 超时）：

   这通常是网络访问 GitHub Release 超时。可通过"本机预装 NSIS"绕过下载步骤。

   **PowerShell（推荐）**：

   ```powershell
   winget install NSIS.NSIS --accept-source-agreements --accept-package-agreements
   $env:Path += ";C:\Program Files (x86)\NSIS"
   makensis /VERSION
   npm run tauri build
   ```

   如果你的网络需要代理，请先在终端设置代理后再执行打包。
   如果 `winget` 不可用，可改用 `choco install nsis -y`。

### 使用说明

#### 1. 创建主题

1. 点击顶部工具栏的"+ 新建主题"
2. 输入主题名称（如"数学"、"写作"、"编程"）

#### 2. 添加分类

1. 选择主题
2. 点击思维导图视图中的"+ 添加分类"
3. 输入分类名称和描述

#### 3. 添加 Skill

1. 点击"+ 添加 Skill"
2. 输入 Skill 名称和描述
3. 在思维导图中点击 Skill 节点进行编辑

#### 4. 编辑 Skill 内容

1. 在思维导图中点击 Skill 节点
2. 切换到"编辑器"视图
3. 使用 Markdown 编写内容
4. 支持插入图片、视频

#### 5. 导入导出

- **导出**: 点击顶部工具栏的"导出"按钮，下载 JSON 文件
- **导入**: 点击"导入"按钮，选择之前导出的 JSON 文件

### 数据结构

#### Topic (主题)
知识树的根节点，如"数学"、"写作"

#### Category (分类)
主题下的分组，有标题和描述

#### Skill (技能)
具体知识点，包含：
- 标题
- 描述
- 内容 (支持 Markdown/图片/视频)
- 标签

### 项目结构

```
Skill-Note/
├── src/
│   ├── components/       # UI 组件
│   │   ├── mindmap/      # 思维导图
│   │   ├── editor/       # Markdown 编辑器
│   │   ├── sidebar/      # 侧边栏
│   │   └── breadcrumb/   # 面包屑导航
│   ├── stores/           # 状态管理
│   ├── models/           # 数据模型
│   ├── services/         # 业务逻辑
│   └── hooks/            # 自定义 Hooks
└── ...
```

### 参考开源项目

| 功能 | 参考项目 |
|------|----------|
| 正交连线算法 | draw.io |
| Markdown 编辑 | Zettlr |
| 侧边栏导航 | Joplin |
| 面包屑导航 | Siyuan |

### 开发计划

- [ ] 节点拖拽调整位置
- [ ] 节点右键菜单（编辑/删除）
- [ ] 搜索功能
- [ ] 标签管理
- [ ] 导出为 Markdown/PDF
- [ ] 云同步支持

---

## English

### Features

- 🗺️ **Mind Map View**: Visualize knowledge structure (Topic → Category → Skill)
- 📝 **Markdown Editor**: Supports syntax highlighting, media insertion
- 🎨 **Dual View Switching**: Mind map / Editor / Split-screen mode
- 💾 **Local Storage**: IndexedDB persistence, supports JSON import/export
- 🌙 **Dark Mode**: Supports light/dark theme switching

### Tech Stack

- React 18 + TypeScript
- Zustand (State management)
- CodeMirror 6 (Markdown editing)
- Tailwind CSS (Styling)
- IndexedDB (Data storage)
- Vite (Build tool)
- Tauri (Desktop bundling)

### Quick Start

#### Install Dependencies

```bash
cd Skill-Note
npm install
```

#### Development Mode

```bash
npm run dev
# OR for desktop development with Tauri
npm run tauri dev
```

Open http://localhost:3000 in your browser.

#### Build for Production

```bash
npm run build
```

### Package as Distributable EXE (Windows)

This project uses Tauri for packaging, the current configuration target is `nsis` installer (can be distributed to others for direct installation and operation).

#### Prerequisites (only needed on the packaging machine)

1. Node.js 18+
2. Rust toolchain (`rustup`)
3. Windows C++ build tools (Visual Studio Build Tools, install "Desktop development with C++")

Install Rust (PowerShell):

```powershell
winget install Rustlang.Rustup
```

Install C++ Build Tools (PowerShell):

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

#### Execute Packaging

Run in the project root directory:

```bash
npm install
npm run tauri build
```

#### Build EXE Only (No Installer)

If you only need a portable executable (`skill-note.exe`) and do not want the `*-setup.exe` installer:

```bash
npm install
npm run tauri build -- --no-bundle
```

The EXE is generated at:

```text
src-tauri/target/release/skill-note.exe
```

#### Output Location

By default generated at:

```text
src-tauri/target/release/bundle/nsis/
```

Common outputs:

1. `*-setup.exe`: Installer (recommended for distribution)
2. `*.exe`: Portable executable

#### Distribution

1. It is recommended to distribute the `*-setup.exe` directly.
2. The other user can double-click to install and run, no need to install Node.js or Rust.
3. If the target machine lacks WebView2 Runtime, the first launch may prompt for installation (usually built-in on Windows 11).

### FAQ

1. Packaging failed with "compiler not found": Please confirm you have installed the C++ component of Visual Studio Build Tools.
2. Packaging failed with "Rust not found": Reopen terminal and run `rustc -V` to verify Rust is working.
3. Change app version: Sync update `version` in `package.json` and `src-tauri/tauri.conf.json`.
4. `failed to bundle project 'timeout: global'` (timeout downloading `nsis-3.11.zip`):

   This is usually network timeout accessing GitHub Release. You can bypass the download step by pre-installing NSIS locally.

   **PowerShell (Recommended)**:

   ```powershell
   winget install NSIS.NSIS --accept-source-agreements --accept-package-agreements
   $env:Path += ";C:\Program Files (x86)\NSIS"
   makensis /VERSION
   npm run tauri build
   ```

   If your network requires a proxy, set the proxy in terminal before packaging.
   If `winget` is not available, you can use `choco install nsis -y` instead.

### Usage Guide

#### 1. Create a Topic

1. Click "+ New Topic" in the top toolbar
2. Enter the topic name (e.g., "Mathematics", "Writing", "Programming")

#### 2. Add a Category

1. Select a topic
2. Click "+ Add Category" in the mind map view
3. Enter the category name and description

#### 3. Add a Skill

1. Click "+ Add Skill"
2. Enter the Skill name and description
3. Click the Skill node in the mind map to edit

#### 4. Edit Skill Content

1. Click the Skill node in the mind map
2. Switch to the "Editor" view
3. Write content using Markdown
4. Supports inserting images and videos

#### 5. Import & Export

- **Export**: Click the "Export" button in the top toolbar, download the JSON file
- **Import**: Click the "Import" button, select the previously exported JSON file

### Data Structure

#### Topic
Root node of the knowledge tree, e.g., "Mathematics", "Writing"

#### Category
Grouping under a topic, has title and description

#### Skill
Concrete knowledge point, contains:
- Title
- Description
- Content (supports Markdown/images/videos)
- Tags

### Project Structure

```
Skill-Note/
├── src/
│   ├── components/       # UI Components
│   │   ├── mindmap/      # Mind Map
│   │   ├── editor/       # Markdown Editor
│   │   ├── sidebar/      # Sidebar
│   │   └── breadcrumb/   # Breadcrumb Navigation
│   ├── stores/           # State Management
│   ├── models/           # Data Models
│   ├── services/         # Business Logic
│   └── hooks/            # Custom Hooks
└── ...
```

### References to Open Source Projects

| Feature | Reference Project |
|---------|-------------------|
| Orthogonal connection algorithm | draw.io |
| Markdown editing | Zettlr |
| Sidebar navigation | Joplin |
| Breadcrumb navigation | Siyuan |

### Development Plan

- [ ] Node drag and drop to adjust position
- [ ] Node right-click menu (edit/delete)
- [ ] Search functionality
- [ ] Tag management
- [ ] Export to Markdown/PDF
- [ ] Cloud sync support

---

## License / 许可证

MIT
