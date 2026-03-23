---
name: opensource-component-extractor
description: 从开源项目中提取和分解功能、UI组件、数据结构，记录每个模块的代码位置和功能标签。支持根据用户的功能需求在已分析的项目中快速匹配查找已有实现。用于收集可复用的开源组件构建笔记系统。使用当需要阅读开源代码、分析项目结构、提取可复用组件，或根据需求查找已有实现时。
allowed-tools: Read, Grep, Glob, Bash, Task, Write, Edit
user-invocable: true
---

# OpenSource Component Extractor

从开源项目中系统性提取可复用的功能、UI组件、数据结构、交互特性，并生成带代码位置引用和功能标签的模块化文档库。支持根据用户功能需求快速匹配查找已提取的实现。

## Overview

这个 Skill 指导你（Agent）完成两种工作流：

### A. 新项目分析工作流（首次分析）
1. 探索开源项目目录结构，理解项目整体架构
2. 识别并分解出独立模块，分类为：功能组件、UI组件、数据结构、工具函数、交互特性
3. 对每个模块进行描述，添加**功能关键词标签**，记录职责、依赖、代码位置
4. 生成模块化文档和可搜索索引

### B. 需求匹配工作流（已有分析文档）
当用户给出具体功能需求时：
1. 读取已生成的索引和所有模块文档
2. 根据用户功能描述，语义匹配查找相关模块
3. 返回匹配结果，说明哪些需求已经有实现，代码位置在哪里
4. 评估该实现满足需求的程度，需要多大修改才能复用

## When to use

### Use for:
- 分析开源笔记项目，提取可复用组件
- 构建笔记系统时，从多个开源项目收集参考实现
- 用户给出具体功能需求，查找开源项目中是否已有类似实现
- 学习开源项目，记录各个功能模块的位置和实现方式

### 两种使用场景：

**场景1 - 新项目分析**:
> "帮我分析这个开源笔记项目，提取所有可复用组件"

**场景2 - 需求匹配**:
> "我需要实现一个'鼠标悬停链接预览卡片'功能，帮我看看这个开源项目里有没有类似实现"

## Instructions

### Workflow A: 新项目分析

#### Step 1: 初始化输出目录

创建以下目录结构：
```
{output-dir}/
├── index.md           # 项目总索引 + 功能标签索引
├── architecture.md    # 整体架构分析
├── components/        # 功能组件文档
├── ui-components/     # UI 组件文档  <-- 新增单独目录
├── data-structures/   # 数据结构文档
├── interaction/       # 交互特性文档  <-- 新增：小功能、特殊交互
└── utils/             # 工具函数文档
```

#### Step 2: 探索项目结构

1. **获取项目信息**:
   - 读取 README.md 了解项目功能
   - 查看配置文件了解依赖和入口
   - 识别项目使用的技术栈

2. **绘制目录树**:
   ```bash
   find . -name "node_modules" -prune -o -name ".git" -prune -o -name "target" -prune -o -name "build" -prune -o -name "dist" -prune -o -print | sort
   ```

3. **识别语言和代码分布**，确认分析范围。

#### Step 3: 架构分析

在 `architecture.md` 记录：
- 项目整体架构模式
- 主要目录职责划分
- 入口文件位置
- 核心依赖关系
- 数据流概述
- Mermaid 高层架构图

#### Step 4: 模块分类识别

系统性扫描源代码，按以下分类识别可提取模块：

| 分类 | 目录 | 包含内容 |
|------|------|----------|
| 功能组件 | `components/` | 独立业务功能模块，如认证、存储、同步、搜索、导出等 |
| UI 组件 | `ui-components/` | 可复用的界面组件，如编辑器、侧边栏、工具栏、弹窗、菜单等 |
| 数据结构 | `data-structures/` | 核心数据模型、状态结构、配置结构等 |
| 交互特性 | `interaction/` | **特色交互功能和小功能**，如：悬停预览、双向链接、拖放、画布等 |
| 工具函数 | `utils/` | 工具库、辅助函数、格式化、验证等 |

**必须提取**：所有独立可复用的 UI 组件，例如：编辑器、侧边栏、工具栏、导航菜单、弹窗、列表、表格、搜索框、预览卡片等等。任何用户可见的独立界面组件都应该提取到 `ui-components/` 目录。

**需要特别关注的交互特性例子**:
- 双向链接 / 反向链接功能
- 悬停预览（链接预览、图片预览）
- 拖放排序 / 拖放上传
- 画布 / 自由拖拽布局
- 图片嵌入 / 卡片展示
- 内部链接跳转
- 快捷键支持
- 暗色/亮色主题切换
- 搜索高亮 / 模糊搜索
- 实时预览
- Markdown 扩展语法

这些 UI 组件和小功能虽然代码量不大，但往往是笔记系统的关键特性，都需要单独提取记录。

#### Step 5: 模块文档模板

对每个识别出的模块，创建独立 markdown 文件：

```markdown
---
title: 模块显示名称
category: component | ui-component | data-structure | interaction | util
tags: [keyword1, keyword2, keyword3]
file-path: path/to/file.rs
line-range: 32-156
standalone: yes/no
---

# {{title}}

**分类**: {{category}}
**文件位置**: `{{file-path}}:{{line-range}}`
**功能标签**: {{#tags}}`{{.}}` {{/tags}}
**依赖**: 列出依赖的其他内部模块
**可独立抽取**: {{standalone}}

## 功能描述

这个模块实现了什么功能？解决什么问题？

请用用户能理解的功能语言描述，而不仅仅是技术描述。例如：
> "实现了鼠标悬停在内部链接上时，弹出卡片显示链接内容预览"

而不是：
> "处理 hover 事件，渲染 tooltip 组件"

## 交互特性（如适用）

如果是 UI 或交互模块，描述交互方式：
- 用户如何触发这个功能
- 有什么视觉反馈
- 支持哪些操作

## 数据结构（如适用）

描述核心字段定义：
```ts
interface Note {
  id: string;
  title: string;
  content: string;
  // ...
}
```

## 公共API / 导出

列出所有导出的函数、方法、类型：
- `function_name(params: Type) -> ReturnType`: 功能描述

## 核心实现逻辑

简述关键实现思路和算法。

## 使用示例

从项目中复制实际使用代码示例。

## 可复用性评估

- 满足需求程度：完全满足 / 部分满足
- 需要修改工作量：小 / 中 / 大
- 需要调整的依赖：列出需要适配的部分

## 备注

抽取使用时需要注意的事项。
```

**关键点**:
- 必须添加**功能关键词标签**，方便后续搜索匹配
- 描述要用功能语言，方便根据需求检索
- 精确记录文件路径和行号范围

#### Step 6: 构建索引

在 `index.md` 中记录：

```markdown
---
project: 项目名称
source: https://github.com/xxx/xxx
analysis-date: YYYY-MM-DD
tags: [note-app, markdown, editor, rust, react]
---

# Project: {{project}}

- 源地址: {{source}}
- 分析日期: {{analysis-date}}
- 项目标签: {{#tags}}`{{.}}` {{/tags}}

## 架构概览

参见 [architecture.md](./architecture.md)

## 功能标签索引

按功能标签浏览：

#tags-here

## 提取的模块

### 功能组件

- [组件名](./components/xxx.md) - 简短功能描述 | 标签: tag1, tag2
- ...

### UI 组件

- [组件名](./ui-components/xxx.md) - 简短功能描述 | 标签: tag1, tag2
- ...

### 交互特性

- [特性名](./interaction/xxx.md) - 简短功能描述 | 标签: tag1, tag2
- ...

### 数据结构

- [结构名](./data-structures/xxx.md) - 简短功能描述 | 标签: tag1, tag2
- ...

### 工具函数

- [工具名](./utils/xxx.md) - 简短功能描述 | 标签: tag1, tag2
- ...
```

**重要**: 在 `index.md` 中构建标签索引，将所有模块按标签分组，方便快速检索。

---

### Workflow B: 需求匹配工作流

当用户给出具体功能需求，要求查找是否已有实现时：

#### Step 1: 加载已有分析

1. 读取 `index.md` 获取所有已提取模块列表
2. 如果需要，读取所有模块文档获取详细信息

#### Step 2: 语义匹配

根据用户的功能描述，匹配查找相关模块：
- 从需求中提取关键词（如 "悬停", "预览", "链接", "卡片"）
- 匹配模块文档的标签和功能描述
- 按匹配度排序

#### Step 3: 输出匹配结果

以清晰格式报告匹配结果：

```
## 匹配结果

找到了 {{n}} 个相关模块：

### 1. [模块名](path/to/module.md) - **匹配度: 高/中/低**

**功能描述**: {{模块的功能描述}}
**代码位置**: `{{file path}}:{{line range}}`
**标签**: {{tags}}

**评估**:
- 满足需求程度: xxx
- 可复用性: 直接复用 / 需要少量修改 / 需要较大重构
- 依赖: xxx

---
```

#### Step 4: 总结建议

- 如果找到匹配：总结哪些部分可以直接复用，需要做哪些调整
- 如果没找到匹配：明确说明没有找到直接匹配的实现，是否需要扩大搜索范围

---

## Best Practices

### 提取时：

1. **独立文件**: 每个模块单独一个文件，便于检索
2. **功能标签**: 必须添加功能关键词标签，这是后续搜索的基础
3. **精确位置**: 总是记录 `文件路径:行号范围`
4. **功能描述**: 用用户需求语言描述功能，不是技术描述
5. **分类正确**: **必须**正确分类：所有独立可复用 UI 组件放 `ui-components/`，交互小功能放 `interaction/`，核心功能放 `components/`
6. **诚实评估**: 如实报告可复用性和依赖程度
7. **更新索引**: 添加新模块后必须更新 `index.md`

**特别提醒**: 不要遗漏 UI 组件，任何独立可复用的界面组件（编辑器、侧边栏、工具栏、弹窗、菜单、预览卡片等）都必须提取到 `ui-components/` 目录。

### 匹配时：

1. **先看索引**: 先通过索引快速过滤，再读取详细文档
2. **宽松匹配**: 语义相近也算匹配，不要太严格
3. **报告所有**: 列出所有相关匹配，让用户选择
4. **明确评估**: 如实说明匹配度和修改工作量
5. **给出建议**: 告诉用户这个实现是否适合复用

## 模块文档示例

### 示例: 悬停链接预览交互

````markdown
---
title: HoverLinkPreview
category: interaction
tags: [hover, preview, link, tooltip, card]
file-path: src/components/hover-preview.tsx
line-range: 1-145
standalone: yes
---

# HoverLinkPreview

**分类**: interaction
**文件位置**: `src/components/hover-preview.tsx:1-145`
**功能标签**: `hover` `preview` `link` `tooltip` `card`
**依赖**: 依赖 Tooltip 组件、NoteCache
**可独立抽取**: yes

## 功能描述

当用户鼠标悬停在内部笔记链接上时，弹出一个悬浮卡片，预览链接笔记的内容摘要。支持预览图片、标题和前几行内容。

## 交互特性

- 鼠标静止悬停 300ms 后触发预览
- 点击链接跳转打开笔记
- 预览卡片跟随鼠标位置调整，防止超出视口
- 图片直接在卡片中展示缩略图

## 公共API

```tsx
<HoverLinkPreview
  href="/notes/123"
  title="Note Title"
>
  {children}
</HoverLinkPreview>
```

## 核心实现逻辑

1. 使用 React custom hook 监听鼠标进入/离开事件
2. 防抖 300ms 后触发数据加载
3. 从缓存获取笔记元数据和内容摘要
4. 计算卡片位置，避免超出视口边界
5. 渲染预览卡片

## 使用示例

```tsx
<Link>
  <HoverLinkPreview href={note.path}>
    {note.title}
  </HoverLinkPreview>
</Link>
```

## 可复用性评估

- 满足需求程度: 完全满足悬停预览需求
- 需要修改工作量: 小
- 需要调整的依赖: 需要适配你的项目的缓存和路由

## 备注

样式使用了 Tailwind CSS，需要适配你的样式系统。
````

### 示例: 双向链接数据结构

````markdown
---
title: BacklinkIndex
category: data-structure
tags: [bidirectional-link, backlink, index, graph]
file-path: src/services/backlink-index.ts
line-range: 45-120
standalone: yes
---

# BacklinkIndex

**分类**: data-structure
**文件位置**: `src/services/backlink-index.ts:45-120`
**功能标签**: `bidirectional-link` `backlink` `index` `graph`
**依赖**: 依赖 Note 模型
**可独立抽取**: yes

## 功能描述

维护反向链接索引，记录每个笔记被哪些其他笔记引用。支持查询一个笔记的所有反向链接，用于构建关系图和侧边栏反向链接列表。

## 数据结构

```ts
class BacklinkIndex {
  // 映射: noteId -> Set of noteIds that link to this note
  private index: Map<string, Set<string>>;

  // 添加链接关系
  addLink(from: string, to: string): void;

  // 获取指向 target 的所有反向链接
  getBacklinks(target: string): string[];

  // 重新构建整个索引
  rebuild(allNotes: Note[]): void;
}
```

## 核心实现逻辑

解析每个笔记的内容，找到所有 [[wikilink]] 格式的内部链接，建立反向索引映射。索引在启动时全量构建，保存到内存。

## 可复用性评估

- 满足需求程度: 完全满足双向链接反向索引需求
- 需要修改工作量: 小
- 需要调整的依赖: 只需要适配 Note 类型定义
````

### 示例: 索引中的标签索引

```markdown
## 功能标签索引

### 链接相关

- `bidirectional-link` - [BacklinkIndex](./data-structures/backlink-index.md)
- `backlink` - [BacklinkIndex](./data-structures/backlink-index.md)
- `link-preview` - [HoverLinkPreview](./interaction/hover-link-preview.md)
- `hover` - [HoverLinkPreview](./interaction/hover-link-preview.md)

### 预览相关

- `preview` - [HoverLinkPreview](./interaction/hover-link-preview.md)
- `tooltip` - [HoverLinkPreview](./interaction/hover-link-preview.md)

### UI 组件

- `editor` - [MarkdownEditor](./ui-components/markdown-editor.md)
- `sidebar` - [Sidebar](./ui-components/sidebar.md)
```

## 需求匹配示例

用户问：
> "我需要实现一个图片嵌入展示的功能，帮我看看这个项目里有没有实现"

输出：

```
## 匹配结果

找到了 2 个相关模块：

### 1. [ImageCardEmbed](./ui-components/image-card-embed.md) - **匹配度: 高**

**功能描述**: 在笔记中嵌入图片，展示为带圆角的卡片，支持缩放点击查看原图
**代码位置**: `src/components/image-card-embed.tsx:1-89`
**标签**: `image` `embed` `card` `gallery`

**评估**:
- 满足需求程度: 完全满足图片嵌入展示需求
- 可复用性: 需要少量修改（适配图片路径规则）
- 依赖: 依赖样式系统

### 2. [ImageDragUpload](./interaction/image-drag-upload.md) - **匹配度: 中**

**功能描述**: 支持拖放图片到编辑器自动上传并嵌入
**代码位置**: `src/editor/plugins/image-drop.ts:50-120`
**标签**: `image` `drag-drop` `upload`

**评估**:
- 满足需求程度: 这是上传功能，不是展示功能，但和图片处理相关

---

## 建议

`ImageCardEmbed` 已经实现了你需要的图片嵌入卡片展示功能，可以直接参考它的实现，只需要调整样式适配你的项目即可。
```

## Output

### 分析完成后输出：
- 完整的模块化目录结构
- 每个模块独立文档，带功能标签和精确代码位置
- 可搜索的索引文件，带标签索引
- 架构分析文档

### 需求匹配完成后输出：
- 按匹配度排序的匹配模块列表
- 每个模块的匹配度评估和可复用性分析
- 明确的建议：是否可以复用，需要多大改动

## Dependencies

无特殊依赖，使用标准文件工具即可工作。
