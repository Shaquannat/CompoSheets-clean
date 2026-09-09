import {
    useState,
    type PointerEvent as ReactPointerEvent,
  } from 'react';
  
  import type {
    MatchingComponent as MatchingComponentType,
  } from '../types/worksheet';
  
  type MatchingComponentProps = {
    component: MatchingComponentType;
    isSelected: boolean;
    isGroupSelected: boolean;
  
    onSelect: (
      id: string,
      event?: ReactPointerEvent<HTMLElement>
    ) => void;
  
    onStartDragging: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: MatchingComponentType
    ) => void;
  
    onResizeStart: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: MatchingComponentType
    ) => void;

    onUpdateComponent: (
  id: string,
  changes: Partial<MatchingComponentType>
) => void;
  };
  
  function getLeftLabel(
    index: number,
    style: MatchingComponentType['leftLabelStyle']
  ) {
    if (style === 'none') {
      return '';
    }
  
    if (style === '1.') {
      return `${index + 1}.`;
    }
  
    if (style === '1)') {
      return `${index + 1})`;
    }
  
    const upperLetter = String.fromCharCode(
      65 + index
    );
  
    if (style === 'A.') {
      return `${upperLetter}.`;
    }
  
    if (style === 'A)') {
      return `${upperLetter})`;
    }
  
    const lowerLetter =
      upperLetter.toLowerCase();
  
    if (style === 'a.') {
      return `${lowerLetter}.`;
    }
  
    return `${lowerLetter})`;
  }
  
  export function MatchingComponent({
    component,
    isSelected,
    isGroupSelected,
    onSelect,
    onStartDragging,
    onResizeStart,
    onUpdateComponent,
  }: MatchingComponentProps) {
    const [isHovered, setIsHovered] =
      useState(false);
  
    const rowCount = Math.max(
      component.leftItems.length,
      component.rightItems.length
    );
  
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
        onMouseEnter={() =>
          setIsHovered(true)
        }
        onMouseLeave={() =>
          setIsHovered(false)
        }
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
              aria-label="Drag matching"
              title="Drag to move"
              onPointerDown={(event) =>
                onStartDragging(
                  event,
                  component
                )
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
  
        <div className="px-3 py-2">
          {component.showHeadings && (
            <div
              className="mb-2 grid gap-8 font-semibold"
              style={{
                gridTemplateColumns:
                  'minmax(0, 1fr) minmax(0, 1fr)',
              }}
            >
              <div>
                {component.leftHeading}
              </div>
  
              <div>
                {component.rightHeading}
              </div>
            </div>
          )}
  
          <div className="space-y-2">
            {Array.from(
              { length: rowCount },
              (_, index) => {
                const leftItem =
                  component.leftItems[index];
  
                const rightItem =
                  component.rightItems[index];
  
                const leftLabel =
                  getLeftLabel(
                    index,
                    component.leftLabelStyle
                  );
  
                return (
                  <div
                    key={
                      leftItem?.id ??
                      rightItem?.id ??
                      index
                    }
                    className="grid items-center gap-8"
                    style={{
                      gridTemplateColumns:
                        'minmax(0, 1fr) minmax(0, 1fr)',
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {leftLabel && (
                        <span className="shrink-0">
                          {leftLabel}
                        </span>
                      )}
  
  {leftItem && (
  <div className="relative min-w-0 flex-1">
    <span
      data-matching-placeholder="true"
      className="pointer-events-none absolute left-1 top-0 text-slate-400"
      style={{
        display:
          (leftItem.contentType === 'text' ||
            leftItem.contentType === 'textImage') &&
          !(leftItem.text ?? '')
            ? 'block'
            : 'none',
      }}
    >
      Type item
    </span>

    <span
      contentEditable
      suppressContentEditableWarning
      data-matching-item-id={leftItem.id}
      data-matching-side="left"
      className="relative block min-h-[1.5em] w-full rounded px-1 outline-none focus:bg-violet-50"
      onInput={(event) => {
        const placeholder =
          event.currentTarget.parentElement?.querySelector<HTMLElement>(
            '[data-matching-placeholder="true"]'
          );

        if (placeholder) {
          placeholder.style.display =
            (event.currentTarget.textContent ?? '').length > 0
              ? 'none'
              : 'block';
        }
      }}
      onBlur={(event) => {
        const nextText =
          event.currentTarget.textContent ?? '';

        if (nextText === (leftItem.text ?? '')) {
          return;
        }

        onUpdateComponent(component.id, {
          leftItems: component.leftItems.map(
            (item) =>
              item.id === leftItem.id
                ? {
                    ...item,
                    text: nextText,
                  }
                : item
          ),
        });
      }}
    >
      {leftItem.text ?? ''}
    </span>
  </div>
)}
                    </div>
  
<div className="min-w-0">
  {rightItem && (
    <div className="relative min-w-0">
      <span
        data-matching-placeholder="true"
        className="pointer-events-none absolute left-1 top-0 text-slate-400"
        style={{
          display:
            (rightItem.contentType === 'text' ||
              rightItem.contentType === 'textImage') &&
            !(rightItem.text ?? '')
              ? 'block'
              : 'none',
        }}
      >
        Type match
      </span>

      <span
        contentEditable
        suppressContentEditableWarning
        data-matching-item-id={rightItem.id}
        data-matching-side="right"
        className="relative block min-h-[1.5em] w-full rounded px-1 outline-none focus:bg-violet-50"
        onInput={(event) => {
          const placeholder =
            event.currentTarget.parentElement?.querySelector<HTMLElement>(
              '[data-matching-placeholder="true"]'
            );

          if (placeholder) {
            placeholder.style.display =
              (event.currentTarget.textContent ?? '').length > 0
                ? 'none'
                : 'block';
          }
        }}
        onBlur={(event) => {
          const nextText =
            event.currentTarget.textContent ?? '';

          if (nextText === (rightItem.text ?? '')) {
            return;
          }

          onUpdateComponent(component.id, {
            rightItems: component.rightItems.map(
              (item) =>
                item.id === rightItem.id
                  ? {
                      ...item,
                      text: nextText,
                    }
                  : item
            ),
          });
        }}
      >
        {rightItem.text ?? ''}
      </span>
    </div>
  )}
</div>
                  </div>
                );
              }
            )}
          </div>
        </div>
  
        {isSelected &&
          !isGroupSelected &&
          !component.locked && (
            <button
              type="button"
              aria-label="Resize matching width"
              title="Drag to resize width"
              onPointerDown={(event) =>
                onResizeStart(
                  event,
                  component
                )
              }
              className="absolute flex h-4 w-4 cursor-ew-resize items-center justify-center rounded-sm border border-violet-600 bg-white text-[10px] leading-none text-violet-600"
              style={{
                right: '-8px',
                top: '50%',
                transform:
                  'translateY(-50%)',
                zIndex: 9999,
              }}
            >
              ↔
            </button>
          )}
      </div>
    );
  }