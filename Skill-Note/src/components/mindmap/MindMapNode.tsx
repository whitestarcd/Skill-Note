/**
 * 思维导图节点组件
 * 支持直接编辑标题和自由拖拽
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Document, Category, Skill } from '../../models';
import { useSkillStore } from '../../stores/skillStore';
import { useUIStore } from '../../stores/uiStore';

interface MindMapNodeProps {
  id: string;
  type: 'document' | 'category' | 'skill';
  data: Document | Category | Skill;
  position: { x: number; y: number };
}

export function MindMapNode({ id, type, data, position }: MindMapNodeProps) {
  const { selectedNodeId, setSelectedNode, updateDocument, updateCategory, updateSkill, deleteDocument, deleteCategory, deleteSkill, addCategory, addSkill } = useSkillStore();
  const { nodesDraggable } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Track drag position locally for smooth movement
  const [dragPos, setDragPos] = useState<{x: number, y: number} | null>(null);
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const nodeRef = useRef<SVGGElement>(null);
  const inputRef = useRef<SVGForeignObjectElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === id;

  // Use dragged position if actively dragging, otherwise use stored position from store
  const currentPosition = dragPos || position;

  // Auto-enter editing mode if title is empty (newly created node)
  useEffect(() => {
    if (!data.title.trim()) {
      setIsEditing(true);
      setEditTitle('');
      setTimeout(() => {
        const input = inputRef.current?.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 10);
    }
  }, [data.title]);

  // 处理双击进入编辑
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    setEditTitle(data.title);
    setTimeout(() => {
      const input = inputRef.current?.querySelector('input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  };

  // 完成编辑
  const finishEditing = () => {
    // If this is a newly created node (original title empty) and still no content after editing - delete it
    if (!editTitle.trim() && !data.title.trim()) {
      if (type === 'document') {
        deleteDocument(id);
      } else if (type === 'category') {
        deleteCategory(id);
      } else {
        deleteSkill(id);
      }
      setIsEditing(false);
      return;
    }

    if (!editTitle.trim()) {
      setEditTitle(data.title);
      setIsEditing(false);
      return;
    }

    if (type === 'document') {
      updateDocument(id, { title: editTitle.trim() });
    } else if (type === 'category') {
      updateCategory(id, { title: editTitle.trim() });
    } else {
      updateSkill(id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      // If this is a newly created empty node, delete it on escape
      if (!data.title.trim()) {
        if (type === 'document') {
          deleteDocument(id);
        } else if (type === 'category') {
          deleteCategory(id);
        } else {
          deleteSkill(id);
        }
      } else {
        setEditTitle(data.title);
        setIsEditing(false);
      }
    }
    e.stopPropagation();
  };

  // 处理点击选中
  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      e.stopPropagation();
      setSelectedNode(id, type);
    }
  };

  // Handle right-click context menu - show menu next to the node
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Get node style for positioning
    const nodeStyle = getNodeStyle();

    // Position menu right next to the node (on the right side, flush with top, tightly adjacent)
    // Since we are already inside the transformed <g> at (currentPosition.x, currentPosition.y),
    // we just need relative coordinates to the node's top-right
    const menuX = nodeStyle.width / 2 + 8; // +8px gap after node right edge
    const menuY = -nodeStyle.height / 2; // align top with node top

    setContextMenu({
      x: menuX,
      y: menuY,
      visible: true,
    });
  };

  // Handle add category - create placeholder and enter inline editing
  const handleAddCategory = () => {
    const newCategoryId = `cat-${Date.now()}`;
    const newCategory: Category = {
      id: newCategoryId,
      title: '',
      parentId: id,
      description: '',
      childIds: [],
      position: { x: currentPosition.x + 200, y: currentPosition.y },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addCategory(newCategory);
    setContextMenu(null);
    // The new node will handle its own editing - we don't need to do anything here
    // The component will enter editing mode automatically if title is empty
  };

  // Handle add skill - create placeholder and enter inline editing
  const handleAddSkill = () => {
    const newSkillId = `skill-${Date.now()}`;
    const newSkill: Skill = {
      id: newSkillId,
      title: '',
      parentId: id,
      description: '',
      content: { type: 'markdown', data: '' },
      tags: [],
      childIds: [],
      position: { x: currentPosition.x + 200, y: currentPosition.y },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addSkill(newSkill);
    setContextMenu(null);
    // The new node will handle its own editing - component will enter editing mode automatically if title is empty
  };

  const openDeleteDialog = () => {
    setContextMenu(null);
    setDeleteDialog(true);
  };

  const executeCascadeDelete = () => {
    if (type === 'document') {
      deleteDocument(id);
    } else if (type === 'category') {
      deleteCategory(id, 'cascade');
    } else {
      deleteSkill(id, 'cascade');
    }
    setDeleteDialog(false);
  };

  const executePromoteDelete = () => {
    if (type === 'document') {
      // 根文档没有父节点，无法执行“父节点继承子节点”语义
      setDeleteDialog(false);
      return;
    }

    if (type === 'category') {
      deleteCategory(id, 'promote');
    } else {
      deleteSkill(id, 'promote');
    }
    setDeleteDialog(false);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!nodesDraggable || isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const svg = nodeRef.current?.ownerSVGElement;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    const point = svg.createSVGPoint();
    point.x = mouseX;
    point.y = mouseY;
    const svgPoint = point.matrixTransform(CTM.inverse());
    setDragOffset({
      x: svgPoint.x - position.x,
      y: svgPoint.y - position.y
    });
    setDragPos({ x: position.x, y: position.y });
  };

  // 处理拖拽移动 - update incrementally like draw.io does
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !nodesDraggable || !nodeRef.current || !dragPos) return;
    const svg = nodeRef.current.ownerSVGElement;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(CTM.inverse());
    const newX = svgPoint.x - dragOffset.x;
    const newY = svgPoint.y - dragOffset.y;
    // Update local drag position immediately - this triggers edge re-render
    setDragPos({ x: newX, y: newY });
    // Also update store position for edges to follow
    if (type === 'document') {
      updateDocument(id, { position: { x: newX, y: newY } });
    } else if (type === 'category') {
      updateCategory(id, { position: { x: newX, y: newY } });
    } else {
      updateSkill(id, { position: { x: newX, y: newY } });
    }
  }, [isDragging, dragOffset, nodesDraggable, dragPos, id, type, updateDocument, updateCategory, updateSkill]);

  // 结束拖拽
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragPos(null);
  }, [isDragging]);

  // 监听鼠标移动和松开事件在 document 上
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 获取节点样式
  const getNodeStyle = () => {
    switch (type) {
      case 'document':
        return {
          fill: '#3b82f6',
          stroke: '#2563eb',
          width: 200,
          height: 60,
          rx: 12,
        };
      case 'category':
        return {
          fill: '#22c55e',
          stroke: '#16a34a',
          width: 140,
          height: 45,
          rx: 8,
        };
      case 'skill':
        return {
          fill: '#f3f4f6',
          stroke: '#9ca3af',
          width: 140,
          height: 45,
          rx: 4,
        };
    }
  };

  const style = getNodeStyle();
  const textColor = type === 'skill' ? '#1f2937' : '#ffffff';
  const displayTitle = data.title.length > 15 ? data.title.substring(0, 14) + '...' : data.title;

  const deleteDialogModal = deleteDialog && typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35">
          <div className="w-[320px] rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-2xl p-4">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">删除所有节点</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              是否删除“{data.title || '未命名节点'}”以及其全部子节点？
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={executePromoteDelete}
              >
                否
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
                onClick={executeCascadeDelete}
              >
                是
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
    <g
      ref={nodeRef}
      transform={`translate(${currentPosition.x}, ${currentPosition.y})`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      className={`${nodesDraggable ? 'cursor-move' : 'cursor-pointer'} ${isDragging ? 'opacity-70' : 'opacity-100'} transition-opacity`}
    >
      {/* 节点背景 */}
      <rect
        x={-style.width / 2}
        y={-style.height / 2}
        width={style.width}
        height={style.height}
        fill={style.fill}
        stroke={isSelected ? '#f59e0b' : style.stroke}
        strokeWidth={isSelected ? 3 : 2}
        rx={style.rx}
        className="transition-all duration-150"
      />

      {/* 编辑模式 - 显示输入框 */}
      {isEditing && (
        <foreignObject
          ref={inputRef}
          x={-style.width / 2 + 5}
          y={-style.height / 2 + 5}
          width={style.width - 10}
          height={style.height - 10}
        >
          <div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              className="w-full h-full px-2 rounded text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: 'white',
                color: '#1f2937',
              }}
              autoFocus
            />
          </div>
        </foreignObject>
      )}

      {/* 显示模式 - 显示文本 */}
      {!isEditing && (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={type === 'document' ? 16 : type === 'category' ? 14 : 13}
          fontWeight={type === 'document' ? 600 : 500}
          className="pointer-events-none select-none"
        >
          {displayTitle}
        </text>
      )}

      {/* 选中指示器 */}
      {isSelected && !isEditing && (
        <circle
          cx={style.width / 2 - 10}
          cy={-style.height / 2 + 10}
          r={4}
          fill="#f59e0b"
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <foreignObject
          x={contextMenu.x}
          y={contextMenu.y}
          width={120}
          height={130}
          style={{ overflow: 'visible' }}
        >
          <div
            ref={menuRef}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-xl py-1 z-50 min-w-[120px]"
          >
            {/* Add Category - only show for document and category nodes */}
            {(type === 'document' || type === 'category' || type === 'skill') && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                onClick={handleAddCategory}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                添加分类
              </button>
            )}

            {/* Add Skill - show for all node types */}
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-2"
              onClick={handleAddSkill}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              添加 Skill
            </button>

            {/* Delete - show for all node types */}
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
              onClick={openDeleteDialog}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </foreignObject>
      )}

    </g>
    {deleteDialogModal}
    </>
  );
}
