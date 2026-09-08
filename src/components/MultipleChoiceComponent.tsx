import {
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
  } from 'react';
  
  import type {
    MultipleChoiceComponent as MultipleChoiceComponentType,
  } from '../types/worksheet';
  
  type MultipleChoiceComponentProps = {
    component: MultipleChoiceComponentType;
    isSelected: boolean;
    isGroupSelected: boolean;
  
    onUpdateComponent: (
      id: string,
      changes: Partial<MultipleChoiceComponentType>
    ) => void;
  
    onSelect: (
      id: string,
      event?: ReactPointerEvent<HTMLElement>
    ) => void;
  
    onSelectionChange?: (
        componentId: string,
        optionId: string,
        range?: { start: number; end: number } | null
      ) => void;

    onStartDragging: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: MultipleChoiceComponentType
    ) => void;
  
    onResizeStart: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: MultipleChoiceComponentType
    ) => void;
  };
  
  export function MultipleChoiceComponent({
    component,
    isSelected,
    isGroupSelected,
    onUpdateComponent,
onSelect,
onSelectionChange,
onStartDragging,
    onResizeStart,
  }: MultipleChoiceComponentProps) {
    const [isHovered, setIsHovered] = useState(false);

    const [optionEmptyState, setOptionEmptyState] = useState<
  Record<string, boolean>
>({});
  
    const optionInputRefs = useRef<Array<HTMLDivElement | null>>([]);

    function captureOptionSelection(
        element: HTMLElement,
        optionId: string
      ) {
        const selection = window.getSelection();
      
        if (!selection || selection.rangeCount === 0) {
          onSelectionChange?.(
            component.id,
            optionId,
            null
          );
      
          return;
        }
      
        const range = selection.getRangeAt(0);
      
        if (
          !element.contains(range.startContainer) ||
          !element.contains(range.endContainer)
        ) {
          return;
        }
      
        const beforeSelection = range.cloneRange();
      
        beforeSelection.selectNodeContents(element);
        beforeSelection.setEnd(
          range.startContainer,
          range.startOffset
        );
      
        const start =
          beforeSelection.toString().length;
      
        const end =
          start + range.toString().length;
      
        onSelectionChange?.(
          component.id,
          optionId,
          {
            start,
            end,
          }
        );
      }
      
      function placeCaretAtEnd(
        element: HTMLElement
      ) {
        const selection = window.getSelection();
      
        if (!selection) return;
      
        const range = document.createRange();
      
        range.selectNodeContents(element);
        range.collapse(false);
      
        selection.removeAllRanges();
        selection.addRange(range);
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
        {isSelected &&
          !isGroupSelected &&
          !component.locked && (
            <button
              type="button"
              aria-label="Drag multiple choice"
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
            component.layout === 'twoColumn'
              ? 'grid grid-cols-2 gap-x-6 gap-y-2 px-3 py-2'
              : 'grid grid-cols-1 gap-2 px-3 py-2'
          }
        >
          {component.options.map((option, index) => {
            const upperLetter = String.fromCharCode(
              65 + index
            );
  
            const labelStyle =
              component.labelStyle ?? 'A.';
  
            const letter = labelStyle.startsWith('a')
              ? upperLetter.toLowerCase()
              : upperLetter;
  
            const suffix = labelStyle.endsWith(')')
              ? ')'
              : '.';
  
              const choiceStyle = {
                fontFamily:
                  option.style?.fontFamily ??
                  component.defaultStyle?.fontFamily ??
                  'Arial',
              
                fontSize:
                  option.style?.fontSize ??
                  component.defaultStyle?.fontSize ??
                  16,
              
                fontWeight:
                  option.style?.fontWeight ??
                  component.defaultStyle?.fontWeight ??
                  'normal',
              
                italic:
                  option.style?.italic ??
                  component.defaultStyle?.italic ??
                  false,
              
                underline:
                  option.style?.underline ??
                  component.defaultStyle?.underline ??
                  false,
              
                textColor:
                  option.style?.textColor ??
                  component.defaultStyle?.textColor ??
                  '#0F172A',
              };
  
            return (
              <div
                key={option.id}
                className="flex min-w-0 items-center gap-2"
                style={{
                  fontFamily: choiceStyle.fontFamily,
                  fontSize: choiceStyle.fontSize,
                  fontWeight: choiceStyle.fontWeight,
                  fontStyle: choiceStyle.italic
                    ? 'italic'
                    : 'normal',
                  color: choiceStyle.textColor,
                }}
              >
                {component.markerStyle === 'circle' ? (
                  <span
                  className="shrink-0 border"
                    style={{
                      width: 22,
                      height: 22,
                      minWidth: 22,
                      minHeight: 22,
                      borderRadius: '50%',
                      boxSizing: 'border-box',
                      fontSize: 13,
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontStyle: 'normal',
                      textDecoration: 'none',
                      borderColor: choiceStyle.textColor,
                    }}
                  >
                    {letter}
                  </span>
                ) : (
                    <span
                    className="shrink-0"
                    style={{
                        fontStyle: 'normal',
                        textDecoration: 'none',
                      }}
                  >
                    {letter}
                    {suffix}
                  </span>
                )}
  
  <div className="relative min-w-0 flex-1">
  <span
  data-multiple-choice-placeholder="true"
  className="pointer-events-none absolute left-0 top-0 text-slate-300"
  style={{
    display:
      (optionEmptyState[option.id] ??
        option.text === '')
        ? 'block'
        : 'none',
  }}
>
  Choice
</span>

  <div
  ref={(element) => {
    optionInputRefs.current[index] = element;
  }}
  contentEditable
  suppressContentEditableWarning
 
  onFocus={() => {
    onSelect(component.id);

    onSelectionChange?.(
      component.id,
      option.id
    );
  }}
  onMouseUp={(event) => {
    captureOptionSelection(
      event.currentTarget,
      option.id
    );
  }}
  onKeyDown={(event) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      (
        event.key.toLowerCase() === 'z' ||
        event.key.toLowerCase() === 'y'
      )
    ) {
      event.stopPropagation();
      return;
    }

    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      if (index < component.options.length - 1) {
        nextIndex = index + 1;
      } else {
        return;
      }
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();

      if (index > 0) {
        nextIndex = index - 1;
      } else {
        return;
      }
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();

      if (index < component.options.length - 1) {
        nextIndex = index + 1;
      } else {
        return;
      }
    }

    if (nextIndex === null) return;

    event.currentTarget.blur();

    requestAnimationFrame(() => {
      const nextInput =
        optionInputRefs.current[nextIndex];

      nextInput?.focus();

      if (nextInput) {
        placeCaretAtEnd(nextInput);
      }
    });
  }}
  onKeyUp={(event) => {
    captureOptionSelection(
      event.currentTarget,
      option.id
    );
  }}
  onClick={(event) => {
    event.stopPropagation();
  }}
  onInput={(event) => {
    const currentText =
      event.currentTarget.innerText
        .replace(/\r\n/g, '\n')
        .replace(/\n$/, '');
  
    setOptionEmptyState((current) => ({
      ...current,
      [option.id]: currentText === '',
    }));
  }}
  onBlur={(event) => {
    const updatedText =
      event.currentTarget.innerText
        .replace(/\r\n/g, '\n')
        .replace(/\n$/, '');

    const nextOptions =
      component.options.map(
        (currentOption) => {
          if (currentOption.id !== option.id) {
            return currentOption;
          }

          const textChanged =
            updatedText !== currentOption.text;

          return {
            ...currentOption,
            text: updatedText,
            richText: textChanged
              ? updatedText
                ? [{ text: updatedText }]
                : []
              : currentOption.richText,
          };
        }
      );

    onUpdateComponent(component.id, {
      options: nextOptions,
    });
  }}
  className="min-w-0 cursor-text border-0 bg-transparent p-0 outline-none"
  style={{
    minHeight: '1em',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    textDecoration: choiceStyle.underline
      ? 'underline'
      : 'none',
    color: 'inherit',
    whiteSpace: 'pre-wrap',
  }}
>
  {option.richText && option.richText.length > 0
    ? option.richText.map(
        (segment, segmentIndex) => (
          <span
            key={segmentIndex}
            style={{
              fontWeight:
                segment.style?.bold === undefined
                  ? undefined
                  : segment.style.bold
                    ? 'bold'
                    : 'normal',

              fontStyle:
                segment.style?.italic === undefined
                  ? undefined
                  : segment.style.italic
                    ? 'italic'
                    : 'normal',

              textDecoration:
                segment.style?.underline === undefined
                  ? undefined
                  : segment.style.underline
                    ? 'underline'
                    : 'none',

              color: segment.style?.color,

              fontFamily:
                segment.style?.fontFamily,

              fontSize:
                segment.style?.fontSize,
            }}
          >
            {segment.text}
          </span>
        )
      )
      : option.text}
      </div>
    </div>
    </div>
    );
          })}
        </div>
  
        {isSelected &&
          !isGroupSelected &&
          !component.locked && (
         <button
  type="button"
  aria-label="Resize multiple choice width"
  title="Drag to resize width"
  onPointerDown={(event) =>
    onResizeStart(event, component)
  }
  className="absolute flex h-4 w-4 cursor-ew-resize items-center justify-center rounded-sm border border-violet-600 bg-white text-[10px] text-violet-600"
  style={{
    right: '-8px',
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