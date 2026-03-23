/**
 * 顶部工具栏组件
 */

import React from 'react';
import { Plus, Download, Upload, Map, Edit, Split, Sun, Moon, BookOpen } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useSkillStore } from '../stores/skillStore';
import { exportToFile, importFromFile } from '../services/storage';

export function TopBar() {
  const { viewMode, setViewMode, toggleDarkMode, darkMode } = useUIStore();
  const { exportData, importData, currentDocumentId, documents, addDocument, setCurrentDocument } = useSkillStore();

  // 视图模式按钮
  const viewModes: { mode: 'mindmap' | 'editor' | 'split'; label: string; icon: React.ReactNode }[] = [
    { mode: 'mindmap', label: '思维导图', icon: <Map size={16} /> },
    { mode: 'editor', label: '编辑器', icon: <Edit size={16} /> },
    { mode: 'split', label: '分屏', icon: <Split size={16} /> },
  ];

  // 导出处理
  const handleExport = () => {
    const data = exportData();
    exportToFile(data);
  };

  // 导入处理
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromFile(file);
      importData(data);
    } catch (err) {
      alert('导入失败：' + (err as Error).message);
    }
  };

  // 新建文档 - 创建后用户可以直接双击编辑标题
  const handleNewDocument = () => {
    // 默认标题，用户可以双击编辑
    const title = '新文档';
    const description = '';

    const newDocument = {
      id: crypto.randomUUID(),
      title,
      description,
      childIds: [],
      position: { x: 400, y: 100 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addDocument(newDocument);
    setCurrentDocument(newDocument.id);
  };

  // 切换文档
  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDocument(e.target.value || null);
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <BookOpen size={24} className="text-blue-500" />
        <span className="font-semibold text-gray-800 dark:text-white">Skill-Note</span>
      </div>

      {/* 文档选择 */}
      <select
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        value={currentDocumentId || ''}
        onChange={handleDocumentChange}
      >
        <option value="">选择文档...</option>
        {documents.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.title}
          </option>
        ))}
      </select>

      {/* 视图切换 */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
        {viewModes.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
              viewMode === mode
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* 功能按钮 */}
      <div className="flex items-center gap-2">
        {/* 新建文档 */}
        <button
          onClick={handleNewDocument}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <Plus size={16} />
          <span>新建文档</span>
        </button>

        {/* 导入 */}
        <label className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer transition-colors flex items-center gap-1">
          <Upload size={16} />
          <span>导入</span>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        {/* 导出 */}
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        >
          <Download size={16} />
          <span>导出</span>
        </button>

        {/* 暗色模式 */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
