import React, { useEffect, useMemo } from 'react';
import { HybridMarkdownBlocksEditor } from './HybridMarkdownBlocksEditor';

interface MarkdownEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  onStatsChange?: (stats: { lines: number; words: number; chars: number }) => void;
  onMediaInsert?: (type: 'image' | 'video', url: string) => void;
}

function calculateStats(content: string) {
  const lines = content.split('\n').length;
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  return { lines, words, chars };
}

export function MarkdownEditor({
  initialValue,
  onChange,
  onStatsChange,
}: MarkdownEditorProps) {
  const stats = useMemo(() => calculateStats(initialValue), [initialValue]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats.lines, stats.words, stats.chars]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4 bg-gray-50 dark:bg-gray-900">
        <HybridMarkdownBlocksEditor
          value={initialValue}
          onChange={onChange}
          enableInsertEvent
          className="h-full"
          placeholder="开始输入 Markdown，点击任意区块可编辑原文"
        />
      </div>

      <div className="h-8 flex items-center justify-between px-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>行数：{stats.lines}</span>
          <span>字数：{stats.words}</span>
          <span>字符：{stats.chars}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">动态编辑渲染</div>
      </div>
    </div>
  );
}
