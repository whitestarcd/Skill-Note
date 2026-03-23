/**
 * 思维导图树状连线组件
 * 树形结构连线：父节点 -> 水平干线 -> 垂直分支 -> 子节点
 * 直接从 store 读取节点位置，支持拖拽实时更新
 */

import React from 'react';
import { useSkillStore } from '../../stores/skillStore';

interface TreeEdgeProps {
  parentId: string;
  parentType: 'document' | 'category' | 'skill';
  childIds: string[];
}

// 节点尺寸配置
const NODE_SIZES = {
  document: { width: 200, height: 60 },
  category: { width: 140, height: 45 },
  skill: { width: 140, height: 45 },
};

export function TreeEdge({ parentId, parentType, childIds }: TreeEdgeProps) {
  const { documents, categories, skills } = useSkillStore();

  // 从 store 获取父节点位置
  const parent = parentType === 'document'
    ? documents.find(d => d.id === parentId)
    : parentType === 'category'
    ? categories.find(c => c.id === parentId)
    : skills.find(s => s.id === parentId);

  if (!parent) return null;

  const parentPos = parent.position || { x: 0, y: 0 };
  const parentSize = NODE_SIZES[parentType];
  const parentRight = parentPos.x + parentSize.width / 2;

  // 子节点去重，避免重复分支导致重影和伪断线
  const uniqueChildIds = Array.from(new Set(childIds));

  // 从 store 获取所有子节点位置
  const childNodes = uniqueChildIds.map(id => {
    const cat = categories.find(c => c.id === id);
    if (cat) return { id, type: 'category' as const, pos: cat.position || { x: 0, y: 0 } };
    const skill = skills.find(s => s.id === id);
    if (skill) return { id, type: 'skill' as const, pos: skill.position || { x: 0, y: 0 } };
    return null;
  }).filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.pos.y - b.pos.y);

  if (childNodes.length === 0) return null;

  const elbowX = parentRight + 36;
  const baseRadius = 10;

  const buildRoundedOrthogonalPath = (child: (typeof childNodes)[number]) => {
    const childSize = NODE_SIZES[child.type];
    const childLeft = child.pos.x - childSize.width / 2 - 1;

    const startX = parentRight;
    const startY = parentPos.y;
    const midX = elbowX;
    const targetX = childLeft;
    const targetY = child.pos.y;

    // 同一水平线时直接连接，避免不必要的拐角
    if (Math.abs(targetY - startY) < 0.5) {
      return `M ${startX} ${startY} L ${targetX} ${targetY}`;
    }

    const verticalDelta = targetY - startY;
    const verticalSign = verticalDelta > 0 ? 1 : -1;
    const horizontalIn = Math.max(0, midX - startX);
    const horizontalOut = Math.max(0, targetX - midX);
    const verticalAbs = Math.abs(verticalDelta);

    const r1 = Math.max(2, Math.min(baseRadius, horizontalIn, verticalAbs / 2));
    const r2 = Math.max(2, Math.min(baseRadius, horizontalOut, verticalAbs / 2));

    const p1EnterX = midX - r1;
    const p1EnterY = startY;
    const p1ExitX = midX;
    const p1ExitY = startY + verticalSign * r1;

    const p2EnterX = midX;
    const p2EnterY = targetY - verticalSign * r2;
    const p2ExitX = midX + r2;
    const p2ExitY = targetY;

    return [
      `M ${startX} ${startY}`,
      `L ${p1EnterX} ${p1EnterY}`,
      `Q ${midX} ${startY} ${p1ExitX} ${p1ExitY}`,
      `L ${p2EnterX} ${p2EnterY}`,
      `Q ${midX} ${targetY} ${p2ExitX} ${p2ExitY}`,
      `L ${targetX} ${targetY}`,
    ].join(' ');
  };

  const combinedPath = childNodes.map(buildRoundedOrthogonalPath).join(' ');

  return (
    <path
      d={combinedPath}
      fill="none"
      stroke="#9ca3af"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-all duration-200"
    />
  );
}
