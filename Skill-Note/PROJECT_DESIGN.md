# Skill-Note 项目设计文档

## 项目概述

Skill-Note 是一个结合**思维导图**和**Markdown 笔记**的知识管理工具，专注于封装和管理可复用的 Skill（技能/知识点）。

## 核心概念

| 概念 | 说明 |
|------|------|
| **主题 (Topic)** | 知识树的根节点，如"数学"、"写作"、"编程" |
| **分类 (Category)** | 主题下的分组，有标题和描述 |
| **Skill** | 具体知识点，有标题、描述、内容（支持 Markdown/图片/视频） |

## 技术栈

- **框架**: React 18 + TypeScript
- **状态管理**: Zustand (轻量级，比 Redux 简单)
- **样式**: Tailwind CSS + CSS Modules
- **Markdown 编辑**: CodeMirror 6 (参考 Zettlr 实现)
- **思维导图**: 自研最简实现 (参考 draw.io 连线算法)
- **构建工具**: Vite
- **数据存储**: IndexedDB + 本地 JSON 导出

## 项目结构

```
Skill-Note/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
│
├── src/
│   ├── main.tsx              # 入口
│   ├── App.tsx               # 根组件
│   │
│   ├── components/           # UI 组件
│   │   ├── mindmap/          # 思维导图组件
│   │   │   ├── MindMap.tsx           # 主组件
│   │   │   ├── MindMapNode.tsx       # 节点组件
│   │   │   ├── MindMapEdge.tsx       # 连线组件 (参考 draw.io orthogonal router)
│   │   │   └── MindMapToolbar.tsx    # 工具栏
│   │   │
│   │   ├── editor/           # Markdown 编辑器
│   │   │   ├── MarkdownEditor.tsx    # 编辑器主组件 (参考 Zettlr CodeMirror)
│   │   │   ├── EditorToolbar.tsx     # 编辑器工具栏
│   │   │   └── MediaUploader.tsx     # 图片/视频上传
│   │   │
│   │   ├── sidebar/          # 侧边栏
│   │   │   ├── SkillTree.tsx         # Skill 树形列表 (参考 Joplin sidebar)
│   │   │   └── SkillCard.tsx         # Skill 卡片预览
│   │   │
│   │   ├── breadcrumb/       # 面包屑导航 (参考 Siyuan breadcrumb)
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   └── common/           # 通用组件
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── Dropdown.tsx
│   │
│   ├── stores/               # 状态管理
│   │   ├── skillStore.ts     # Skill 数据状态
│   │   └── uiStore.ts        # UI 状态
│   │
│   ├── models/               # 数据模型
│   │   ├── Skill.ts          # Skill 数据模型
│   │   ├── Category.ts       # 分类数据模型
│   │   └── Topic.ts          # 主题数据模型
│   │
│   ├── services/             # 业务逻辑
│   │   ├── storage.ts        # 存储 (IndexedDB/LocalStorage)
│   │   ├── export.ts         # 导出 JSON/Markdown
│   │   └── import.ts         # 导入 JSON/Markdown
│   │
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useMindMap.ts     # 思维导图逻辑
│   │   └── useEditor.ts      # 编辑器逻辑
│   │
│   └── styles/               # 样式
│       ├── globals.css
│       └── variables.css
│
└── public/
    └── icons/
```

## 数据模型

### Topic (主题)
```typescript
interface Topic {
  id: string;           // UUID
  title: string;        // 主题名称
  description: string;  // 描述
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
  categoryIds: string[]; // 子分类 ID 列表
}
```

### Category (分类)
```typescript
interface Category {
  id: string;           // UUID
  topicId: string;      // 所属主题 ID
  title: string;        // 分类标题
  description: string;  // 分类描述
  skillIds: string[];   // 子 Skill ID 列表
  createdAt: number;
  updatedAt: number;
}
```

### Skill (技能)
```typescript
interface Skill {
  id: string;           // UUID
  categoryId: string;   // 所属分类 ID
  title: string;        // Skill 标题
  description: string;  // Skill 描述 (简短概述)
  content: SkillContent; // 详细内容
  tags: string[];       // 标签
  createdAt: number;
  updatedAt: number;
}

interface SkillContent {
  type: 'markdown' | 'image' | 'video';
  data: string;  // Markdown 文本或媒体 URL
}
```

## 核心功能模块

### 1. 思维导图视图 (MindMap View)

**参考组件**: draw.io `orthogonal-edge-router` (正交连线算法)

**功能**:
- 显示 Topic → Category → Skill 树形结构
- 支持拖拽节点调整位置
- 支持点击节点编辑
- 支持添加/删除节点
- 自动正交连线 (直角边，美观)

**最简实现**:
- 只支持矩形节点 (3 种样式：主题/分类/Skill)
- 正交连线 (使用 draw.io 的 elbow connector 算法简化版)
- 不支持复杂图形、箭头样式等

### 2. Markdown 编辑器视图 (Editor View)

**参考组件**: Zettlr `CodeMirrorEditor`

**功能**:
- Markdown 编辑
- 实时预览
- 图片/视频上传和嵌入
- 语法高亮

**最简实现**:
- 基于 CodeMirror 6
- 只保留核心编辑功能
- 使用简单主题

### 3. 视图切换

**功能**:
- 思维导图 ↔ Markdown 列表 切换
- 左侧树形导航 ↔ 右侧内容区

### 4. Skill 管理

**功能**:
- 新建 Skill (在思维导图中添加节点)
- 编辑 Skill (点击节点打开编辑器)
- 删除 Skill
- 导入 Skill (JSON/Markdown)
- 导出 Skill (JSON/Markdown)

**使用闭环**:
- 新建 → 编辑 → 保存 → 查看 → 导出/分享

## UI 设计

### 布局
```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: 主题选择 | 视图切换 | 导入/导出 | 设置            │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │              Main Content Area                   │
│          │                                                  │
│ Skill    │   ┌─────────────────────────────────────┐        │
│ Tree     │   │                                     │        │
│          │   │     MindMap Canvas / Editor         │        │
│          │   │                                     │        │
│          │   └─────────────────────────────────────┘        │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  Breadcrumb: 主题 > 分类 > Skill                            │
└─────────────────────────────────────────────────────────────┘
```

### 节点样式
| 类型 | 颜色 | 图标 | 尺寸 |
|------|------|------|------|
| 主题 | 蓝色 | 📚 | 大 |
| 分类 | 绿色 | 📁 | 中 |
| Skill | 灰色 | ⭐ | 小 |

## 存储方案

### 开发/调试
- LocalStorage (简单，便于调试)

### 生产
- IndexedDB (支持大数据量)
- 支持导出 JSON 备份

### 数据格式
```json
{
  "topics": [...],
  "categories": [...],
  "skills": [...],
  "version": "1.0"
}
```

## 开发计划

### Phase 1: 基础框架 (1-2 天)
- [ ] 项目初始化和配置
- [ ] 数据模型定义
- [ ] 状态管理设置
- [ ] 基础 UI 组件

### Phase 2: 核心功能 (3-4 天)
- [ ] 思维导图组件 (节点 + 连线)
- [ ] Markdown 编辑器
- [ ] 视图切换
- [ ] Skill CRUD

### Phase 3: 完善功能 (2-3 天)
- [ ] 导入/导出
- [ ] 搜索/过滤
- [ ] 样式优化
- [ ] 测试和调试

## 参考开源实现

| 功能 | 参考项目 | 组件 |
|------|----------|------|
| 正交连线 | draw.io | `orthogonal-edge-router` |
| Markdown 编辑 | Zettlr | `CodeMirrorEditor` |
| 侧边栏导航 | Joplin | `ConfigSidebar` |
| 面包屑 | Siyuan | `Breadcrumb` |

## 最简原则

1. **不做复杂图形** - 只支持矩形节点
2. **不做协同编辑** - 单机版本
3. **不做云端同步** - 本地存储 + 导出
4. **不做插件系统** - 核心功能优先
5. **不做移动端** - 桌面 Web 优先
