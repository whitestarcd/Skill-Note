import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import 'katex/dist/katex.min.css';

interface HybridMarkdownBlocksEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  enableInsertEvent?: boolean;
  mediaDirectory?: string;
}

function splitBlocks(markdown: string): string[] {
  if (!markdown.trim()) return [''];

  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let i = 0;
  let inFence = false;
  let currentFence: string[] = [];

  const isStructuredLine = (line: string) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('>') ||
      /^[-*+]\s/.test(trimmed) ||
      /^\d+\.\s/.test(trimmed) ||
      /^#{1,6}\s/.test(trimmed) ||
      /^\[!\w+\]/.test(trimmed)
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inFence) {
        inFence = true;
        currentFence = [line];
      } else {
        currentFence.push(line);
        blocks.push(currentFence.join('\n'));
        currentFence = [];
        inFence = false;
      }
      i += 1;
      continue;
    }

    if (inFence) {
      currentFence.push(line);
      i += 1;
      continue;
    }

    if (trimmed === '') {
      blocks.push('');
      i += 1;
      continue;
    }

    if (isStructuredLine(line)) {
      blocks.push(line);
      i += 1;
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      if (nextTrimmed === '' || isStructuredLine(nextLine) || nextTrimmed.startsWith('```')) {
        break;
      }
      paragraph.push(nextLine);
      i += 1;
    }
    blocks.push(paragraph.join('\n'));
  }

  if (inFence && currentFence.length > 0) {
    blocks.push(currentFence.join('\n'));
  }

  return blocks.length > 0 ? blocks : [''];
}

function joinBlocks(blocks: string[]): string {
  const normalized = blocks.map((block) => block.replace(/\s+$/g, ''));
  return normalized.join('\n\n').trimEnd();
}

function renderMarkdownToHtml(markdownText: string): string {
  const blockStore: string[] = [];
  const inlineStore: string[] = [];

  const normalizedMarkdownText = markdownText.replace(
    /https?:\/\/asset\.localhost\/[\w\-./%:]+/gi,
    (url) => url.replace(/%5C/gi, '/').replace(/\\/g, '/')
  );

  let workingText = normalizedMarkdownText.replace(/\$\$([\s\S]+?)\$\$/g, (_full, rawLatex) => {
    const latex = String(rawLatex || '').trim();
    const html = `<div class="sn-math-block">${katex.renderToString(latex, {
      throwOnError: false,
      strict: 'ignore',
      displayMode: true,
    })}</div>`;
    const token = `@@SN_MATH_BLOCK_${blockStore.length}@@`;
    blockStore.push(html);
    return token;
  });

  workingText = workingText.replace(/\$([^$\n]+?)\$/g, (_full, rawLatex) => {
    const latex = String(rawLatex || '').trim();
    const html = `<span class="sn-math-inline">${katex.renderToString(latex, {
      throwOnError: false,
      strict: 'ignore',
      displayMode: false,
    })}</span>`;
    const token = `@@SN_MATH_INLINE_${inlineStore.length}@@`;
    inlineStore.push(html);
    return token;
  });

  let html = marked.parse(workingText, {
    gfm: true,
    breaks: true,
    pedantic: false,
  }) as string;

  blockStore.forEach((blockHtml, index) => {
    html = html.split(`@@SN_MATH_BLOCK_${index}@@`).join(blockHtml);
  });

  inlineStore.forEach((inlineHtml, index) => {
    html = html.split(`@@SN_MATH_INLINE_${index}@@`).join(inlineHtml);
  });

  html = html.replace(
    /<blockquote>\s*<p>\[!(tip|example|question|warning|note)\]\s*([^<]*)<\/p>([\s\S]*?)<\/blockquote>/gi,
    (_full, type, title, body) => {
      const lowerType = String(type).toLowerCase();
      const safeTitle = title?.trim() || lowerType;
      return `<div class="mindmap-callout mindmap-callout-${lowerType}"><div class="mindmap-callout-title">${safeTitle}</div><div class="mindmap-callout-body">${body}</div></div>`;
    }
  );

  return DOMPurify.sanitize(html);
}

export function HybridMarkdownBlocksEditor({
  value,
  onChange,
  placeholder = '开始输入...',
  className,
  compact = false,
  enableInsertEvent = false,
  mediaDirectory,
}: HybridMarkdownBlocksEditorProps) {
  const [blocks, setBlocks] = useState<string[]>(() => splitBlocks(value));
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const activeBlockIndexRef = useRef<number | null>(null);
  const skipNextOnChangeRef = useRef(false);

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 28)}px`;
  };

  const valueFromBlocks = useMemo(() => joinBlocks(blocks), [blocks]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });

  const getExtensionFromFile = (file: File, fallback: 'png' | 'mp4') => {
    const fromName = file.name.split('.').pop()?.trim().toLowerCase();
    if (fromName) return fromName;
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
    };
    return mimeMap[file.type] || fallback;
  };

  const tryPersistMediaFile = async (file: File, type: 'image' | 'video') => {
    const dataUrl = await fileToDataUrl(file);
    const base64Payload = dataUrl.split(',')[1];
    if (!base64Payload) return dataUrl;

    const fallbackExt = type === 'image' ? 'png' : 'mp4';
    const extension = getExtensionFromFile(file, fallbackExt);

    try {
      const savedPath = await invoke<string>('save_media_file', {
        base64Data: base64Payload,
        extension,
        documentDir: mediaDirectory,
      });
      const normalizedPath = savedPath.replace(/\\/g, '/');
      return convertFileSrc(normalizedPath).replace(/%5C/g, '/');
    } catch (_error) {
      // Browser mode or command unavailable: keep original data URL behavior.
      return dataUrl;
    }
  };

  const insertSyntax = (syntax: string) => {
    setBlocks((prev) => {
      const next = [...prev];
      const fallbackIndex = Math.max(next.length - 1, 0);
      const targetIndex = activeBlockIndexRef.current ?? fallbackIndex;
      const current = next[targetIndex] || '';
      const textarea = activeTextareaRef.current;

      if (textarea && activeBlockIndexRef.current !== null) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        next[targetIndex] = current.slice(0, start) + syntax + current.slice(end);

        requestAnimationFrame(() => {
          if (!activeTextareaRef.current) return;
          const nextPos = start + syntax.length;
          activeTextareaRef.current.focus();
          activeTextareaRef.current.setSelectionRange(nextPos, nextPos);
          autoResizeTextarea(activeTextareaRef.current);
        });
      } else {
        const separator = current.trim() ? '\n\n' : '';
        next[targetIndex] = `${current}${separator}${syntax}`;
        setActiveBlockIndex(targetIndex);
      }

      return next;
    });
  };

  const insertMediaSyntax = async (file: File, type: 'image' | 'video') => {
    const url = await tryPersistMediaFile(file, type);
    const syntax = type === 'image'
      ? `![${file.name || 'image'}](${url})`
      : `<video controls src="${url}"></video>`;
    insertSyntax(syntax);
  };

  useEffect(() => {
    if (value !== valueFromBlocks) {
      skipNextOnChangeRef.current = true;
      setBlocks(splitBlocks(value));
      setActiveBlockIndex(null);
    }
  }, [value]);

  useEffect(() => {
    if (skipNextOnChangeRef.current) {
      skipNextOnChangeRef.current = false;
      return;
    }
    onChange(valueFromBlocks);
  }, [valueFromBlocks]);

  useEffect(() => {
    activeBlockIndexRef.current = activeBlockIndex;
  }, [activeBlockIndex]);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('scroll', closeMenu, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!enableInsertEvent) return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ syntax?: string }>;
      const syntax = customEvent.detail?.syntax;
      if (!syntax) return;

      insertSyntax(syntax);
    };

    window.addEventListener('insert-markdown', handler as EventListener);
    return () => window.removeEventListener('insert-markdown', handler as EventListener);
  }, [enableInsertEvent]);

  return (
    <div
      className={`hybrid-md-container ${compact ? 'hybrid-md-compact' : ''} ${className || ''}`}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
      onPasteCapture={(event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageFiles = items
          .filter((item) => item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter((file): file is File => Boolean(file));

        if (imageFiles.length === 0) return;

        event.preventDefault();
        void (async () => {
          for (const file of imageFiles) {
            await insertMediaSyntax(file, 'image');
          }
        })();
      }}
    >
      {blocks.map((block, index) => {
        const isActive = activeBlockIndex === index;

        if (isActive) {
          return (
            <div key={`editor-${index}`} className="hybrid-md-block-active">
              <textarea
                ref={(node) => {
                  if (node) {
                    activeTextareaRef.current = node;
                    autoResizeTextarea(node);
                  }
                }}
                className="hybrid-md-textarea"
                value={block}
                onChange={(event) => {
                  const next = [...blocks];
                  next[index] = event.target.value;
                  setBlocks(next);
                  autoResizeTextarea(event.target);
                }}
                onBlur={() => setActiveBlockIndex(null)}
                autoFocus
              />
            </div>
          );
        }

        const html = renderMarkdownToHtml(block || '&nbsp;');

        return (
          <div
            key={`render-${index}`}
            className="hybrid-md-block-rendered mindmap-preview-content"
            onClick={() => setActiveBlockIndex(index)}
            dangerouslySetInnerHTML={{ __html: html || '<p>&nbsp;</p>' }}
          />
        );
      })}

      {blocks.length === 0 && (
        <div className="hybrid-md-empty" onClick={() => setActiveBlockIndex(0)}>{placeholder}</div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 min-w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              setContextMenu(null);
              imageInputRef.current?.click();
            }}
          >
            添加图片
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              setContextMenu(null);
              videoInputRef.current?.click();
            }}
          >
            添加视频
          </button>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void insertMediaSyntax(file, 'image');
          }
          event.target.value = '';
        }}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void insertMediaSyntax(file, 'video');
          }
          event.target.value = '';
        }}
      />
    </div>
  );
}
