/**
 * Skill 卡片组件
 */

import React from 'react';
import { Skill } from '../../models';
import { useSkillStore } from '../../stores/skillStore';

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const { setSelectedNode } = useSkillStore();

  const handleClick = () => {
    setSelectedNode(skill.id, 'skill');
  };

  // 根据内容类型显示不同图标
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return '📝';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      default:
        return '📄';
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    >
      <span className="text-lg">{getContentIcon(skill.content.type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{skill.title}</p>
        {skill.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {skill.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
