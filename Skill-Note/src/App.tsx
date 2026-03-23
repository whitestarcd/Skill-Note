/**
 * Skill-Note 主应用组件
 */

import React, { useEffect } from 'react';
import { useSkillStore } from './stores/skillStore';
import { useUIStore } from './stores/uiStore';
import { loadData, saveData } from './services/storage';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/sidebar/Sidebar';
import { MindMapView } from './components/mindmap/MindMapView';
import { EditorView } from './components/editor/EditorView';
import { Breadcrumb } from './components/breadcrumb/Breadcrumb';

function App() {
  const { viewMode, darkMode } = useUIStore();
  const { importData, exportData } = useSkillStore();

  // 加载数据
  useEffect(() => {
    loadData().then((data) => {
      if (data) {
        importData(data);
      }
    });
  }, []);

  // 自动保存
  useEffect(() => {
    const interval = setInterval(() => {
      const data = exportData();
      saveData(data);
    }, 30000); // 每 30 秒保存

    return () => clearInterval(interval);
  }, [exportData]);

  // 暗色模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部工具栏 */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 面包屑导航 */}
          <Breadcrumb />

          {/* 视图内容 */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'mindmap' && <MindMapView />}
            {viewMode === 'editor' && <EditorView />}
            {viewMode === 'split' && (
              <div className="h-full flex">
                <div className="w-1/2 border-r border-gray-200">
                  <MindMapView />
                </div>
                <div className="w-1/2">
                  <EditorView />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
