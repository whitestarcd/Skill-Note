/**
 * 媒体上传组件
 */

import React, { useRef } from 'react';

interface MediaUploaderProps {
  onUpload: (url: string, type: 'image' | 'video') => void;
}

export function MediaUploader({ onUpload }: MediaUploaderProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单实现：将文件转换为 Base64 URL
    // 生产环境应该上传到服务器
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onUpload(url, type);
    };
    reader.readAsDataURL(file);

    // 重置 input
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <span className="text-sm text-gray-600 dark:text-gray-400">插入媒体:</span>

      {/* 图片上传 */}
      <button
        onClick={() => imageInputRef.current?.click()}
        className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        🖼️ 图片
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
      />

      {/* 视频上传 */}
      <button
        onClick={() => videoInputRef.current?.click()}
        className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        🎬 视频
      </button>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
        className="hidden"
      />

      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
        (当前使用 Base64 存储，大文件建议上传到云存储)
      </span>
    </div>
  );
}
