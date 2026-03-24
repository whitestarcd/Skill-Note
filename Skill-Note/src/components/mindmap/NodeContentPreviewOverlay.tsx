import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronUp, ChevronDown, Minimize2, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { HybridMarkdownBlocksEditor } from '../editor/HybridMarkdownBlocksEditor';

export type PreviewNodeType = 'document' | 'category' | 'skill';

export interface PreviewNodeItem {
  id: string;
  type: PreviewNodeType;
  title: string;
  description?: string;
  markdown: string;
}

interface NodeContentPreviewOverlayProps {
  items: PreviewNodeItem[];
  initialNodeId: string;
  onClose: () => void;
  onUpdateMarkdown: (id: string, type: PreviewNodeType, markdown: string) => void;
  onUpdateTitle: (id: string, type: PreviewNodeType, title: string) => void;
  mediaDirectory?: string;
}

function renderTypeLabel(type: PreviewNodeType) {
  switch (type) {
    case 'document':
      return '文档';
    case 'category':
      return '分类';
    default:
      return 'Skill';
  }
}

export function NodeContentPreviewOverlay({
  items,
  initialNodeId,
  onClose,
  onUpdateMarkdown,
  onUpdateTitle,
  mediaDirectory,
}: NodeContentPreviewOverlayProps) {
  const MIN_CARD_WIDTH = 260;
  const MIN_CARD_HEIGHT = 320;
  const CARD_WIDTH_WITH_CHILDREN = 520;
  const getInitialCardSize = (hasChildren: boolean) => ({
    width: hasChildren ? CARD_WIDTH_WITH_CHILDREN : MIN_CARD_WIDTH,
    height: MIN_CARD_HEIGHT,
  });
  const initialIndex = Math.max(0, items.findIndex((item) => item.id === initialNodeId));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [expanded, setExpanded] = useState(true);
  const [showNavigator, setShowNavigator] = useState(true);
  const [titleDraft, setTitleDraft] = useState('');
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [cardSize, setCardSize] = useState(() => getInitialCardSize(items.length > 1));
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const resizeStateRef = useRef<{ startX: number; startY: number; originWidth: number; originHeight: number } | null>(null);

  useEffect(() => {
    const nextIndex = Math.max(0, items.findIndex((item) => item.id === initialNodeId));
    setActiveIndex(nextIndex);
    setExpanded(true);
    setCardPosition({ x: 0, y: 0 });
    setCardSize(getInitialCardSize(items.length > 1));
  }, [initialNodeId]);

  useEffect(() => {
    const clampToViewport = () => {
      const maxWidth = Math.max(MIN_CARD_WIDTH, window.innerWidth - 40);
      const maxHeight = Math.max(MIN_CARD_HEIGHT, window.innerHeight - 80);
      setCardSize((prev) => ({
        width: Math.min(prev.width, maxWidth),
        height: Math.min(prev.height, maxHeight),
      }));
    };

    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);

  useEffect(() => {
    if (activeIndex > items.length - 1) {
      setActiveIndex(Math.max(0, items.length - 1));
    }
  }, [activeIndex, items.length]);

  const activeItem = items[activeIndex] || items[0];

  useEffect(() => {
    if (!activeItem) {
      setTitleDraft('');
      return;
    }
    setTitleDraft(activeItem.title || '');
  }, [activeItem?.id, activeItem?.title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, items.length - 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [items.length, onClose]);

  if (!activeItem) return null;

  const canScroll = items.length > 1;

  const startResize = (event: React.MouseEvent<HTMLButtonElement>, direction: 'horizontal' | 'vertical') => {
    event.preventDefault();
    event.stopPropagation();

    const resizeStart = {
      startX: event.clientX,
      startY: event.clientY,
      originWidth: cardSize.width,
      originHeight: cardSize.height,
    };
    resizeStateRef.current = resizeStart;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const deltaX = moveEvent.clientX - resizeStart.startX;
      const deltaY = moveEvent.clientY - resizeStart.startY;
      const maxWidth = Math.max(MIN_CARD_WIDTH, window.innerWidth - 40);
      const maxHeight = Math.max(MIN_CARD_HEIGHT, window.innerHeight - 80);

      setCardSize((prev) => ({
        width:
          direction === 'horizontal'
            ? Math.min(Math.max(MIN_CARD_WIDTH, resizeStart.originWidth + deltaX), maxWidth)
            : prev.width,
        height:
          direction === 'vertical'
            ? Math.min(Math.max(MIN_CARD_HEIGHT, resizeStart.originHeight + deltaY), maxHeight)
            : prev.height,
      }));
    };

    const onMouseUp = () => {
      resizeStateRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (!expanded) {
    return (
      <div className="absolute top-4 right-4 z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 px-2 py-1.5 shadow-lg backdrop-blur">
          {canScroll && (
            <>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={activeIndex === 0}
                aria-label="上一个节点"
                onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
              >
                <ChevronUp size={14} />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-300 px-1">{activeIndex + 1}/{items.length}</span>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={activeIndex === items.length - 1}
                aria-label="下一个节点"
                onClick={() => setActiveIndex((index) => Math.min(index + 1, items.length - 1))}
              >
                <ChevronDown size={14} />
              </button>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="展开卡片"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="关闭预览"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="absolute pointer-events-auto"
        style={{
          left: '50%',
          top: '50%',
          width: cardSize.width,
          transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px))`,
        }}
      >
        <div className="absolute -top-12 right-0 z-20 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-colors"
            aria-label="收起"
            onClick={() => setExpanded(false)}
          >
            <Minimize2 size={16} />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-colors"
            aria-label="关闭"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
          style={{ height: cardSize.height }}
          onWheel={(event) => {
            // 默认保留滚轮滚动内容，按住 Ctrl 时才调整卡片宽度。
            if (!event.ctrlKey) return;

            event.preventDefault();
            event.stopPropagation();

            const maxWidth = Math.max(MIN_CARD_WIDTH, window.innerWidth - 40);
            const widthDelta = -event.deltaY * 0.45;

            setCardSize((prev) => ({
              ...prev,
              width: Math.min(Math.max(MIN_CARD_WIDTH, prev.width + widthDelta), maxWidth),
            }));
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-10 cursor-move z-10"
            onMouseDown={(event) => {
              if ((event.target as HTMLElement).closest('button, input, textarea')) return;
              const dragStart = {
                startX: event.clientX,
                startY: event.clientY,
                originX: cardPosition.x,
                originY: cardPosition.y,
              };
              dragStateRef.current = dragStart;

              const onMouseMove = (moveEvent: MouseEvent) => {
                if (!dragStateRef.current) return;
                const deltaX = moveEvent.clientX - dragStart.startX;
                const deltaY = moveEvent.clientY - dragStart.startY;
                setCardPosition({
                  x: dragStart.originX + deltaX,
                  y: dragStart.originY + deltaY,
                });
              };

              const onMouseUp = () => {
                dragStateRef.current = null;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };

              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />

          <div className={`absolute top-3 z-10 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 ${showNavigator ? 'right-[11rem] translate-x-1/2' : 'right-4'}`}>
            {canScroll && (
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={showNavigator ? '收起节点列表' : '展开节点列表'}
                onClick={() => setShowNavigator((value) => !value)}
              >
                {showNavigator ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            )}
          </div>

          <div className="flex h-full max-h-full">
            <section className="flex-1 min-w-0 overflow-auto px-4 py-4">
              <header className="mb-3 pr-16">
                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {renderTypeLabel(activeItem.type)}
                </div>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitleDraft(nextTitle);
                    onUpdateTitle(activeItem.id, activeItem.type, nextTitle);
                  }}
                  className="mt-2 w-full bg-transparent text-xl font-bold text-gray-900 dark:text-white border-none outline-none focus:ring-0"
                  placeholder="未命名节点"
                />
              </header>

              <HybridMarkdownBlocksEditor
                value={activeItem.markdown || activeItem.description || ''}
                onChange={(nextMarkdown) => onUpdateMarkdown(activeItem.id, activeItem.type, nextMarkdown)}
                className="mindmap-card-editor"
                compact
                mediaDirectory={mediaDirectory}
              />
            </section>

            <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-gray-500/70 dark:text-gray-300/55">
              Ctrl + 滚轮：调宽
            </div>

            {canScroll && showNavigator && (
              <aside className="w-44 border-l border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 flex flex-col">
                <div className="px-3 pt-3 pb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>节点卡片</span>
                  <span>点击标题切换</span>
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-3">
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`w-full text-left rounded-lg border px-2.5 py-2.5 transition-all ${
                        index === activeIndex
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {renderTypeLabel(item.type)}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {item.title || '未命名节点'}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            )}
          </div>

          <button
            type="button"
            className="absolute top-0 right-0 h-full w-2 cursor-ew-resize opacity-0"
            aria-label="左右调整卡片宽度"
            onMouseDown={(event) => startResize(event, 'horizontal')}
          />
          <button
            type="button"
            className="absolute left-0 bottom-0 h-2 w-full cursor-ns-resize opacity-0"
            aria-label="上下调整卡片高度"
            onMouseDown={(event) => startResize(event, 'vertical')}
          />
        </div>
      </div>
    </div>
  );
}
