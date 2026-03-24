/**
 * 编辑器视图组件
 * 参考 Joplin 实现，纯 Markdown 编辑器模式
 * 支持 document, category, skill 都可以有内容
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSkillStore } from '../../stores/skillStore';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownEditor } from './MarkdownEditor';
import { ContentType } from '../../models';

export function EditorView() {
  const { currentDocumentId, selectedNodeId, selectedNodeType, documents, categories, skills, updateDocument, updateCategory, updateSkill } = useSkillStore();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 获取当前选中的节点及其内容
  const getCurrentNode = () => {
    if (!selectedNodeId || !selectedNodeType) return null;

    switch (selectedNodeType) {
      case 'document': {
        const doc = documents.find(d => d.id === selectedNodeId);
        if (!doc) return null;
        const content = doc.content || { type: 'markdown' as ContentType, data: '' };
        return {
          id: doc.id,
          type: 'document' as const,
          title: doc.title,
          description: doc.description,
          content,
          updateTitle: (newTitle: string) => {
            updateDocument(doc.id, { title: newTitle });
          },
          updateContent: (newContent: string) => {
            updateDocument(doc.id, { content: { ...content, data: newContent } });
          },
        };
      }
      case 'category': {
        const cat = categories.find(c => c.id === selectedNodeId);
        if (!cat) return null;
        const content = cat.content || { type: 'markdown' as ContentType, data: '' };
        return {
          id: cat.id,
          type: 'category' as const,
          title: cat.title,
          description: cat.description,
          content,
          updateTitle: (newTitle: string) => {
            updateCategory(cat.id, { title: newTitle });
          },
          updateContent: (newContent: string) => {
            updateCategory(cat.id, { content: { ...content, data: newContent } });
          },
        };
      }
      case 'skill': {
        const skill = skills.find(s => s.id === selectedNodeId);
        if (!skill) return null;
        const content = skill.content || { type: 'markdown' as ContentType, data: '' };
        return {
          id: skill.id,
          type: 'skill' as const,
          title: skill.title,
          description: skill.description,
          content,
          updateTitle: (newTitle: string) => {
            updateSkill(skill.id, { title: newTitle });
          },
          updateContent: (newContent: string) => {
            updateSkill(skill.id, { content: { ...content, data: newContent } });
          },
        };
      }
      default:
        return null;
    }
  };

  const currentNode = getCurrentNode();
  const currentDocument = currentDocumentId ? documents.find((doc) => doc.id === currentDocumentId) : null;
  const mediaDirectory = currentDocument
    ? `${currentDocument.title || 'untitled'}-${currentDocument.id}`
    : 'untitled-document';

  // 更新内容和标题状态
  useEffect(() => {
    if (!currentNode) return;
    setContent(currentNode.content.data);
    setTitle(currentNode.title);
  }, [currentNode]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (currentNode) {
      currentNode.updateContent(newContent);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentNode) {
      currentNode.updateTitle(newTitle);
    }
  };

  // Handle media insert - just insert the markdown syntax, content will be updated via onChange
  const handleMediaInsert = (type: 'image' | 'video', url: string) => {
    // Media insertion is handled by MarkdownEditor internally
    // The URL is temporary (object URL), in production you would upload to server
    console.log('Media inserted:', type, url);
  };

  if (!currentNode) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">📝</p>
          <p>请在思维导图中选择一个节点进行编辑</p>
          <p className="text-sm mt-2">文档、分类、Skill 都支持编辑内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* 标题编辑区 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full text-2xl font-bold bg-transparent text-gray-900 dark:text-white border-none outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600"
          placeholder="输入标题..."
        />
      </div>

      {/* 编辑器工具栏 */}
      <EditorToolbar />

      {/* 编辑器区域 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MarkdownEditor
          initialValue={content}
          onChange={handleContentChange}
          onMediaInsert={handleMediaInsert}
          mediaDirectory={mediaDirectory}
        />
      </div>
    </div>
  );
}
