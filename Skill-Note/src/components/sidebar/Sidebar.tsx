/**
 * 侧边栏组件 - Skill 列表（扁平结构：分类和Skill同级都在文档下）
 */

import React, { useEffect, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSkillStore } from '../../stores/skillStore';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';

type SidebarListNode = {
  id: string;
  title: string;
  type: 'category' | 'skill';
  depth: number;
  hasChildren: boolean;
};

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { currentDocumentId, documents, categories, skills, setSelectedNode } = useSkillStore();
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCollapsedNodeIds(new Set());
  }, [currentDocumentId]);

  // 获取当前文档下所有层级节点（递归）
  const getCurrentNodes = () => {
    if (!currentDocumentId) return [] as SidebarListNode[];

    const doc = documents.find(d => d.id === currentDocumentId);
    if (!doc) return [] as SidebarListNode[];

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const skillMap = new Map(skills.map((s) => [s.id, s]));
    const visited = new Set<string>();
    const result: SidebarListNode[] = [];

    const collect = (parentId: string, depth: number) => {
      const parentDoc = documents.find((d) => d.id === parentId);
      const parentCategory = categoryMap.get(parentId);
      const parentSkill = skillMap.get(parentId);

      const childIds = parentDoc?.childIds || parentCategory?.childIds || parentSkill?.childIds || [];
      childIds.forEach((childId) => {
        if (visited.has(childId)) return;
        visited.add(childId);

        const category = categoryMap.get(childId);
        if (category) {
          const hasChildren = (category.childIds || []).length > 0;
          result.push({ id: category.id, title: category.title, type: 'category', depth, hasChildren });
          if (collapsedNodeIds.has(category.id)) return;
          collect(category.id, depth + 1);
          return;
        }

        const skill = skillMap.get(childId);
        if (skill) {
          const hasChildren = (skill.childIds || []).length > 0;
          result.push({ id: skill.id, title: skill.title, type: 'skill', depth, hasChildren });
          if (collapsedNodeIds.has(skill.id)) return;
          collect(skill.id, depth + 1);
        }
      });
    };

    collect(doc.id, 0);
    return result;
  };

  const listNodes = getCurrentNodes();

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (!sidebarOpen) {
    return (
      <aside className="w-12 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="展开侧边栏"
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* 侧边栏头部 */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">知识技能</span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="收起侧边栏"
        >
          <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-3">
        {!currentDocumentId ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            <p>请先选择一个文档</p>
            <p className="mt-2 text-xs">或新建一个文档开始</p>
          </div>
        ) : listNodes.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            <p>暂无内容</p>
            <p className="mt-2 text-xs">点击思维导图添加文档节点</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listNodes.map((node) => (
              <div
                key={node.id}
                className="w-full flex items-center gap-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                style={{ paddingLeft: `${8 + node.depth * 14}px` }}
              >
                {node.hasChildren ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleNodeCollapse(node.id);
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    aria-label={collapsedNodeIds.has(node.id) ? '展开子节点' : '收起子节点'}
                  >
                    {collapsedNodeIds.has(node.id) ? (
                      <ChevronRight size={14} className="text-gray-500 dark:text-gray-300" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500 dark:text-gray-300" />
                    )}
                  </button>
                ) : (
                  <span className="h-5 w-5 shrink-0" />
                )}

                <button
                  type="button"
                  onClick={() => setSelectedNode(node.id, node.type)}
                  className="min-w-0 flex-1 text-left flex items-center gap-2 rounded px-1 py-1"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      node.type === 'category' ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                  />
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{node.title}</p>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
