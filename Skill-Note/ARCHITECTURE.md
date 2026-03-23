# Skill-Note 架构文档

## 设计原则

### 1. 最简实现
- 只实现核心功能，避免过度设计
- 思维导图只支持矩形节点和直角连线
- 不做复杂图形、动画、协同编辑

### 2. 可扩展性
- 组件化设计，每个功能模块独立
- 状态管理集中，便于调试和扩展
- TypeScript 类型安全，便于维护

### 3. 用户闭环
- 新建主题 → 添加分类 → 添加 Skill → 编辑内容 → 导出分享
- 每个功能都有对应的入口和出口

## 核心模块

### 数据模型 (models/)

```
Topic (主题)
  └── Category (分类)
        └── Skill (技能)
              └── Content (内容：Markdown/图片/视频)
```

### 状态管理 (stores/)

**skillStore**: 管理所有数据
- topics: Topic[]
- categories: Category[]
- skills: Skill[]
- currentTopicId: 当前选中的主题
- selectedNodeId: 当前选中的节点
- selectedNodeType: 节点类型

**uiStore**: 管理 UI 状态
- viewMode: 'mindmap' | 'editor' | 'split'
- sidebarOpen: 侧边栏开关
- nodesDraggable: 节点拖拽开关
- darkMode: 暗色模式开关

### 组件层次

```
App (根组件)
├── TopBar (顶部工具栏)
│   ├── 主题选择
│   ├── 视图切换
│   ├── 导入/导出
│   └── 暗色模式切换
│
├── Sidebar (侧边栏)
│   ├── SkillTree (树形列表)
│   └── SkillCard (Skill 卡片)
│
└── Main (主内容区)
    ├── Breadcrumb (面包屑)
    └── ViewContent (视图内容)
        ├── MindMapView (思维导图)
        │   ├── MindMapNode (节点)
        │   ├── MindMapEdge (连线)
        │   └── MindMapToolbar (工具栏)
        │
        └── EditorView (编辑器)
            ├── EditorToolbar (工具栏)
            ├── MediaUploader (媒体上传)
            └── MarkdownEditor (CodeMirror)
```

## 数据流

```
用户操作 → 组件事件 → Store Action → 状态更新 → 组件重新渲染
                ↓
          自动保存到 IndexedDB
```

## 参考开源实现

### 1. draw.io - 思维导图连线
**参考组件**: `orthogonal-edge-router`

**简化实现**:
```typescript
// 简化的直角连线算法
const path = `
  M ${startX} ${startY}     // 从起点出发
  L ${startX} ${midY}       // 垂直向下到中间
  L ${endX} ${midY}         // 水平到终点上方
  L ${endX} ${endY}         // 垂直向下到终点
`;
```

### 2. Zettlr - Markdown 编辑
**参考组件**: `CodeMirrorEditor`

**简化实现**:
- 使用 CodeMirror 6 基础配置
- 只保留 markdown 语言支持
- 自定义插入语法的事件监听

### 3. Joplin - 侧边栏导航
**参考组件**: `ConfigSidebar`

**简化实现**:
- 树形分类展示
- Skill 卡片列表
- 可展开/收起

### 4. Siyuan - 面包屑导航
**参考组件**: `Breadcrumb`

**简化实现**:
- 显示当前选中的节点路径
- 节点类型标签

## 存储方案

### IndexedDB 结构
```javascript
{
  id: 'main',
  version: '1.0',
  exportDate: 1234567890,
  topics: [...],
  categories: [...],
  skills: [...]
}
```

### 导出 JSON 格式
```json
{
  "version": "1.0",
  "exportDate": 1234567890,
  "topics": [
    {
      "id": "uuid",
      "title": "数学",
      "description": "...",
      "categoryIds": ["cat1", "cat2"],
      "position": { "x": 100, "y": 100 },
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ],
  "categories": [...],
  "skills": [...]
}
```

## 扩展方向

### 短期 (1-2 周)
- [ ] 节点拖拽调整位置
- [ ] 节点右键菜单
- [ ] 删除功能
- [ ] 搜索功能

### 中期 (1-2 月)
- [ ] 标签管理
- [ ] 导出为 Markdown/PDF
- [ ] 节点样式自定义
- [ ] 快捷键支持

### 长期 (3-6 月)
- [ ] 云同步
- [ ] 多设备同步
- [ ] 协作编辑
- [ ] 插件系统

## 开发注意事项

1. **类型安全**: 所有组件和函数都要有明确的 TypeScript 类型
2. **状态管理**: 不要直接修改 state，使用 Store 的 action
3. **组件复用**: 相似功能尽量抽象为通用组件
4. **性能优化**: 大数据量时考虑虚拟滚动、懒加载
5. **用户体验**: 操作要有反馈，加载要有提示
