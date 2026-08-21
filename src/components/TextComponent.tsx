import {
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { TextComponent as TextComponentType } from '../types/worksheet';

type TextComponentProps = {
  component: TextComponentType;
  isSelected: boolean;
  isGroupSelected: boolean;
  findMatch?: {
    start: number;
    end: number;
  } | null;
  onSelect: (
    id: string,
    event?: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: TextComponentType
  ) => void;

  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: TextComponentType
  ) => void;

  onTextChange?: (id: string, text: string) => void;
  onSelectionChange?: (
    id: string,
    range: { start: number; end: number } | null
  ) => void;
  onUpdateComponent: (
    id: string,
    changes: Partial<TextComponentType>
  ) => void;
};

export function TextComponent({
  component,
  isSelected,
  isGroupSelected,
  findMatch,
  onSelect,
  onStartDragging,
  onResizeStart,
  onTextChange,
onSelectionChange,
onUpdateComponent,
}: TextComponentProps) {
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const [isHovered, setIsHovered] = useState(false);

  function captureSelection(element: HTMLElement) {
    const selection = window.getSelection();
  
    if (!selection || selection.rangeCount === 0) {
      setSelectedRange(null);
onSelectionChange?.(component.id, null);
return;
    }
  
    const range = selection.getRangeAt(0);
  
    if (
      !element.contains(range.startContainer) ||
      !element.contains(range.endContainer)
    ) {
      setSelectedRange(null);
onSelectionChange?.(component.id, null);
return;
    }
  
    const beforeSelection = range.cloneRange();
    beforeSelection.selectNodeContents(element);
    beforeSelection.setEnd(
      range.startContainer,
      range.startOffset
    );
  
    const start = beforeSelection.toString().length;
    const end = start + range.toString().length;
  
    const nextRange =
  start !== end
    ? {
        start,
        end,
      }
    : null;

setSelectedRange(nextRange);
onSelectionChange?.(component.id, nextRange);
  }

  function renderTextWithFindHighlight(text: string, offset: number) {
    if (!findMatch) return text;
  
    const matchStart = findMatch.start;
    const matchEnd = findMatch.end;
  
    const segmentStart = offset;
    const segmentEnd = offset + text.length;
  
    if (
      matchEnd <= segmentStart ||
      matchStart >= segmentEnd
    ) {
      return text;
    }
  
    const localStart = Math.max(
      0,
      matchStart - segmentStart
    );
  
    const localEnd = Math.min(
      text.length,
      matchEnd - segmentStart
    );
  
    return (
      <>
        {text.slice(0, localStart)}
        <mark className="rounded bg-yellow-200 px-0.5">
          {text.slice(localStart, localEnd)}
        </mark>
        {text.slice(localEnd)}
      </>
    );
  }

  return (
    <div
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
          aria-label="Drag component"
          title="Drag to move"
          onPointerDown={(event) => onStartDragging(event, component)}
          className="flex h-7 w-7 cursor-move items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-md hover:bg-violet-700"
          style={{
            position: 'absolute',
            left: '-14px',
            top: '-14px',
            zIndex: 9999,
          }}
        >
          ⠿
        </button>
      )}

<div
  contentEditable
  data-placeholder="Type text"
        suppressContentEditableWarning
        className="text-component-editor h-full w-full cursor-text px-2 py-1 outline-none"
        style={{
          fontSize: component.fontSize,
          fontFamily: component.fontFamily,
          fontWeight: component.fontWeight,
          fontStyle: component.italic ? 'italic' : 'normal',
          textDecoration: component.underline ? 'underline' : 'none',
          color: component.textColor,
          whiteSpace: 'pre-wrap',
        }}
        onPointerDown={(event) => {
          if (isSelected) {
            event.stopPropagation();
          }
        }}
        onMouseUp={(event) => {
          captureSelection(event.currentTarget);
        }}
        onKeyUp={(event) => {
          captureSelection(event.currentTarget);
        }}

        onBlur={(event) => {
          const updatedText =
            event.currentTarget.innerText
              .replace(/\r\n/g, '\n')
              .replace(/\n$/, '');
        
          const textChanged =
            updatedText !== component.text;
        
          onUpdateComponent(component.id, {
            text: updatedText,
            richText: textChanged
              ? updatedText
                ? [
                    {
                      text: updatedText,
                    },
                  ]
                : []
              : component.richText,
          });
        }}
      >
        {component.richText.length > 0
  ? component.richText.map((segment, index) => {
      const offset = component.richText
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
            fontWeight: segment.style?.bold ? 700 : undefined,
            fontStyle: segment.style?.italic ? 'italic' : undefined,
            textDecoration: segment.style?.underline
              ? 'underline'
              : undefined,
            color: segment.style?.color,
            fontFamily: segment.style?.fontFamily,
          }}
        >
          {renderTextWithFindHighlight(segment.text, offset)}
        </span>
      );
    })
  : renderTextWithFindHighlight(component.text, 0)}
      </div>
      {isSelected && !isGroupSelected && !component.locked && (
  <button
  type="button"
  aria-label="Resize component"
  title="Resize"
  onPointerDown={(event) => onResizeStart(event, component)}
  className="absolute flex h-4 w-4 cursor-se-resize items-center justify-center rounded-sm border border-violet-600 bg-white text-[10px] leading-none text-violet-600"
  style={{
    right: '-8px',
    bottom: '-8px',
    zIndex: 9999,
  }}
>
  ↘
  </button>
)}
</div>
);
}
