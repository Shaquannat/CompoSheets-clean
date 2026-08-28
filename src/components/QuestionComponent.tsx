import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { QuestionComponent as QuestionComponentType } from '../types/worksheet';

type QuestionComponentProps = {
  component: QuestionComponentType;
  isSelected: boolean;
  isGroupSelected: boolean;
  onSelect: (
    id: string,
    event?: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: QuestionComponentType
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: QuestionComponentType
  ) => void;
  onQuestionChange?: (id: string, question: string) => void;
onQuestionInput?: (id: string, question: string) => void;
onSelectionChange?: (
    id: string,
    range: { start: number; end: number } | null
  ) => void;
};

export function QuestionComponent({
  component,
  isSelected,
  isGroupSelected,
  onSelect,
  onStartDragging,
  onResizeStart,
onQuestionChange,
onQuestionInput,
onSelectionChange,
}: QuestionComponentProps) {
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

const editorRef = useRef<HTMLDivElement | null>(null);
const caretOffsetRef = useRef(0);
const previousQuestionRef = useRef(component.question);

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
  
    caretOffsetRef.current = end;

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
  function restoreCaretPosition() {
    const editor = editorRef.current;
  
    if (!editor) return;
  
    const selection = window.getSelection();
  
    if (!selection) return;
  
    const range = document.createRange();
    const targetOffset = caretOffsetRef.current;
  
    let currentOffset = 0;
    let targetNode: Node | null = null;
    let nodeOffset = 0;
  
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT
    );
  
    let node = walker.nextNode();
  
    while (node) {
      const textLength = node.textContent?.length ?? 0;
  
      if (currentOffset + textLength >= targetOffset) {
        targetNode = node;
        nodeOffset = Math.min(
          targetOffset - currentOffset,
          textLength
        );
        break;
      }
  
      currentOffset += textLength;
      node = walker.nextNode();
    }
  
    if (!targetNode) {
      targetNode = editor;
      nodeOffset = editor.childNodes.length;
    }
  
    range.setStart(targetNode, nodeOffset);
    range.collapse(true);
  
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  useLayoutEffect(() => {
    const previousQuestion = previousQuestionRef.current;
  
    if (document.activeElement === editorRef.current) {
      const wasAtEnd =
        caretOffsetRef.current >= previousQuestion.length;
  
      if (wasAtEnd) {
        caretOffsetRef.current = component.question.length;
      }
  
      restoreCaretPosition();
    }
  
    previousQuestionRef.current = component.question;
  }, [component.question]);

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
          aria-label="Drag question"
          title="Drag to move"
          onPointerDown={(event) => onStartDragging(event, component)}
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
  ref={editorRef}
  contentEditable
  data-placeholder="Type your question here"
        suppressContentEditableWarning
        className="question-component-editor h-full w-full cursor-text px-2 py-1 outline-none"
        style={{
          fontSize: component.fontSize,
          fontWeight: component.fontWeight,
          fontStyle: component.italic ? 'italic' : 'normal',
          fontFamily: component.fontFamily,
          textDecoration: component.underline ? 'underline' : 'none',
          color: component.textColor,
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

        onInput={(event) => {
          const updatedQuestion =
            event.currentTarget.innerText
              .replace(/\r\n/g, '\n')
              .replace(/\n$/, '');
        
          onQuestionInput?.(
            component.id,
            updatedQuestion
          );
        }}
        
        onBlur={(event) => {
          const updatedQuestion =
          event.currentTarget.textContent?.trim() || '';

          onQuestionChange?.(component.id, updatedQuestion);
        }}
      >
        {component.richText.length > 0
  ? component.richText.map((segment, index) => (
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
        {segment.text}
      </span>
    ))
  : component.question}
      </div>

      {isSelected && !isGroupSelected && !component.locked && (
        <button
          type="button"
          aria-label="Resize question"
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