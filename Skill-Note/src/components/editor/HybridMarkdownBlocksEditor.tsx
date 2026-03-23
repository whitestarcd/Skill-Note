import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface HybridMarkdownBlocksEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  enableInsertEvent?: boolean;
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

  let workingText = markdownText.replace(/\$\$([\s\S]+?)\$\$/g, (_full, rawLatex) => {
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
}: HybridMarkdownBlocksEditorProps) {
  const [blocks, setBlocks] = useState<string[]>(() => splitBlocks(value));
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const skipNextOnChangeRef = useRef(false);

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 28)}px`;
  };

  const valueFromBlocks = useMemo(() => joinBlocks(blocks), [blocks]);

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
    if (!enableInsertEvent) return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ syntax?: string }>;
      const syntax = customEvent.detail?.syntax;
      if (!syntax) return;

      const targetIndex = activeBlockIndex ?? 0;
      setActiveBlockIndex(targetIndex);

      setBlocks((prev) => {
        const next = [...prev];
        const current = next[targetIndex] || '';

        if (activeTextareaRef.current && activeBlockIndex !== null) {
          const start = activeTextareaRef.current.selectionStart;
          const end = activeTextareaRef.current.selectionEnd;
          next[targetIndex] = current.slice(0, start) + syntax + current.slice(end);

          requestAnimationFrame(() => {
            if (!activeTextareaRef.current) return;
            const nextPos = start + syntax.length;
            activeTextareaRef.current.focus();
            activeTextareaRef.current.setSelectionRange(nextPos, nextPos);
          });
          return next;
        }

        next[targetIndex] = `${current}${syntax}`;
        return next;
      });
    };

    window.addEventListener('insert-markdown', handler as EventListener);
    return () => window.removeEventListener('insert-markdown', handler as EventListener);
  }, [activeBlockIndex, enableInsertEvent]);

  return (
    <div className={`hybrid-md-container ${compact ? 'hybrid-md-compact' : ''} ${className || ''}`}>
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
    </div>
  );
}
