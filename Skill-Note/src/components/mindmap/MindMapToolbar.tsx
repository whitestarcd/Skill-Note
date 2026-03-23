/**
 * 思维导图工具栏
 */

import React from 'react';
import { Plus, Grip, Lock, LayoutTemplate, EyeOff, Eye, CreditCard } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSkillStore } from '../../stores/skillStore';

interface MindMapToolbarProps {
  onAutoLayout?: () => void;
}

export function MindMapToolbar({ onAutoLayout }: MindMapToolbarProps) {
  const { nodesDraggable, setNodesDraggable, nodePreviewEnabled, setNodePreviewEnabled } = useUIStore();
  const { currentDocumentId, addCategory, addSkill, selectedNodeId, selectedNodeType, categories, skills, documents } = useSkillStore();
  const [collapsed, setCollapsed] = React.useState(false);

  // 处理自动布局
  const handleAutoLayout = () => {
    if (!currentDocumentId) {
      alert('请先选择一个文档');
      return;
    }
    onAutoLayout?.();
  };

  // 获取父节点 ID 和偏移位置 - 如果选中了节点，以选中节点为父节点，新节点放在旁边
  const getAddPosition = (baseOffsetX: number, baseOffsetY: number): { parentId: string; position: { x: number; y: number } } => {
    let parentId = currentDocumentId!;
    let x = baseOffsetX;
    let y = baseOffsetY;

    // If node selected, use selected node as parent and place new node next to it
    if (selectedNodeId && selectedNodeType) {
      let selectedPos: { x: number; y: number } | null = null;
      if (selectedNodeType === 'category') {
        const selected = categories.find(c => c.id === selectedNodeId);
        selectedPos = selected?.position || null;
        parentId = selectedNodeId; // Use selected category as parent
      } else if (selectedNodeType === 'skill') {
        const selected = skills.find(s => s.id === selectedNodeId);
        selectedPos = selected?.position || null;
        parentId = selectedNodeId; // Use selected skill as parent
      } else if (selectedNodeType === 'document') {
        selectedPos = documents.find(d => d.id === selectedNodeId)?.position || null;
        parentId = selectedNodeId; // Use selected document as parent
      }
      if (selectedPos) {
        // X position: to the right of parent
        x = selectedPos.x + 200;

        // Y position: find existing children and place below them
        let existingChildren: Array<{ y: number }> = [];
        if (selectedNodeType === 'category') {
          const cat = categories.find(c => c.id === selectedNodeId);
          const childCatIds = cat?.childIds || [];
          const childSkillIds = childCatIds; // same field
          existingChildren = [
            ...categories.filter(c => c.parentId === selectedNodeId).map(c => ({ y: c.position?.y || 0 })),
            ...skills.filter(s => s.parentId === selectedNodeId).map(s => ({ y: s.position?.y || 0 }))
          ];
        } else if (selectedNodeType === 'skill') {
          const skill = skills.find(s => s.id === selectedNodeId);
          existingChildren = [
            ...categories.filter(c => c.parentId === selectedNodeId).map(c => ({ y: c.position?.y || 0 })),
            ...skills.filter(s => s.parentId === selectedNodeId).map(s => ({ y: s.position?.y || 0 }))
          ];
        } else if (selectedNodeType === 'document') {
          const doc = documents.find(d => d.id === selectedNodeId);
          const childIds = doc?.childIds || [];
          existingChildren = [
            ...categories.filter(c => c.parentId === selectedNodeId).map(c => ({ y: c.position?.y || 0 })),
            ...skills.filter(s => s.parentId === selectedNodeId).map(s => ({ y: s.position?.y || 0 }))
          ];
        }

        // Place new node below existing children, or at parent's Y if no children
        if (existingChildren.length > 0) {
          const maxY = Math.max(...existingChildren.map(c => c.y));
          y = maxY + 60; // 60px below the last child
        } else {
          y = selectedPos.y;
        }
      }
    }

    return { parentId, position: { x, y } };
  };

  // 添加分类 - 添加到当前文档，如果有选中节点放在选中节点旁边
  const handleAddCategory = () => {
    if (!currentDocumentId) {
      alert('请先选择一个文档');
      return;
    }

    // 默认标题，用户可以双击编辑
    const title = '新分类';
    const description = '';
    // 如果没有选中节点，使用文档 ID 作为父节点
    const { parentId, position } = selectedNodeId
      ? getAddPosition(400, 300)
      : { parentId: currentDocumentId, position: { x: 400, y: 300 } };

    addCategory({
      id: crypto.randomUUID(),
      parentId,
      title,
      description,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    // 保持选中状态，用户可以继续在该节点下创建子节点
  };

  // 添加 Skill - 添加到当前文档，如果有选中节点放在选中节点旁边
  const handleAddSkill = () => {
    if (!currentDocumentId) {
      alert('请先选择一个文档');
      return;
    }

    // 默认标题，用户可以双击编辑
    const title = '新Skill';
    const description = '';
    // 如果没有选中节点，使用文档 ID 作为父节点
    const { parentId, position } = selectedNodeId
      ? getAddPosition(300, 450)
      : { parentId: currentDocumentId, position: { x: 300, y: 450 } };

    addSkill({
      id: crypto.randomUUID(),
      parentId,
      title,
      description,
      content: { type: 'markdown', data: '# ' + title + '\n\n' },
      tags: [],
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    // 保持选中状态，用户可以继续在该节点下创建子节点
  };

  const iconButtonBase = 'group relative w-9 h-9 rounded-md transition-colors flex items-center justify-center';

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`${iconButtonBase} bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700`}
        title="展开工具栏"
        aria-label="展开工具栏"
      >
        <Eye size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          展开工具栏
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 border border-gray-200 dark:border-gray-700">
      {/* 添加节点按钮 */}
      <button
        onClick={handleAddCategory}
        className={`${iconButtonBase} bg-green-500 text-white hover:bg-green-600`}
        title="添加分类"
        aria-label="添加分类"
      >
        <Plus size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          添加分类
        </span>
      </button>

      <button
        onClick={handleAddSkill}
        className={`${iconButtonBase} bg-blue-500 text-white hover:bg-blue-600`}
        title="添加 Skill"
        aria-label="添加 Skill"
      >
        <Plus size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          添加 Skill
        </span>
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* 自动布局按钮 */}
      <button
        onClick={handleAutoLayout}
        className={`${iconButtonBase} bg-purple-500 text-white hover:bg-purple-600`}
        title="自动整理布局和连线"
        aria-label="自动布局"
      >
        <LayoutTemplate size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          自动布局
        </span>
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* 拖拽开关 */}
      <button
        onClick={() => setNodesDraggable(!nodesDraggable)}
        className={`${iconButtonBase} ${
          nodesDraggable
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
        }`}
        title="切换节点拖拽"
        aria-label="切换节点拖拽"
      >
        {nodesDraggable ? <Grip size={16} /> : <Lock size={16} />}
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nodesDraggable ? '可拖拽' : '已锁定'}
        </span>
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <button
        onClick={() => setNodePreviewEnabled(!nodePreviewEnabled)}
        className={`${iconButtonBase} ${
          nodePreviewEnabled
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={nodePreviewEnabled ? '关闭卡片弹窗' : '开启卡片弹窗'}
        aria-label={nodePreviewEnabled ? '关闭卡片弹窗' : '开启卡片弹窗'}
      >
        <CreditCard size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nodePreviewEnabled ? '卡片弹窗: 开' : '卡片弹窗: 关'}
        </span>
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <button
        onClick={() => setCollapsed(true)}
        className={`${iconButtonBase} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600`}
        title="隐藏工具栏"
        aria-label="隐藏工具栏"
      >
        <EyeOff size={16} />
        <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          隐藏工具栏
        </span>
      </button>
    </div>
  );
}
