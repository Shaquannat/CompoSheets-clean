import {
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  CheckboxComponent as CheckboxComponentType,
  CheckboxItem,
} from '../types/worksheet';

type CheckboxComponentProps = {
  component: CheckboxComponentType;
  isSelected: boolean;
  onSelect: (id: string) => void;
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
};

export function CheckboxComponent({
  component,
  isSelected,
  onSelect,
  onStartDragging,
  onResizeStart,
  onUpdateComponent,
}: CheckboxComponentProps) {
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

  function focusItem(
    itemId: string,
    caretPosition: 'start' | 'end' = 'end'
  ) {
    requestAnimationFrame(() => {
      const textarea =
        document.querySelector<HTMLTextAreaElement>(
          `[data-checkbox-item-id="${itemId}"]`
        );

      if (!textarea) return;

      textarea.focus();

      const position =
        caretPosition === 'start'
          ? 0
          : textarea.value.length;

      textarea.setSelectionRange(position, position);

      resizeTextarea(textarea);
    });
  }

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

  return (
    <div
      data-checkbox-component-id={component.id}
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

            <textarea
              value={item.text}
              placeholder={
                item.showPlaceholder ? 'Option' : ''
              }
              disabled={component.locked}
              rows={1}
              wrap="soft"
              data-checkbox-item-id={item.id}
              className="min-w-0 resize-none overflow-hidden bg-transparent outline-none placeholder:text-slate-400 [resize:none]"
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
                fontSize: `${component.fontSize}px`,
                fontWeight: component.bold ? 700 : 400,
                lineHeight: 1.35,
                color: component.textColor,
                resize: 'none',
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(component.id);
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(component.id);
              }}
              onFocus={(event) => {
                if (item.showPlaceholder) {
                  updateItem(item.id, {
                    showPlaceholder: false,
                  });
                }

                resizeTextarea(event.currentTarget);
              }}
              onChange={(event) => {
                updateItem(item.id, {
                  text: event.target.value,
                  showPlaceholder: false,
                });

                resizeTextarea(event.currentTarget);
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
                  const textarea = event.currentTarget;

                  const caretStart =
                    textarea.selectionStart ?? 0;

                  const caretEnd =
                    textarea.selectionEnd ?? 0;

                  const movePrevious =
                    event.key === 'ArrowLeft' &&
                    caretStart === 0 &&
                    caretEnd === 0;

                  const moveNext =
                    event.key === 'ArrowRight' &&
                    caretStart ===
                      textarea.value.length &&
                    caretEnd === textarea.value.length;

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
                  event.currentTarget.value === '' &&
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
            />
          </div>
        ))}
      </div>

      {isSelected && !component.locked && (
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