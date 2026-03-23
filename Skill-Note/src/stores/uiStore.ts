/**
 * UI 状态管理
 */

import { create } from 'zustand';

export type ViewMode = 'mindmap' | 'editor' | 'split';
export type EditorMode = 'edit' | 'split' | 'preview';

interface UIState {
  // 视图模式
  viewMode: ViewMode;

  // 编辑器模式: edit = 所见即所得, split = 原文模式, preview = 只读预览
  editorMode: EditorMode;

  // 侧边栏是否展开
  sidebarOpen: boolean;

  // 思维导图节点是否可拖拽
  nodesDraggable: boolean;

  // 是否启用节点卡片弹层
  nodePreviewEnabled: boolean;

  // 主题
  darkMode: boolean;

  // 操作
  setViewMode: (mode: ViewMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  toggleSidebar: () => void;
  setNodesDraggable: (draggable: boolean) => void;
  setNodePreviewEnabled: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  viewMode: 'mindmap',
  editorMode: 'edit',
  sidebarOpen: true,
  nodesDraggable: true,
  nodePreviewEnabled: true,
  darkMode: false,

  // 设置视图模式
  setViewMode: (mode) => set({ viewMode: mode }),

  // 设置编辑器模式
  setEditorMode: (mode) => set({ editorMode: mode }),

  // 切换侧边栏
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // 设置节点拖拽
  setNodesDraggable: (draggable) => set({ nodesDraggable: draggable }),

  // 设置节点卡片弹层开关
  setNodePreviewEnabled: (enabled) => set({ nodePreviewEnabled: enabled }),

  // 切换暗色模式
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
