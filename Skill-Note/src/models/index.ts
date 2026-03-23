/**
 * Skill-Note 数据模型
 */

/**
 * 内容类型
 */
export type ContentType = 'markdown' | 'image' | 'video';

/**
 * 节点内容
 */
export interface NodeContent {
  type: ContentType;
  data: string;  // Markdown 文本或媒体 URL
}

/**
 * 文档 (Document) - 根节点，对应文件夹
 * 可以包含多个子节点（分类/Skill）
 */
export interface Document {
  id: string;           // UUID
  title: string;        // 文档名称
  description: string;  // 描述
  childIds: string[];   // 子节点 ID 列表 (可以是 Category 或 Skill)
  content?: NodeContent; // 文档自身也可以有内容
  position?: {          // 思维导图中的位置
    x: number;
    y: number;
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * 分类 (Category)
 * 分类可以有子分类或 Skill，可以有内容
 */
export interface Category {
  id: string;           // UUID
  parentId: string;     // 父节点 ID (Document 或 Category ID)
  title: string;        // 分类标题
  description: string;  // 分类描述
  childIds?: string[];  // 子节点 ID 列表 (可以是 Category 或 Skill)
  content?: NodeContent; // 分类内容
  position?: {          // 思维导图中的位置
    x: number;
    y: number;
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * Skill (技能/知识点)
 * 可以有子节点（Category 或 Skill），可以有内容
 */
export interface Skill {
  id: string;           // UUID
  parentId: string;     // 父节点 ID (Document 或 Category ID)
  title: string;        // Skill 标题
  description: string;  // Skill 描述 (简短概述)
  content: NodeContent; // 详细内容
  tags: string[];       // 标签
  childIds?: string[];  // 子节点 ID 列表 (可以是 Category 或 Skill)
  position?: {          // 思维导图中的位置
    x: number;
    y: number;
  };
  createdAt: number;
  updatedAt: number;
}

/**
 * 节点类型
 * - document: 文档（根节点，文件夹）必须是根节点，可以有多个
 * - category: 分类，可与 Skill 平级
 * - skill: 技能/知识点，叶节点
 */
export type NodeType = 'document' | 'category' | 'skill';

/**
 * 思维导图节点 (联合类型，用于渲染)
 */
export type MindMapNode =
  | { type: 'document'; data: Document }
  | { type: 'category'; data: Category }
  | { type: 'skill'; data: Skill };

/**
 * 思维导图连线
 */
export interface MindMapEdge {
  id: string;
  fromId: string;  // 起始节点 ID
  toId: string;    // 目标节点 ID
  fromType: NodeType;
  toType: NodeType;
}

/**
 * 完整数据结构 (用于导入导出)
 */
export interface SkillNoteData {
  version: string;
  exportDate: number;
  documents: Document[];
  categories: Category[];
  skills: Skill[];
}
