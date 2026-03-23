/**
 * 思维导图视图组件
 * 参考 draw.io 的 orthogonal-edge-router 实现最简连线算法
 */

import React, { useRef, useState, useCallback } from 'react';
import { useSkillStore } from '../../stores/skillStore';
import { useUIStore } from '../../stores/uiStore';
import { MindMapNode } from './MindMapNode';
import { TreeEdge } from './MindMapEdge';
import { MindMapToolbar } from './MindMapToolbar';
import { NodeContentPreviewOverlay, PreviewNodeItem, PreviewNodeType } from './NodeContentPreviewOverlay';

export function MindMapView() {
  const {
    currentDocumentId,
    documents,
    categories,
    skills,
    selectedNodeId,
    selectedNodeType,
    setSelectedNode,
    autoLayout,
    getChildrenOfNode,
    updateDocument,
    updateCategory,
    updateSkill,
  } = useSkillStore();
  const { nodesDraggable, viewMode, nodePreviewEnabled } = useUIStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 画布大小
  const canvasSize = { width: 2000, height: 1500 };

  // 画布平移状态
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 获取当前文档的数据
  const currentDocument = currentDocumentId ? documents.find((t) => t.id === currentDocumentId) : null;

  // 递归收集所有节点和连线
  // 使用全局 visited 集合防止循环引用（确保树形结构）
  const collectNodesAndEdges = (
    parentId: string,
    parentType: 'document' | 'category' | 'skill',
    visited: Set<string> = new Set()
  ): {
    nodes: Array<{
      id: string;
      type: 'document' | 'category' | 'skill';
      data: any;
      position: { x: number; y: number };
    }>;
    edges: Array<{
      parentId: string;
      parentType: 'document' | 'category' | 'skill';
      childIds: string[];
    }>;
  } => {
    // 防止循环引用
    if (visited.has(parentId)) {
      console.warn('[MindMapView] 检测到循环引用，跳过节点:', parentId);
      // 即使父节点已经访问过，也要返回空，但不影响处理 - 但这里我们还是需要处理子节点吗？
      // 实际上，如果已经访问过了，说明已经形成了环，不应该再次处理子节点，避免无限递归
      return { nodes: [], edges: [] };
    }
    visited.add(parentId);

    const nodes: Array<{
      id: string;
      type: 'document' | 'category' | 'skill';
      data: any;
      position: { x: number; y: number };
    }> = [];
    const edges: Array<{
      parentId: string;
      parentType: 'document' | 'category' | 'skill';
      childIds: string[];
    }> = [];
    const childIds: string[] = [];

    // 根据父节点类型获取子节点
    if (parentType === 'document') {
      const doc = documents.find(d => d.id === parentId);
      const docChildIds = doc?.childIds || [];
      childIds.push(...docChildIds);
    } else if (parentType === 'category') {
      const cat = categories.find(c => c.id === parentId);
      const catChildIds = cat?.childIds || [];
      childIds.push(...catChildIds);
    } else {
      const skill = skills.find(s => s.id === parentId);
      const skillChildIds = skill?.childIds || [];
      childIds.push(...skillChildIds);
    }

    // 处理每个子节点
    childIds.forEach(childId => {
      const cat = categories.find(c => c.id === childId);
      if (cat) {
        nodes.push({
          id: cat.id,
          type: 'category',
          data: cat,
          position: cat.position || { x: 400, y: 300 }
        });
        edges.push({
          parentId,
          parentType,
          childIds: [childId]
        });

        // 递归处理分类的子节点，传递相同的 visited 集合
        const childResult = collectNodesAndEdges(cat.id, 'category', visited);
        nodes.push(...childResult.nodes);
        edges.push(...childResult.edges);
        return;
      }

      const skill = skills.find(s => s.id === childId);
      if (skill) {
        nodes.push({
          id: skill.id,
          type: 'skill',
          data: skill,
          position: skill.position || { x: 400, y: 400 }
        });
        edges.push({
          parentId,
          parentType,
          childIds: [childId]
        });

        // 递归处理 Skill 的子节点，传递相同的 visited 集合
        const childResult = collectNodesAndEdges(skill.id, 'skill', visited);
        nodes.push(...childResult.nodes);
        edges.push(...childResult.edges);
      }
    });

    return { nodes, edges };
  };

  // 收集所有节点并计算树状连线
  const getAllNodesInDocument = () => {
    if (!currentDocument) return { nodes: [], treeEdges: [] };

    // 添加根文档节点
    const nodes: Array<{
      id: string;
      type: 'document' | 'category' | 'skill';
      data: any;
      position: { x: number; y: number };
    }> = [{
      id: currentDocument.id,
      type: 'document',
      data: currentDocument,
      position: currentDocument.position || { x: 100, y: 100 }
    }];

    // 递归收集所有子节点和连线，创建新的 visited 集合防止循环引用
    // 根文档已经添加到 nodes 和 visited，现在只需要处理它的子节点
    const visited = new Set<string>([currentDocument.id]);
    const childIds = currentDocument.childIds || [];
    const result: {
      nodes: Array<{
        id: string;
        type: 'document' | 'category' | 'skill';
        data: any;
        position: { x: number; y: number };
      }>;
      edges: Array<{
        parentId: string;
        parentType: 'document' | 'category' | 'skill';
        childIds: string[];
      }>;
    } = { nodes: [], edges: [] };
    childIds.forEach(childId => {
      const cat = categories.find(c => c.id === childId);
      if (cat) {
        result.nodes.push({
          id: cat.id,
          type: 'category',
          data: cat,
          position: cat.position || { x: 400, y: 300 }
        });
        result.edges.push({
          parentId: currentDocument.id,
          parentType: 'document',
          childIds: [childId]
        });
        const childResult = collectNodesAndEdges(cat.id, 'category', visited);
        result.nodes.push(...childResult.nodes);
        result.edges.push(...childResult.edges);
        return;
      }

      const skill = skills.find(s => s.id === childId);
      if (skill) {
        result.nodes.push({
          id: skill.id,
          type: 'skill',
          data: skill,
          position: skill.position || { x: 400, y: 400 }
        });
        result.edges.push({
          parentId: currentDocument.id,
          parentType: 'document',
          childIds: [childId]
        });
        const childResult = collectNodesAndEdges(skill.id, 'skill', visited);
        result.nodes.push(...childResult.nodes);
        result.edges.push(...childResult.edges);
      }
    });
    nodes.push(...result.nodes);

    // 合并相同父节点的连线
    const treeEdges: Array<{
      parentId: string;
      parentType: 'document' | 'category' | 'skill';
      childIds: string[];
    }> = [];
    result.edges.forEach(edge => {
      const existing = treeEdges.find(e => e.parentId === edge.parentId);
      if (existing) {
        existing.childIds.push(...edge.childIds);
        existing.childIds = Array.from(new Set(existing.childIds));
      } else {
        treeEdges.push({ ...edge });
      }
    });

    return { nodes, treeEdges };
  };

  const { nodes, treeEdges } = getAllNodesInDocument();

  const resolveNodeItem = useCallback((nodeId: string, nodeType: PreviewNodeType): PreviewNodeItem | null => {
    if (nodeType === 'document') {
      const doc = documents.find((item) => item.id === nodeId);
      if (!doc) return null;
      return {
        id: doc.id,
        type: 'document',
        title: doc.title,
        description: doc.description,
        markdown: doc.content?.data || doc.description || '',
      };
    }

    if (nodeType === 'category') {
      const category = categories.find((item) => item.id === nodeId);
      if (!category) return null;
      return {
        id: category.id,
        type: 'category',
        title: category.title,
        description: category.description,
        markdown: category.content?.data || category.description || '',
      };
    }

    const skill = skills.find((item) => item.id === nodeId);
    if (!skill) return null;
    return {
      id: skill.id,
      type: 'skill',
      title: skill.title,
      description: skill.description,
      markdown: skill.content?.data || skill.description || '',
    };
  }, [documents, categories, skills]);

  const previewItems: PreviewNodeItem[] = (() => {
    if (!selectedNodeId || !selectedNodeType) return [];

    const selectedItem = resolveNodeItem(selectedNodeId, selectedNodeType);
    if (!selectedItem) return [];

    const childItems = getChildrenOfNode(selectedNodeId)
      .map((child) => resolveNodeItem(child.data.id, child.type as PreviewNodeType))
      .filter(Boolean) as PreviewNodeItem[];

    return [selectedItem, ...childItems];
  })();

  // 处理画布点击（取消选择）
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setSelectedNode(null, null);
    }
  };

  // 处理画布拖拽（平移）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只在点击画布空白处时开始拖拽（不是节点或连线）
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 处理自动布局 - 传入画布中心位置
  const handleAutoLayout = () => {
    if (!currentDocumentId) return;
    // 计算画布可视区域中心
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const canvasCenter = {
        width: rect.width,
        height: rect.height,
      };
      autoLayout(currentDocumentId, canvasCenter);
      // 重置平移
      setPanOffset({ x: 0, y: 0 });
    } else {
      autoLayout(currentDocumentId);
    }
  };

  if (!currentDocument) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">👋 欢迎使用 Skill-Note</p>
          <p className="text-sm">请选择或创建一个文档开始</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* 工具栏：固定在视口左上，不随画布滚动 */}
      <div className="absolute top-4 left-4 z-20">
        <MindMapToolbar onAutoLayout={handleAutoLayout} />
      </div>

      <div
        ref={containerRef}
        className="h-full overflow-auto cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      {/* 思维导图画布 */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minWidth: canvasSize.width, minHeight: canvasSize.height }}
        onClick={handleCanvasClick}
      >
        {/* 平移变换组 */}
        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
        {/* 网格背景 */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 连线层 */}
        <g className="edges">
          {treeEdges.map((edge) => (
            <TreeEdge
              key={`tree-${edge.parentId}`}
              parentId={edge.parentId}
              parentType={edge.parentType}
              childIds={edge.childIds}
            />
          ))}
        </g>

        {/* 节点层 */}
        <g className="nodes">
          {nodes.map((node) => (
            <MindMapNode
              key={node.id}
              id={node.id}
              type={node.type}
              data={node.data}
              position={node.position}
            />
          ))}
        </g>
        </g>
      </svg>
      </div>

      {viewMode === 'mindmap' && nodePreviewEnabled && previewItems.length > 0 && selectedNodeId && (
        <NodeContentPreviewOverlay
          items={previewItems}
          initialNodeId={selectedNodeId}
          onClose={() => setSelectedNode(null, null)}
          onUpdateTitle={(nodeId, nodeType, title) => {
            if (nodeType === 'document') {
              updateDocument(nodeId, { title });
              return;
            }
            if (nodeType === 'category') {
              updateCategory(nodeId, { title });
              return;
            }
            updateSkill(nodeId, { title });
          }}
          onUpdateMarkdown={(nodeId, nodeType, markdown) => {
            if (nodeType === 'document') {
              const doc = documents.find((item) => item.id === nodeId);
              updateDocument(nodeId, {
                content: {
                  type: 'markdown',
                  data: markdown,
                },
                description: doc?.description || '',
              });
              return;
            }

            if (nodeType === 'category') {
              const category = categories.find((item) => item.id === nodeId);
              updateCategory(nodeId, {
                content: {
                  type: 'markdown',
                  data: markdown,
                },
                description: category?.description || '',
              });
              return;
            }

            updateSkill(nodeId, {
              content: {
                type: 'markdown',
                data: markdown,
              },
            });
          }}
        />
      )}
    </div>
  );
}
