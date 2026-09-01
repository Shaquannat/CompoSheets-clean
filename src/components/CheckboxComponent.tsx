import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import type {
  CheckboxComponent as CheckboxComponentType,
  CheckboxItem,
} from '../types/worksheet';

type CheckboxComponentProps = {
  component: CheckboxComponentType;
  isSelected: boolean;
  isGroupSelected: boolean;
  findMatches?: {
    itemId: string;
    start: number;
    end: number;
  }[];
  
  activeFindMatch?: {
    itemId?: string;
    start: number;
    end: number;
  } | null;
  onSelect: (
    id: string,
    event?: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: CheckboxComponentType
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: CheckboxComponentType
  ) => void;
  onUpdateComponent: (
    id: string,
    changes: Partial<CheckboxComponentType>
  ) => void;
  onCheckboxInput?: (
    componentId: string,
    itemId: string,
    text: string
  ) => void;
  onSelectionChange?: (
    componentId: string,
    itemId: string,
    range: { start: number; end: number } | null
  ) => void;
};

export function CheckboxComponent({
  component,
isSelected,
isGroupSelected,
findMatches = [],
activeFindMatch,
onSelect,
  onStartDragging,
  onResizeStart,
  onUpdateComponent,
  onCheckboxInput,
onSelectionChange,
}: CheckboxComponentProps) {
  const selectionRef = useRef<{
    itemId: string;
    start: number;
    end: number;
  } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const activeItemIdRef = useRef<string | null>(null);
const caretOffsetRef = useRef(0);
const previousItemTextRef = useRef('');

  function updateItem(
    itemId: string,
    changes: Partial<CheckboxItem>
  ) {
    onUpdateComponent(component.id, {
      items: component.items.map((item) =>
        item.id === itemId
          ? { ...item, ...changes }
          : item
      ),
    });
  }

  function applyMark(item: CheckboxItem) {
    const sameMark =
      item.checked &&
      item.markStyle === component.markStyle &&
      item.markColor === component.markColor;
  
    const nextChecked = !sameMark;
  
    updateItem(item.id, {
      checked: nextChecked,
      markStyle: nextChecked
        ? component.markStyle
        : item.markStyle,
      markColor: nextChecked
        ? component.markColor
        : item.markColor,
    });
  }

  function resizeTextarea(
    textarea: HTMLTextAreaElement
  ) {
    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function getEditableText(element: HTMLElement) {
    return element.textContent ?? '';
  }

  function focusItem(
    itemId: string,
    caretPosition: 'start' | 'end' = 'end'
  ) {
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(
        `[data-checkbox-item-id="${itemId}"]`
      );
  
      if (!element) return;
  
      element.focus();
  
      if (element instanceof HTMLTextAreaElement) {
        const position =
          caretPosition === 'start'
            ? 0
            : element.value.length;
  
        element.setSelectionRange(position, position);
        resizeTextarea(element);
  
        return;
      }
  
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(caretPosition === 'start');
  
      const selection = window.getSelection();
  
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  useLayoutEffect(() => {
    const activeItemId = activeItemIdRef.current;
  
    if (!activeItemId) return;
  
    const activeItem = component.items.find(
      (item) => item.id === activeItemId
    );
  
    if (!activeItem) return;
  
    const editor = document.querySelector<HTMLElement>(
      `[data-checkbox-item-id="${activeItemId}"]`
    );
  
    if (!editor || document.activeElement !== editor) return;
  
    const previousText = previousItemTextRef.current;
    const nextText = activeItem.text;
  
    const wasAtEnd =
      caretOffsetRef.current >= previousText.length;
  
    if (wasAtEnd) {
      caretOffsetRef.current = nextText.length;
    } else {
      caretOffsetRef.current = Math.min(
        caretOffsetRef.current,
        nextText.length
      );
    }
  
    const targetOffset = caretOffsetRef.current;
  
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT
    );
  
    let currentOffset = 0;
    let currentNode = walker.nextNode();
  
    while (currentNode) {
      const nodeLength =
        currentNode.textContent?.length ?? 0;
  
      if (
        targetOffset <=
        currentOffset + nodeLength
      ) {
        const range = document.createRange();
  
        range.setStart(
          currentNode,
          Math.max(
            0,
            targetOffset - currentOffset
          )
        );
  
        range.collapse(true);
  
        const selection = window.getSelection();
  
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
  
        break;
      }
  
      currentOffset += nodeLength;
      currentNode = walker.nextNode();
    }
  
    previousItemTextRef.current = nextText;
  }, [component.items]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>(
        `[data-checkbox-component-id="${component.id}"]`
      );

      if (!root) return;

      const textareas =
        root.querySelectorAll<HTMLTextAreaElement>(
          'textarea[data-checkbox-item-id]'
        );

      textareas.forEach((textarea) => {
        resizeTextarea(textarea);
      });
    });
  }, [
    component.id,
    component.width,
    component.fontSize,
    component.bold,
    component.layout,
    component.items,
  ]);

  function renderCheckboxTextWithFindHighlight(
    text: string,
    offset: number,
    itemId: string
  ) {
    const itemMatches = findMatches
      .filter((match) => match.itemId === itemId);
  
    if (itemMatches.length === 0) return text;
  
    const segmentStart = offset;
    const segmentEnd = offset + text.length;
  
    const overlappingMatches = itemMatches
      .filter(
        (match) =>
          match.end > segmentStart &&
          match.start < segmentEnd
      )
      .sort((a, b) => a.start - b.start);
  
    if (overlappingMatches.length === 0) return text;
  
    const parts: ReactNode[] = [];
    let cursor = 0;
  
    for (const match of overlappingMatches) {
      const localStart = Math.max(
        0,
        match.start - segmentStart
      );
  
      const localEnd = Math.min(
        text.length,
        match.end - segmentStart
      );
  
      if (localStart > cursor) {
        parts.push(
          text.slice(cursor, localStart)
        );
      }
  
      const isActive =
        activeFindMatch?.itemId === itemId &&
        activeFindMatch.start === match.start &&
        activeFindMatch.end === match.end;
  
      parts.push(
        <mark
          key={`${itemId}-${match.start}-${match.end}-${offset}`}
          style={{
            backgroundColor: isActive
              ? '#FACC15'
              : '#FEF08A',
          }}
        >
          {text.slice(localStart, localEnd)}
        </mark>
      );
  
      cursor = Math.max(cursor, localEnd);
    }
  
    if (cursor < text.length) {
      parts.push(text.slice(cursor));
    }
  
    return <>{parts}</>;
  }

  return (
    <div
    data-checkbox-component-id={component.id}
    data-worksheet-component="true"
    className="absolute"
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        minHeight: component.height,
        border: isSelected
  ? '2px solid rgb(139 92 246)'
  : isHovered
    ? '1px solid rgb(196 181 253)'
    : '2px solid transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(component.id, event);
      }}
    >
      {isSelected && !component.locked && (
        <button
          type="button"
          aria-label="Drag checkbox component"
          title="Drag to move"
          onPointerDown={(event) =>
            onStartDragging(event, component)
          }
          className="flex h-7 w-7 cursor-move items-center justify-center rounded-full bg-violet-600 text-white"
          style={{
            position: 'absolute',
            left: '-14px',
            top: '-14px',
            zIndex: 9999,
          }}
        >
          ⋮⋮
        </button>
      )}

      <div
        className={
          component.layout === 'inline'
            ? 'flex flex-wrap items-start gap-x-8 gap-y-4'
            : 'flex flex-col gap-3'
        }
      >
        {component.items.map((item) => (
          <div
            key={item.id}
            className={
              component.layout === 'inline'
                ? 'flex max-w-full items-start gap-2'
                : 'flex w-full items-start gap-2'
            }
          >
            <button
              type="button"
              aria-label={
                item.checked
                  ? 'Clear checkbox mark'
                  : 'Mark checkbox'
              }
              title={
                item.checked
                  ? 'Click to clear'
                  : component.markStyle === 'check'
                    ? 'Click to check'
                    : 'Click to mark with X'
              }
              onClick={(event) => {
                event.stopPropagation();
                applyMark(item);
              }}
              className="flex shrink-0 items-center justify-center border border-slate-700 bg-white"
              style={{
                width: `${component.fontSize * 1.25}px`,
                height: `${component.fontSize * 1.25}px`,
                fontSize: `${component.fontSize}px`,
                lineHeight: 1,
                color: item.markColor,
              }}
            >
              {item.checked
                ? item.markStyle === 'check'
                  ? '✓'
                  : '×'
                : ''}
            </button>

            <div
  contentEditable
  suppressContentEditableWarning
  data-checkbox-item-id={item.id}
  data-placeholder={item.showPlaceholder ? 'Option' : ''}
  className="checkbox-item-editor min-w-0 bg-transparent outline-none"
  style={{
    width:
      component.layout === 'inline'
        ? `${Math.min(
            Math.max(
              96,
              item.text.length *
                component.fontSize *
                0.65
            ),
            Math.max(
              96,
              component.width - 50
            )
          )}px`
        : '100%',
    maxWidth: '100%',
    minHeight: `${component.fontSize * 1.35}px`,
    fontSize: `${component.fontSize}px`,
    fontFamily: component.fontFamily,
    fontWeight: component.bold ? 700 : 400,
    fontStyle: component.italic ? 'italic' : 'normal',
    textDecoration: component.underline
      ? 'underline'
      : 'none',
    lineHeight: 1.35,
    color: component.textColor,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  }}
  onPointerDown={(event) => {
    event.stopPropagation();
  
    if (
      !isSelected ||
      event.ctrlKey ||
      event.metaKey
    ) {
      event.preventDefault();
    }
  }}
  onClick={(event) => {
    event.stopPropagation();
    onSelect(component.id);
  }}
  onMouseUp={(event) => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (
      !event.currentTarget.contains(range.startContainer) ||
      !event.currentTarget.contains(range.endContainer)
    ) {
      return;
    }

    const beforeSelection = range.cloneRange();
    beforeSelection.selectNodeContents(event.currentTarget);
    beforeSelection.setEnd(
      range.startContainer,
      range.startOffset
    );

    const start =
      beforeSelection.toString().length;

    const end =
      start + range.toString().length;

    const nextRange =
      start !== end
        ? {
            start,
            end,
          }
        : null;

    selectionRef.current = nextRange
      ? {
          itemId: item.id,
          start,
          end,
        }
      : null;

    onSelectionChange?.(
      component.id,
      item.id,
      nextRange
    );
  }}
  onFocus={(event) => {
    activeItemIdRef.current = item.id;
    previousItemTextRef.current =
      getEditableText(event.currentTarget);
  }}

  onInput={(event) => {
    const updatedText =
      getEditableText(event.currentTarget);
  
    activeItemIdRef.current = item.id;
    previousItemTextRef.current = updatedText;
  
    const selection = window.getSelection();
  
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
  
      if (
        event.currentTarget.contains(
          range.endContainer
        )
      ) {
        const beforeCaret = range.cloneRange();
  
        beforeCaret.selectNodeContents(
          event.currentTarget
        );
  
        beforeCaret.setEnd(
          range.endContainer,
          range.endOffset
        );
  
        caretOffsetRef.current =
          beforeCaret.toString().length;
      }
    }
  
    onCheckboxInput?.(
      component.id,
      item.id,
      updatedText
    );
  }}

  onBlur={() => {
    activeItemIdRef.current = null;
  }}

  onKeyDown={(event) => {
    if (
      component.layout === 'list' &&
      (event.key === 'ArrowDown' ||
        event.key === 'ArrowUp')
    ) {
      const currentIndex =
        component.items.findIndex(
          (currentItem) =>
            currentItem.id === item.id
        );

      const targetIndex =
        event.key === 'ArrowDown'
          ? currentIndex + 1
          : currentIndex - 1;

      const targetItem =
        component.items[targetIndex];

      if (targetItem) {
        event.preventDefault();
        focusItem(targetItem.id, 'end');
      }

      return;
    }

    if (
      component.layout === 'inline' &&
      (event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight')
    ) {
      const selection = window.getSelection();
    
      if (!selection || selection.rangeCount === 0) {
        return;
      }
    
      const range = selection.getRangeAt(0);
    
      const beforeCaret = range.cloneRange();
      beforeCaret.selectNodeContents(event.currentTarget);
      beforeCaret.setEnd(
        range.startContainer,
        range.startOffset
      );
    
      const caretPosition =
        beforeCaret.toString().length;
    
      const textLength =
        getEditableText(event.currentTarget).length;
    
      const movePrevious =
        event.key === 'ArrowLeft' &&
        caretPosition === 0;
    
      const moveNext =
        event.key === 'ArrowRight' &&
        caretPosition === textLength;
    
      if (movePrevious || moveNext) {
        const currentIndex =
          component.items.findIndex(
            (currentItem) =>
              currentItem.id === item.id
          );
    
        const targetIndex = moveNext
          ? currentIndex + 1
          : currentIndex - 1;
    
        const targetItem =
          component.items[targetIndex];
    
        if (targetItem) {
          event.preventDefault();
    
          focusItem(
            targetItem.id,
            moveNext ? 'start' : 'end'
          );
        }
      }
    
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const newItem: CheckboxItem = {
        id: crypto.randomUUID(),
        text: '',
        richText: [],
        checked: false,
        markStyle: component.markStyle,
        markColor: component.markColor,
        showPlaceholder: true,
      };

      const currentIndex =
        component.items.findIndex(
          (currentItem) =>
            currentItem.id === item.id
        );

      const nextItems = [
        ...component.items,
      ];

      nextItems.splice(
        currentIndex + 1,
        0,
        newItem
      );

      onUpdateComponent(component.id, {
        items: nextItems,
      });

      focusItem(newItem.id, 'start');

      return;
    }

    if (
      event.key === 'Backspace' &&
      getEditableText(event.currentTarget) === '' &&
      component.items.length > 1
    ) {
      event.preventDefault();

      const currentIndex =
        component.items.findIndex(
          (currentItem) =>
            currentItem.id === item.id
        );

      const previousItem =
        component.items[currentIndex - 1];

      const nextItem =
        component.items[currentIndex + 1];

      const focusTarget =
        previousItem ?? nextItem;

      onUpdateComponent(component.id, {
        items: component.items.filter(
          (currentItem) =>
            currentItem.id !== item.id
        ),
      });

      if (focusTarget) {
        focusItem(
          focusTarget.id,
          previousItem ? 'end' : 'start'
        );
      }
    }
  }}
>
{item.richText.length > 0
  ? item.richText.map((segment, index) => {
      const offset = item.richText
        .slice(0, index)
        .reduce(
          (total, currentSegment) =>
            total + currentSegment.text.length,
          0
        );

      return (
        <span
          key={`${segment.text}-${index}`}
          style={{
            fontWeight: segment.style?.bold
              ? 700
              : undefined,
            fontStyle: segment.style?.italic
              ? 'italic'
              : undefined,
            textDecoration: segment.style?.underline
              ? 'underline'
              : undefined,
            color: segment.style?.color,
            fontFamily:
              segment.style?.fontFamily,
          }}
        >
          {renderCheckboxTextWithFindHighlight(
            segment.text,
            offset,
            item.id
          )}
        </span>
      );
    })
  : renderCheckboxTextWithFindHighlight(
      item.text,
      0,
      item.id
    )}
</div>
          </div>
        ))}
      </div>

      {isSelected && !isGroupSelected && !component.locked && (
        <button
          type="button"
          aria-label="Resize checkbox component"
          title="Resize width"
          onPointerDown={(event) =>
            onResizeStart(event, component)
          }
          className="absolute flex h-7 w-7 cursor-ew-resize items-center justify-center rounded border border-slate-300 bg-white text-base font-medium shadow-sm hover:bg-slate-50"
          style={{
            right: '-14px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 9999,
          }}
        >
          ↔
        </button>
      )}
    </div>
  );
}