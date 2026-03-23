/**
 * 思维导图自动布局算法
 *
 * 设计目标：
 * 1. 保证父子层级从左到右展开
 * 2. 保证兄弟节点不重叠
 * 3. 保证围绕父节点中心线的对称美感
 * 4. 保持树结构稳定（同样数据得到稳定结果）
 */

import { Category, Document, Skill } from '../models';

interface LayoutNode {
  id: string;
  type: 'document' | 'category' | 'skill';
  width: number;
  height: number;
  x: number;
  y: number;
  subtreeHeight: number;
  children: LayoutNode[];
}

interface LayoutConfig {
  documentWidth: number;
  documentHeight: number;
  categoryWidth: number;
  categoryHeight: number;
  skillWidth: number;
  skillHeight: number;
  levelDistance: number;
  siblingDistance: number;
}

const defaultConfig: LayoutConfig = {
  documentWidth: 200,
  documentHeight: 60,
  categoryWidth: 140,
  categoryHeight: 45,
  skillWidth: 140,
  skillHeight: 45,
  levelDistance: 160,
  siblingDistance: 30,
};

function getNodeSize(type: 'document' | 'category' | 'skill', config: LayoutConfig) {
  switch (type) {
    case 'document':
      return { width: config.documentWidth, height: config.documentHeight };
    case 'category':
      return { width: config.categoryWidth, height: config.categoryHeight };
    case 'skill':
      return { width: config.skillWidth, height: config.skillHeight };
  }
}

function buildTree(
  rootId: string,
  rootType: 'document' | 'category' | 'skill',
  documentsById: Map<string, Document>,
  categoriesById: Map<string, Category>,
  skillsById: Map<string, Skill>,
  config: LayoutConfig,
  visited: Set<string>
): LayoutNode | null {
  if (visited.has(rootId)) {
    console.warn(`[autoLayout] 检测到循环引用或重复节点: ${rootId}`);
    return null;
  }
  visited.add(rootId);

  let childIds: string[] = [];
  if (rootType === 'document') {
    const doc = documentsById.get(rootId);
    if (!doc) return null;
    childIds = doc.childIds || [];
  } else if (rootType === 'category') {
    const cat = categoriesById.get(rootId);
    if (!cat) return null;
    childIds = cat.childIds || [];
  } else {
    const skill = skillsById.get(rootId);
    if (!skill) return null;
    childIds = skill.childIds || [];
  }

  const size = getNodeSize(rootType, config);
  const node: LayoutNode = {
    id: rootId,
    type: rootType,
    width: size.width,
    height: size.height,
    x: 0,
    y: 0,
    subtreeHeight: size.height,
    children: [],
  };

  for (const childId of childIds) {
    if (categoriesById.has(childId)) {
      const child = buildTree(
        childId,
        'category',
        documentsById,
        categoriesById,
        skillsById,
        config,
        visited
      );
      if (child) node.children.push(child);
      continue;
    }

    if (skillsById.has(childId)) {
      const child = buildTree(
        childId,
        'skill',
        documentsById,
        categoriesById,
        skillsById,
        config,
        visited
      );
      if (child) node.children.push(child);
    }
  }

  return node;
}

function computeSubtreeHeight(node: LayoutNode, config: LayoutConfig): number {
  if (node.children.length === 0) {
    node.subtreeHeight = node.height;
    return node.subtreeHeight;
  }

  let childrenTotal = 0;
  node.children.forEach((child, idx) => {
    childrenTotal += computeSubtreeHeight(child, config);
    if (idx < node.children.length - 1) {
      childrenTotal += config.siblingDistance;
    }
  });

  node.subtreeHeight = Math.max(node.height, childrenTotal);
  return node.subtreeHeight;
}

function assignPositions(node: LayoutNode, centerX: number, centerY: number, config: LayoutConfig) {
  node.x = centerX;
  node.y = centerY;

  if (node.children.length === 0) return;

  const childrenTotalHeight = node.children.reduce((sum, child, idx) => {
    return sum + child.subtreeHeight + (idx < node.children.length - 1 ? config.siblingDistance : 0);
  }, 0);

  let cursorY = centerY - childrenTotalHeight / 2;

  for (const child of node.children) {
    const childCenterY = cursorY + child.subtreeHeight / 2;
    const childCenterX = centerX + node.width / 2 + config.levelDistance + child.width / 2;

    assignPositions(child, childCenterX, childCenterY, config);

    cursorY += child.subtreeHeight + config.siblingDistance;
  }
}

function collectBounds(root: LayoutNode) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const queue: LayoutNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    minX = Math.min(minX, node.x - node.width / 2);
    maxX = Math.max(maxX, node.x + node.width / 2);
    minY = Math.min(minY, node.y - node.height / 2);
    maxY = Math.max(maxY, node.y + node.height / 2);
    queue.push(...node.children);
  }

  return { minX, maxX, minY, maxY };
}

function translateLayout(root: LayoutNode, dx: number, dy: number) {
  const queue: LayoutNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    node.x += dx;
    node.y += dy;
    queue.push(...node.children);
  }
}

function collectPositions(root: LayoutNode) {
  const result = {
    documents: [] as { id: string; position: { x: number; y: number } }[],
    categories: [] as { id: string; position: { x: number; y: number } }[],
    skills: [] as { id: string; position: { x: number; y: number } }[],
  };

  const queue: LayoutNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    const position = { x: node.x, y: node.y };

    if (node.type === 'document') {
      result.documents.push({ id: node.id, position });
    } else if (node.type === 'category') {
      result.categories.push({ id: node.id, position });
    } else {
      result.skills.push({ id: node.id, position });
    }

    queue.push(...node.children);
  }

  return result;
}

export function autoLayout(
  documents: Document[],
  categories: Category[],
  skills: Skill[],
  rootDocumentId: string,
  canvasSize?: { width: number; height: number },
  config?: Partial<LayoutConfig>
): {
  documents: { id: string; position: { x: number; y: number } }[];
  categories: { id: string; position: { x: number; y: number } }[];
  skills: { id: string; position: { x: number; y: number } }[];
} {
  const mergedConfig = { ...defaultConfig, ...config };

  const documentsById = new Map(documents.map((d) => [d.id, d]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const skillsById = new Map(skills.map((s) => [s.id, s]));

  const root = buildTree(
    rootDocumentId,
    'document',
    documentsById,
    categoriesById,
    skillsById,
    mergedConfig,
    new Set<string>()
  );

  if (!root) {
    return { documents: [], categories: [], skills: [] };
  }

  computeSubtreeHeight(root, mergedConfig);
  assignPositions(root, 0, 0, mergedConfig);

  const bounds = collectBounds(root);
  const layoutWidth = bounds.maxX - bounds.minX;
  const layoutHeight = bounds.maxY - bounds.minY;

  let offsetX = 0;
  let offsetY = 0;

  if (canvasSize) {
    offsetX = (canvasSize.width - layoutWidth) / 2 - bounds.minX;
    offsetY = (canvasSize.height - layoutHeight) / 2 - bounds.minY;
  } else {
    offsetX = 100 - bounds.minX;
    offsetY = 100 - bounds.minY;
  }

  translateLayout(root, offsetX, offsetY);
  return collectPositions(root);
}

export function layoutSubtree(
  parentId: string,
  parentType: 'document' | 'category' | 'skill',
  documents: Document[],
  categories: Category[],
  skills: Skill[],
  parentPosition: { x: number; y: number },
  config?: Partial<LayoutConfig>
): {
  categories: { id: string; position: { x: number; y: number } }[];
  skills: { id: string; position: { x: number; y: number } }[];
} {
  const mergedConfig = { ...defaultConfig, ...config };

  const documentsById = new Map(documents.map((d) => [d.id, d]));
  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const skillsById = new Map(skills.map((s) => [s.id, s]));

  const root = buildTree(
    parentId,
    parentType,
    documentsById,
    categoriesById,
    skillsById,
    mergedConfig,
    new Set<string>()
  );

  if (!root) {
    return { categories: [], skills: [] };
  }

  computeSubtreeHeight(root, mergedConfig);
  assignPositions(root, parentPosition.x, parentPosition.y, mergedConfig);

  const result = {
    categories: [] as { id: string; position: { x: number; y: number } }[],
    skills: [] as { id: string; position: { x: number; y: number } }[],
  };

  const queue: LayoutNode[] = [...root.children];
  while (queue.length > 0) {
    const node = queue.shift()!;
    const position = { x: node.x, y: node.y };

    if (node.type === 'category') {
      result.categories.push({ id: node.id, position });
    } else if (node.type === 'skill') {
      result.skills.push({ id: node.id, position });
    }

    queue.push(...node.children);
  }

  return result;
}
