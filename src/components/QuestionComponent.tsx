import type { PointerEvent as ReactPointerEvent } from 'react';
import type { QuestionComponent as QuestionComponentType } from '../types/worksheet';

type QuestionComponentProps = {
  component: QuestionComponentType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: QuestionComponentType
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: QuestionComponentType
  ) => void;
  onQuestionChange?: (id: string, question: string) => void;
};

export function QuestionComponent({
  component,
  isSelected,
  onSelect,
  onStartDragging,
  onResizeStart,
  onQuestionChange,
}: QuestionComponentProps) {
  return (
    <div
      className="absolute"
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        minHeight: component.height,
        border: isSelected
          ? '2px solid rgb(139 92 246)'
          : '2px solid transparent',
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(component.id);
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
        contentEditable={isSelected && !component.locked}
        suppressContentEditableWarning
        className="h-full w-full cursor-text px-2 py-1 outline-none"
        style={{
          fontSize: component.fontSize,
        }}
        onPointerDown={(event) => {
          if (isSelected) {
            event.stopPropagation();
          }
        }}
        onBlur={(event) => {
          const updatedQuestion =
            event.currentTarget.textContent?.trim() || 'Type your question here';

          onQuestionChange?.(component.id, updatedQuestion);
        }}
      >
        {component.question}
      </div>

      {isSelected && !component.locked && (
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