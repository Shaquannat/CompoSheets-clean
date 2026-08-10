import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TextComponent as TextComponentType } from '../types/worksheet';

type TextComponentProps = {
  component: TextComponentType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: TextComponentType
  ) => void;
  onTextChange?: (id: string, text: string) => void;
};

export function TextComponent({
  component,
  isSelected,
  onSelect,
  onStartDragging,
  onTextChange,
}: TextComponentProps) {
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
          const updatedText =
            event.currentTarget.textContent?.trim() || 'Untitled text';

          onTextChange?.(component.id, updatedText);
        }}
      >
        {component.text}
      </div>
    </div>
  );
}
