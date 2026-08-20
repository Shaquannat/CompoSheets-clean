import type { PointerEvent as ReactPointerEvent } from 'react';
import type { AnswerLinesComponent as AnswerLinesComponentType } from '../types/worksheet';

type AnswerLinesComponentProps = {
  component: AnswerLinesComponentType;
  isSelected: boolean;
  onSelect: (
    id: string,
    event?: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: AnswerLinesComponentType
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: AnswerLinesComponentType
  ) => void;
  onLineCountChange: (
    id: string,
    lineCount: number,
    height: number
  ) => void;
};

export function AnswerLinesComponent({
  component,
  isSelected,
  onSelect,
  onStartDragging,
  onResizeStart,
  onLineCountChange,
}: AnswerLinesComponentProps) {
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
        onSelect(component.id, event);
      }}
    >
      {isSelected && !component.locked && (
        <button
          type="button"
          aria-label="Drag answer lines"
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
  className="flex w-full flex-col"
  style={{
    gap: component.lineStyle === 'primary' ? '16px' : '0px',
  }}
>
{Array.from({ length: component.lineCount }).map((_, index) => {
  if (component.lineStyle === 'primary') {
    return (
      <div
        key={index}
        className="relative w-full"
        style={{
            height: `${component.lineSpacing * 2}px`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            borderTop: '1px solid #64748b',
          }}
        />
  
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            borderTop: '1px dashed #94a3b8',
          }}
        />
  
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            borderBottom: '1px solid #334155',
          }}
        />
      </div>
    );
  }

  return (
    <div
      key={index}
      className="w-full border-b border-slate-700"
      style={{
        height: `${component.lineSpacing}px`,
      }}
    />
  );
})}
</div>
{isSelected && (
  <div
    className="absolute flex gap-1"
    style={{
      right: '-2px',
      bottom: '-28px',
      zIndex: 9999,
    }}
  >
    <button
      type="button"
      title="Remove line"
      aria-label="Remove line"
      onClick={(event) => {
        event.stopPropagation();
        const nextLineCount = Math.max(1, component.lineCount - 1);

onLineCountChange(
  component.id,
  nextLineCount,
  nextLineCount * component.lineSpacing
);
      }}
      className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-base font-medium shadow-sm hover:bg-slate-50"
    >
      −
    </button>

    <button
      type="button"
      title="Add line"
      aria-label="Add line"
      onClick={(event) => {
        event.stopPropagation();
        const nextLineCount = component.lineCount + 1;

onLineCountChange(
  component.id,
  nextLineCount,
  nextLineCount * component.lineSpacing
);
      }}
      className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 bg-white text-base font-medium shadow-sm hover:bg-slate-50"
    >
      +
    </button>
  </div>
)}
      {isSelected && !component.locked && (
        <button
          type="button"
          aria-label="Resize answer lines"
          title="Resize"
          onPointerDown={(event) => onResizeStart(event, component)}
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