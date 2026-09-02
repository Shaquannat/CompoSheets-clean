import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { QuestionComponent as QuestionComponentType } from '../types/worksheet';

type QuestionComponentProps = {
  component: QuestionComponentType;

  questionNumber?: number | null;
  isSelected: boolean;
  isGroupSelected: boolean;
  findMatches?: {
    start: number;
    end: number;
  }[];
  
  activeFindMatch?: {
    start: number;
    end: number;
  } | null;
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
  questionNumber,
isSelected,
isGroupSelected,
findMatches = [],
activeFindMatch,
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
const shouldRestoreCaretRef = useRef(false);

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

    const nextRange = {
      start,
      end,
    };
    
    setSelectedRange(
      start !== end
        ? nextRange
        : null
    );
    
    onSelectionChange?.(
      component.id,
      nextRange
    );
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
  
  function insertTabAtCaret(editor: HTMLElement) {
    const selection = window.getSelection();
  
    if (!selection || selection.rangeCount === 0) return;
  
    const range = selection.getRangeAt(0);
  
    if (
      !editor.contains(range.startContainer) ||
      !editor.contains(range.endContainer)
    ) {
      return;
    }
  
    range.deleteContents();
  
    const tabNode = document.createTextNode('\t');
  
    range.insertNode(tabNode);
    range.setStartAfter(tabNode);
    range.collapse(true);
  
    selection.removeAllRanges();
    selection.addRange(range);
  
    caretOffsetRef.current += 1;
  
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: '\t',
      })
    );
  }

  function removeTabBeforeCaret(editor: HTMLElement) {
    const selection = window.getSelection();
  
    if (!selection || selection.rangeCount === 0) return;
  
    const range = selection.getRangeAt(0);
  
    if (
      !range.collapsed ||
      !editor.contains(range.startContainer)
    ) {
      return;
    }
  
    const beforeCaret = range.cloneRange();
  
    beforeCaret.selectNodeContents(editor);
    beforeCaret.setEnd(
      range.startContainer,
      range.startOffset
    );
  
    const caretOffset = beforeCaret.toString().length;
  
    if (caretOffset === 0) return;
  
    const characterIndex = caretOffset - 1;
  
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT
    );
  
    let currentOffset = 0;
    let node = walker.nextNode();
  
    while (node) {
      const text = node.textContent ?? '';
      const nextOffset = currentOffset + text.length;
  
      if (characterIndex < nextOffset) {
        const localIndex =
          characterIndex - currentOffset;
  
        if (text[localIndex] !== '\t') return;
  
        const textNode = node as Text;
  
        textNode.deleteData(localIndex, 1);
  
        const nextRange = document.createRange();
  
        nextRange.setStart(textNode, localIndex);
        nextRange.collapse(true);
  
        selection.removeAllRanges();
        selection.addRange(nextRange);
  
        caretOffsetRef.current =
          Math.max(0, caretOffset - 1);
  
        editor.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            inputType: 'deleteContentBackward',
            data: null,
          })
        );
  
        return;
      }
  
      currentOffset = nextOffset;
      node = walker.nextNode();
    }
  }

  useLayoutEffect(() => {
    const previousQuestion = previousQuestionRef.current;
  
    if (shouldRestoreCaretRef.current) {
      editorRef.current?.focus();
      
      const wasAtEnd =
        caretOffsetRef.current >= previousQuestion.length;
  
      if (wasAtEnd) {
        caretOffsetRef.current = component.question.length;
      }
  
      restoreCaretPosition();
    }
  
    previousQuestionRef.current = component.question;
  }, [component.question]);

  function renderQuestionWithFindHighlight(
    text: string,
    offset: number
  ) {
    if (findMatches.length === 0) return text;
  
    const segmentStart = offset;
    const segmentEnd = offset + text.length;
  
    const overlappingMatches = findMatches
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
        activeFindMatch?.start === match.start &&
        activeFindMatch?.end === match.end;
  
      parts.push(
        <mark
          key={`${match.start}-${match.end}-${offset}`}
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
  function renderQuestionParagraphContent(
    paragraphStart: number,
    paragraphEnd: number
  ) {

    if (component.richText.length === 0) {
      return renderQuestionWithFindHighlight(
        component.question.slice(
          paragraphStart,
          paragraphEnd
        ),
        paragraphStart
      );
    }
  
    const parts: ReactNode[] = [];
    let segmentOffset = 0;
  
    component.richText.forEach(
      (segment, segmentIndex) => {
        const segmentStart = segmentOffset;
        const segmentEnd =
          segmentStart + segment.text.length;
  
        segmentOffset = segmentEnd;
  
        if (
          segmentEnd <= paragraphStart ||
          segmentStart >= paragraphEnd
        ) {
          return;
        }
  
        const sliceStart = Math.max(
          paragraphStart,
          segmentStart
        );
  
        const sliceEnd = Math.min(
          paragraphEnd,
          segmentEnd
        );
  
        const localStart =
          sliceStart - segmentStart;
  
        const localEnd =
          sliceEnd - segmentStart;
  
        const slicedText =
          segment.text.slice(
            localStart,
            localEnd
          );
  
        parts.push(
          <span
            key={`${segmentIndex}-${sliceStart}-${sliceEnd}`}
            style={{
              fontWeight:
                segment.style?.bold
                  ? 700
                  : undefined,
              fontStyle:
                segment.style?.italic
                  ? 'italic'
                  : undefined,
              textDecoration:
                segment.style?.underline
                  ? 'underline'
                  : undefined,
              color:
                segment.style?.color,
              fontFamily:
                segment.style?.fontFamily,
            }}
          >
            {renderQuestionWithFindHighlight(
              slicedText,
              sliceStart
            )}
          </span>
        );
      }
    );
  
    return parts;
  }
  
  function renderQuestionParagraphs() {
    const paragraphs =
      component.question.split('\n');
  
    let paragraphStart = 0;
  
    return paragraphs.map(
      (paragraph, paragraphIndex) => {
        const paragraphEnd =
          paragraphStart + paragraph.length;
  
        const start = paragraphStart;
        const end = paragraphEnd;
  
        const indentLevel =
          component.paragraphIndents?.[
            paragraphIndex
          ] ?? 0;
  
        paragraphStart =
          paragraphEnd + 1;
  
        return (
          <Fragment
            key={`paragraph-${paragraphIndex}`}
          >
            <span
              style={{
                display: 'inline-block',
                marginLeft:
                  indentLevel * 24,
                maxWidth: `calc(100% - ${
                  indentLevel * 24
                }px)`,
                boxSizing: 'border-box',
                verticalAlign: 'top',
              }}
            >
              {renderQuestionParagraphContent(
                start,
                end
              )}
            </span>
  
            {paragraphIndex <
              paragraphs.length - 1 &&
              '\n'}
          </Fragment>
        );
      }
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

{questionNumber !== null && questionNumber !== undefined && (
  <span
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: '8px',
      top: '4px',
      fontSize: component.fontSize,
      fontWeight: component.fontWeight,
      fontFamily: component.fontFamily,
      color: component.textColor,
      lineHeight: 'normal',
      pointerEvents: 'none',
    }}
  >
    {questionNumber}.
  </span>
)}
<div
key={component.question}
  ref={editorRef}
  contentEditable
  data-question-component-id={component.id}
  onFocus={() => {
    shouldRestoreCaretRef.current = true;
  }}
  data-placeholder="Type your question here"
        suppressContentEditableWarning
        className="question-component-editor h-full w-full cursor-text py-1 pr-2 outline-none"
        style={{
          fontSize: component.fontSize,
          fontWeight: component.fontWeight,
          fontStyle: component.italic ? 'italic' : 'normal',
          fontFamily: component.fontFamily,
          textDecoration: component.underline ? 'underline' : 'none',
          color: component.textColor,
          whiteSpace: 'pre-wrap',
          tabSize: 4,
          paddingLeft:
  questionNumber !== null && questionNumber !== undefined
    ? Math.max(
        40,
        24 + String(questionNumber).length * 9
      )
    : 8,
        }}

        onPointerDown={(event) => {
          if (isSelected) {
            event.stopPropagation();
          }
        }}
        
        onMouseUp={(event) => {
          captureSelection(event.currentTarget);
        }}
        
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
        
          event.preventDefault();
          event.stopPropagation();
        
          if (event.shiftKey) {
            removeTabBeforeCaret(
              event.currentTarget
            );
        
            return;
          }
        
          insertTabAtCaret(
            event.currentTarget
          );
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
          shouldRestoreCaretRef.current = false;

          const updatedQuestion =
            event.currentTarget.innerText
              .replace(/\r\n/g, '\n')
              .replace(/\n$/, '');

          onQuestionChange?.(
            component.id,
            updatedQuestion
          );
        }}
        >
          {renderQuestionParagraphs()}
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