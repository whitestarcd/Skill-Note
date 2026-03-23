/**
 * Skill 数据状态管理
 * 使用 Zustand 进行状态管理
 */

import { create } from 'zustand';
import { Document, Category, Skill, SkillNoteData, NodeType } from '../models';
import { autoLayout, layoutSubtree } from '../utils/autoLayout';

const DEFAULT_PARENT_POSITION = { x: 100, y: 100 };

function applyLocalLayoutForParent(
  documents: Document[],
  categories: Category[],
  skills: Skill[],
  parentId: string
): {
  documents: Document[];
  categories: Category[];
  skills: Skill[];
} {
  const parentDoc = documents.find(d => d.id === parentId);
  const parentCat = categories.find(c => c.id === parentId);
  const parentSkill = skills.find(s => s.id === parentId);

  let parentType: 'document' | 'category' | 'skill' | null = null;
  let parentPosition = DEFAULT_PARENT_POSITION;

  if (parentDoc) {
    parentType = 'document';
    parentPosition = parentDoc.position || DEFAULT_PARENT_POSITION;
  } else if (parentCat) {
    parentType = 'category';
    parentPosition = parentCat.position || DEFAULT_PARENT_POSITION;
  } else if (parentSkill) {
    parentType = 'skill';
    parentPosition = parentSkill.position || DEFAULT_PARENT_POSITION;
  }

  if (!parentType) {
    return { documents, categories, skills };
  }

  const subtreePositions = layoutSubtree(
    parentId,
    parentType,
    documents,
    categories,
    skills,
    parentPosition
  );

  const categoryPositionMap = new Map(subtreePositions.categories.map(c => [c.id, c.position]));
  const skillPositionMap = new Map(subtreePositions.skills.map(s => [s.id, s.position]));

  return {
    documents,
    categories: categories.map(category => {
      const position = categoryPositionMap.get(category.id);
      return position ? { ...category, position } : category;
    }),
    skills: skills.map(skill => {
      const position = skillPositionMap.get(skill.id);
      return position ? { ...skill, position } : skill;
    }),
  };
}

interface SkillState {
  documents: Document[];
  categories: Category[];
  skills: Skill[];
  currentDocumentId: string | null;
  selectedNodeId: string | null;
  selectedNodeType: 'document' | 'category' | 'skill' | null;

  // CRUD for Document
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  // CRUD for Category
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string, mode?: 'cascade' | 'promote') => void;

  // CRUD for Skill
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string, mode?: 'cascade' | 'promote') => void;

  // Selection
  setCurrentDocument: (documentId: string | null) => void;
  setSelectedNode: (nodeId: string | null, nodeType: 'document' | 'category' | 'skill' | null) => void;

  // Import/Export
  importData: (data: SkillNoteData) => void;
  exportData: () => SkillNoteData;
  clearAll: () => void;

  // Layout
  autoLayout: (documentId?: string, canvasSize?: { width: number; height: number }) => void;

  // Helper methods
  getChildrenOfNode: (parentId: string) => Array<{ type: NodeType; data: Document | Category | Skill }>;
  getAllDescendantIds: (parentId: string) => string[];
}

export const useSkillStore = create<SkillState>((set, get) => ({
  documents: [],
  categories: [],
  skills: [],
  currentDocumentId: null,
  selectedNodeId: null,
  selectedNodeType: null,

  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document]
  })),

  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map(d => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d)
  })),

  deleteDocument: (id) => set((state) => {
    const descendantIds = get().getAllDescendantIds(id);
    return {
      documents: state.documents.filter(d => d.id !== id),
      categories: state.categories.filter(c => !descendantIds.includes(c.id)),
      skills: state.skills.filter(s => !descendantIds.includes(s.id)),
      currentDocumentId: state.currentDocumentId === id ? null : state.currentDocumentId,
    };
  }),

  addCategory: (category) => set((state) => {
    const parentId = category.parentId;
    const parentDoc = state.documents.find(d => d.id === parentId);
    const parentCat = state.categories.find(c => c.id === parentId);
    const parentSkill = state.skills.find(s => s.id === parentId);

    if (parentDoc) {
      const nextDocuments = state.documents.map(d =>
        d.id === parentId
          ? { ...d, childIds: Array.from(new Set([...(d.childIds || []), category.id])), updatedAt: Date.now() }
          : d
      );
      const nextCategories = [...state.categories, category];
      return applyLocalLayoutForParent(nextDocuments, nextCategories, state.skills, parentId);
    }

    if (parentCat) {
      const nextCategories = [
        ...state.categories.filter(c => c.id !== parentId),
        { ...parentCat, childIds: Array.from(new Set([...(parentCat.childIds || []), category.id])), updatedAt: Date.now() },
        category,
      ];
      return applyLocalLayoutForParent(state.documents, nextCategories, state.skills, parentId);
    }

    if (parentSkill) {
      const nextCategories = [...state.categories, category];
      const nextSkills = state.skills.map(s =>
        s.id === parentId
          ? { ...s, childIds: Array.from(new Set([...(s.childIds || []), category.id])), updatedAt: Date.now() }
          : s
      );
      return applyLocalLayoutForParent(state.documents, nextCategories, nextSkills, parentId);
    }

    return { categories: [...state.categories, category] };
  }),

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c)
  })),

  deleteCategory: (id, mode = 'cascade') => set((state) => {
    const category = state.categories.find(c => c.id === id);
    if (!category) return state;

    const parentId = category.parentId;
    const parentDoc = state.documents.find(d => d.id === parentId);
    const parentCat = state.categories.find(c => c.id === parentId);
    const parentSkill = state.skills.find(s => s.id === parentId);

    if (mode === 'promote') {
      const promotedChildIds = category.childIds || [];
      const reparentCategoryChildIds = new Set(
        state.categories
          .filter(c => promotedChildIds.includes(c.id))
          .map(c => c.id)
      );
      const reparentSkillChildIds = new Set(
        state.skills
          .filter(s => promotedChildIds.includes(s.id))
          .map(s => s.id)
      );

      if (parentDoc) {
        const current = parentDoc.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          categories: state.categories
            .filter(c => c.id !== id)
            .map(c => reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c),
          skills: state.skills.map(s => reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s),
          documents: state.documents.map(d =>
            d.id === parentId
              ? { ...d, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() }
              : d
          ),
        };
      } else if (parentCat) {
        const current = parentCat.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          categories: state.categories
            .filter(c => c.id !== id)
            .map(c => {
              if (c.id === parentId) {
                return { ...c, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() };
              }
              return reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c;
            }),
          skills: state.skills.map(s => reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s),
        };
      } else if (parentSkill) {
        const current = parentSkill.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          categories: state.categories
            .filter(c => c.id !== id)
            .map(c => reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c),
          skills: state.skills.map(s => {
            if (s.id === parentId) {
              return { ...s, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() };
            }
            return reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s;
          }),
        };
      }

      return {
        categories: state.categories.filter(c => c.id !== id),
      };
    }

    // Delete all children recursively
    const descendantIds = get().getAllDescendantIds(id);

    if (parentDoc) {
      return {
        categories: state.categories.filter(c => c.id !== id && !descendantIds.includes(c.id)),
        skills: state.skills.filter(s => !descendantIds.includes(s.id)),
        documents: state.documents.map(d =>
          d.id === parentId
            ? { ...d, childIds: (d.childIds || []).filter(cid => cid !== id), updatedAt: Date.now() }
            : d
        ),
      };
    } else if (parentCat) {
      return {
        categories: [
          ...state.categories.filter(c => c.id !== id && !descendantIds.includes(c.id) && c.id !== parentId),
          {
            ...parentCat,
            childIds: (parentCat.childIds || []).filter(cid => cid !== id),
          }
        ],
        skills: state.skills.filter(s => !descendantIds.includes(s.id)),
      };
    } else if (parentSkill) {
      return {
        categories: state.categories.filter(c => c.id !== id && !descendantIds.includes(c.id)),
        skills: [
          ...state.skills.filter(s => s.id !== id && !descendantIds.includes(s.id) && s.id !== parentId),
          {
            ...parentSkill,
            childIds: (parentSkill.childIds || []).filter(cid => cid !== id),
          }
        ],
      };
    }
    return {
      categories: state.categories.filter(c => c.id !== id),
      skills: state.skills.filter(s => !descendantIds.includes(s.id)),
    };
  }),

  addSkill: (skill) => set((state) => {
    const parentId = skill.parentId;
    const parentDoc = state.documents.find(d => d.id === parentId);
    const parentCat = state.categories.find(c => c.id === parentId);
    const parentSkill = state.skills.find(s => s.id === parentId);

    if (parentDoc) {
      const nextSkills = [...state.skills, skill];
      const nextDocuments = state.documents.map(d =>
        d.id === parentId
          ? { ...d, childIds: Array.from(new Set([...(d.childIds || []), skill.id])), updatedAt: Date.now() }
          : d
      );
      return applyLocalLayoutForParent(nextDocuments, state.categories, nextSkills, parentId);
    }

    if (parentCat) {
      const nextSkills = [...state.skills, skill];
      const nextCategories = state.categories.map(c =>
        c.id === parentId
          ? { ...c, childIds: Array.from(new Set([...(c.childIds || []), skill.id])), updatedAt: Date.now() }
          : c
      );
      return applyLocalLayoutForParent(state.documents, nextCategories, nextSkills, parentId);
    }

    if (parentSkill) {
      const nextSkills = [
        ...state.skills.filter(s => s.id !== parentId),
        { ...parentSkill, childIds: Array.from(new Set([...(parentSkill.childIds || []), skill.id])), updatedAt: Date.now() },
        skill,
      ];
      return applyLocalLayoutForParent(state.documents, state.categories, nextSkills, parentId);
    }

    return { skills: [...state.skills, skill] };
  }),

  updateSkill: (id, updates) => set((state) => ({
    skills: state.skills.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s)
  })),

  deleteSkill: (id, mode = 'cascade') => set((state) => {
    const skill = state.skills.find(s => s.id === id);
    if (!skill) return state;

    const parentId = skill.parentId;
    const parentDoc = state.documents.find(d => d.id === parentId);
    const parentCat = state.categories.find(c => c.id === parentId);
    const parentSkill = state.skills.find(s => s.id === parentId);

    if (mode === 'promote') {
      const promotedChildIds = skill.childIds || [];
      const reparentCategoryChildIds = new Set(
        state.categories
          .filter(c => promotedChildIds.includes(c.id))
          .map(c => c.id)
      );
      const reparentSkillChildIds = new Set(
        state.skills
          .filter(s => promotedChildIds.includes(s.id))
          .map(s => s.id)
      );

      if (parentDoc) {
        const current = parentDoc.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          skills: state.skills
            .filter(s => s.id !== id)
            .map(s => reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s),
          categories: state.categories.map(c => reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c),
          documents: state.documents.map(d =>
            d.id === parentId
              ? { ...d, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() }
              : d
          ),
        };
      } else if (parentCat) {
        const current = parentCat.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          skills: state.skills
            .filter(s => s.id !== id)
            .map(s => reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s),
          categories: state.categories.map(c => {
            if (c.id === parentId) {
              return { ...c, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() };
            }
            return reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c;
          }),
        };
      } else if (parentSkill) {
        const current = parentSkill.childIds || [];
        const removedIndex = current.findIndex(cid => cid === id);
        const nextChildIds = current.filter(cid => cid !== id);
        const insertionIndex = removedIndex >= 0 ? removedIndex : nextChildIds.length;
        nextChildIds.splice(insertionIndex, 0, ...promotedChildIds);

        return {
          skills: state.skills
            .filter(s => s.id !== id)
            .map(s => {
              if (s.id === parentId) {
                return { ...s, childIds: Array.from(new Set(nextChildIds)), updatedAt: Date.now() };
              }
              return reparentSkillChildIds.has(s.id) ? { ...s, parentId, updatedAt: Date.now() } : s;
            }),
          categories: state.categories.map(c => reparentCategoryChildIds.has(c.id) ? { ...c, parentId, updatedAt: Date.now() } : c),
        };
      }

      return {
        skills: state.skills.filter(s => s.id !== id),
      };
    }

    // Delete all children recursively
    const descendantIds = get().getAllDescendantIds(id);

    if (parentDoc) {
      // Parent is document
      return {
        skills: state.skills.filter(s => s.id !== id && !descendantIds.includes(s.id)),
        categories: state.categories.filter(c => !descendantIds.includes(c.id)),
        documents: state.documents.map(d =>
          d.id === parentId
            ? { ...d, childIds: (d.childIds || []).filter(sid => sid !== id), updatedAt: Date.now() }
            : d
        ),
      };
    } else if (parentCat) {
      // Parent is category
      return {
        skills: state.skills.filter(s => s.id !== id && !descendantIds.includes(s.id)),
        categories: [
          ...state.categories.filter(c => c.id !== parentId && !descendantIds.includes(c.id)),
          {
            ...parentCat,
            childIds: (parentCat.childIds || []).filter(sid => sid !== id),
          }
        ],
      };
    } else if (parentSkill) {
      // Parent is skill
      return {
        skills: [
          ...state.skills.filter(s => s.id !== id && !descendantIds.includes(s.id) && s.id !== parentId),
          {
            ...parentSkill,
            childIds: (parentSkill.childIds || []).filter(sid => sid !== id),
          }
        ],
        categories: state.categories.filter(c => !descendantIds.includes(c.id)),
      };
    }
    return {
      skills: state.skills.filter(s => s.id !== id && !descendantIds.includes(s.id)),
      categories: state.categories.filter(c => !descendantIds.includes(c.id)),
    };
  }),

  setCurrentDocument: (documentId) => set({ currentDocumentId: documentId }),

  setSelectedNode: (nodeId, nodeType) => set({
    selectedNodeId: nodeId,
    selectedNodeType: nodeType
  }),

  // Auto layout the mindmap
  autoLayout: (documentId, canvasSize) => {
    const state = get();
    const targetDocId = documentId || state.currentDocumentId;
    if (!targetDocId) return;

    const positions = autoLayout(state.documents, state.categories, state.skills, targetDocId, canvasSize);

    // Update all node positions
    set({
      documents: state.documents.map(doc => {
        const pos = positions.documents.find(p => p.id === doc.id);
        return pos ? { ...doc, position: pos.position } : doc;
      }),
      categories: state.categories.map(cat => {
        const pos = positions.categories.find(p => p.id === cat.id);
        return pos ? { ...cat, position: pos.position } : cat;
      }),
      skills: state.skills.map(skill => {
        const pos = positions.skills.find(p => p.id === skill.id);
        return pos ? { ...skill, position: pos.position } : skill;
      }),
    });
  },

  importData: (data) => set({
    documents: data.documents || [],
    categories: data.categories || [],
    skills: data.skills || [],
    currentDocumentId: data.documents[0]?.id ?? null,
  }),

  exportData: () => {
    const state = get();
    return {
      version: '2.0',
      exportDate: Date.now(),
      documents: state.documents,
      categories: state.categories,
      skills: state.skills,
    };
  },

  clearAll: () => set({
    documents: [],
    categories: [],
    skills: [],
    currentDocumentId: null,
    selectedNodeId: null,
    selectedNodeType: null,
  }),

  getChildrenOfNode: (parentId: string) => {
    const { documents, categories, skills } = get();
    const result: Array<{ type: NodeType; data: Document | Category | Skill }> = [];

    // Any node type can have children (树形结构特点)
    const parentDoc = documents.find(d => d.id === parentId);
    if (parentDoc && parentDoc.childIds) {
      parentDoc.childIds.forEach(childId => {
        const cat = categories.find(c => c.id === childId);
        if (cat) {
          result.push({ type: 'category', data: cat });
          return;
        }
        const skill = skills.find(s => s.id === childId);
        if (skill) {
          result.push({ type: 'skill', data: skill });
        }
      });
    }

    const parentCat = categories.find(c => c.id === parentId);
    if (parentCat && parentCat.childIds) {
      parentCat.childIds.forEach(childId => {
        const cat = categories.find(c => c.id === childId);
        if (cat) {
          result.push({ type: 'category', data: cat });
          return;
        }
        const skill = skills.find(s => s.id === childId);
        if (skill) {
          result.push({ type: 'skill', data: skill });
        }
      });
    }

    const parentSkill = skills.find(s => s.id === parentId);
    if (parentSkill && parentSkill.childIds) {
      parentSkill.childIds.forEach(childId => {
        const cat = categories.find(c => c.id === childId);
        if (cat) {
          result.push({ type: 'category', data: cat });
          return;
        }
        const skill = skills.find(s => s.id === childId);
        if (skill) {
          result.push({ type: 'skill', data: skill });
        }
      });
    }

    return result;
  },

  getAllDescendantIds: (parentId: string) => {
    const { documents, categories, skills } = get();
    const ids: string[] = [];
    const collectIds = (pId: string) => {
      // 查找父节点并收集其所有子节点
      const parentDoc = documents.find(d => d.id === pId);
      if (parentDoc && parentDoc.childIds) {
        parentDoc.childIds.forEach(childId => {
          if (!ids.includes(childId)) {
            ids.push(childId);
            collectIds(childId);  // 递归收集子节点
          }
        });
      }

      const parentCat = categories.find(c => c.id === pId);
      if (parentCat && parentCat.childIds) {
        parentCat.childIds.forEach(childId => {
          if (!ids.includes(childId)) {
            ids.push(childId);
            collectIds(childId);  // 递归收集子节点
          }
        });
      }

      const parentSkill = skills.find(s => s.id === pId);
      if (parentSkill && parentSkill.childIds) {
        parentSkill.childIds.forEach(childId => {
          if (!ids.includes(childId)) {
            ids.push(childId);
            collectIds(childId);  // 递归收集子节点
          }
        });
      }
    };
    collectIds(parentId);
    return ids;
  },
}));
