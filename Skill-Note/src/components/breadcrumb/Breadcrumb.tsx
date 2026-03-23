/**
 * 面包屑导航组件
 * 参考 Siyuan Breadcrumb 实现
 */

import React from 'react';
import { useSkillStore } from '../../stores/skillStore';

export function Breadcrumb() {
  const { selectedNodeId, selectedNodeType, documents, categories, skills } = useSkillStore();

  // 获取节点名称
  const getNodeName = () => {
    if (!selectedNodeId || !selectedNodeType) return null;

    switch (selectedNodeType) {
      case 'document':
        return documents.find((t) => t.id === selectedNodeId)?.title;
      case 'category':
        return categories.find((c) => c.id === selectedNodeId)?.title;
      case 'skill':
        return skills.find((s) => s.id === selectedNodeId)?.title;
    }
  };

  const nodeName = getNodeName();

  if (!nodeName) {
    return (
      <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">选择一个节点查看详情</span>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    document: '📄 文档',
    category: '📄 分类文档',
    skill: '⭐ Skill',
  };

  return (
    <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">当前:</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{nodeName}</span>
        {selectedNodeType && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded">
            {typeLabels[selectedNodeType]}
          </span>
        )}
      </nav>
    </div>
  );
}
