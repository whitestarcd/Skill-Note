/**
 * 编辑器工具栏
 * 提供 Markdown 语法快速插入
 */

import React from 'react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}

interface EditorToolbarProps {}

function ToolbarButton({ icon, title, onClick, active }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

export function EditorToolbar({}: EditorToolbarProps) {
  // 插入 Markdown 语法到编辑器
  const insertSyntax = (syntax: string) => {
    const event = new CustomEvent('insert-markdown', { detail: { syntax } });
    window.dispatchEvent(event);
  };

  return (
    <div className="h-10 flex items-center px-2 gap-1 bg-gray-50 dark:bg-gray-900">
      {/* 标题 */}
      <ToolbarButton icon={<span className="text-sm font-bold">H1</span>} title="标题 1" onClick={() => insertSyntax('# ')} />
      <ToolbarButton icon={<span className="text-sm font-bold">H2</span>} title="标题 2" onClick={() => insertSyntax('## ')} />
      <ToolbarButton icon={<span className="text-sm font-bold">H3</span>} title="标题 3" onClick={() => insertSyntax('### ')} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* 格式 */}
      <ToolbarButton icon={<span className="text-sm font-bold">B</span>} title="粗体 (Ctrl+B)" onClick={() => insertSyntax('****')} />
      <ToolbarButton icon={<span className="text-sm italic">I</span>} title="斜体 (Ctrl+I)" onClick={() => insertSyntax('**')} />
      <ToolbarButton icon={<span className="text-sm line-through">S</span>} title="删除线" onClick={() => insertSyntax('~~~~')} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* 列表 */}
      <ToolbarButton icon={<span className="text-sm">•</span>} title="无序列表" onClick={() => insertSyntax('- ')} />
      <ToolbarButton icon={<span className="text-sm">1.</span>} title="有序列表" onClick={() => insertSyntax('1. ')} />
      <ToolbarButton icon={<span className="text-sm">☐</span>} title="任务列表" onClick={() => insertSyntax('- [ ] ')} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* 引用和代码 */}
      <ToolbarButton icon={<span className="text-sm">❝</span>} title="引用" onClick={() => insertSyntax('> ')} />
      <ToolbarButton icon={<span className="text-sm">&lt;/&gt;</span>} title="代码块" onClick={() => insertSyntax('```\n\n```')} />
      <ToolbarButton icon={<span className="text-sm">`</span>} title="行内代码" onClick={() => insertSyntax('``')} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* 链接和图片 */}
      <ToolbarButton icon={<span className="text-sm">🔗</span>} title="链接" onClick={() => insertSyntax('[](url)')} />
      <ToolbarButton icon={<span className="text-sm">🖼️</span>} title="图片" onClick={() => insertSyntax('![](url)')} />

      <div className="flex-1" />
    </div>
  );
}
