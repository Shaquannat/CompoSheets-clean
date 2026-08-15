import {
    useState,
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
    const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  
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
  
    function toggleChecked(item: CheckboxItem) {
      updateItem(item.id, {
        checked: !item.checked,
      });
    }
  
    function focusItem(itemId: string) {
      requestAnimationFrame(() => {
        const element = document.querySelector<HTMLElement>(
          `[data-checkbox-item-id="${itemId}"]`
        );
  
        if (!element) return;
  
        element.focus();
  
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
  
        const selection = window.getSelection();
  
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      });
    }
  
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
              ? 'flex flex-wrap items-center gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {component.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2"
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
                  toggleChecked(item);
                }}
                className="flex shrink-0 items-center justify-center border border-slate-700 bg-white"
                style={{
                  width: `${component.fontSize * 1.25}px`,
                  height: `${component.fontSize * 1.25}px`,
                  fontSize: `${component.fontSize}px`,
                  lineHeight: 1,
                }}
              >
                {item.checked
                  ? component.markStyle === 'check'
                    ? '✓'
                    : '×'
                  : ''}
              </button>
  
              <div
  contentEditable={!component.locked}
  data-checkbox-item-id={item.id}
  suppressContentEditableWarning
  className="min-h-[24px] min-w-[72px] cursor-text outline-none"
  style={{
    fontSize: `${component.fontSize}px`,
    fontWeight: component.bold ? 700 : 400,
    color: focusedItemId === item.id
  ? '#0f172a'
  : item.showPlaceholder && !item.text
    ? '#94a3b8'
    : '#0f172a',
  }}
  onClick={(event) => {
    event.stopPropagation();
    onSelect(component.id);
  }}
  onFocus={(event) => {
    setFocusedItemId(item.id);
  
    if (item.showPlaceholder && !item.text) {
      event.currentTarget.textContent = '';
    }
  }}
  onKeyDown={(event) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      const currentIndex = component.items.findIndex(
        (currentItem) => currentItem.id === item.id
      );

      const targetIndex =
        event.key === 'ArrowDown'
          ? currentIndex + 1
          : currentIndex - 1;

      const targetItem = component.items[targetIndex];

      if (targetItem) {
        event.preventDefault();
        focusItem(targetItem.id);
      }

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const currentText =
        event.currentTarget.textContent?.trim() ?? '';

      const newItem: CheckboxItem = {
        id: crypto.randomUUID(),
        text: '',
        checked: false,
        showPlaceholder: true,
      };

      const currentIndex = component.items.findIndex(
        (currentItem) => currentItem.id === item.id
      );

      const nextItems = component.items.map(
        (currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                text: currentText,
                showPlaceholder: false,
              }
            : currentItem
      );

      nextItems.splice(
        currentIndex + 1,
        0,
        newItem
      );

      onUpdateComponent(component.id, {
        items: nextItems,
      });

      focusItem(newItem.id);

      return;
    }

    if (
      event.key === 'Backspace' &&
      (event.currentTarget.textContent?.trim() ?? '') === '' &&
      component.items.length > 1
    ) {
      event.preventDefault();

      const currentIndex = component.items.findIndex(
        (currentItem) => currentItem.id === item.id
      );

      const focusTarget =
        component.items[currentIndex - 1] ??
        component.items[currentIndex + 1];

      onUpdateComponent(component.id, {
        items: component.items.filter(
          (currentItem) => currentItem.id !== item.id
        ),
      });

      if (focusTarget) {
        focusItem(focusTarget.id);
      }
    }
  }}
  onBlur={(event) => {
    const updatedText =
      event.currentTarget.textContent?.trim() ?? '';

    updateItem(item.id, {
      text: updatedText,
      showPlaceholder: false,
    });
  }}
>
  {item.text || (item.showPlaceholder ? 'Option' : '')}
</div>
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