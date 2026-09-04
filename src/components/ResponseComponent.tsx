import {
    useState,
    type PointerEvent as ReactPointerEvent,
  } from 'react';
  
  import type {
    ResponseComponent as ResponseComponentType,
  } from '../types/worksheet';
  
  type ResponseComponentProps = {
    component: ResponseComponentType;
    isSelected: boolean;
    isGroupSelected: boolean;

    onUpdateComponent: (
        id: string,
        changes: Partial<ResponseComponentType>
      ) => void;
  
    onSelect: (
      id: string,
      event?: ReactPointerEvent<HTMLElement>
    ) => void;
  
    onStartDragging: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: ResponseComponentType
    ) => void;
  
    onResizeStart: (
      event: ReactPointerEvent<HTMLButtonElement>,
      component: ResponseComponentType
    ) => void;
  };
  
  export function ResponseComponent({
    component,
    isSelected,
    isGroupSelected,
    onUpdateComponent,
    onSelect,
    onStartDragging,
    onResizeStart,
  }: ResponseComponentProps) {
    const [isHovered, setIsHovered] = useState(false);
  
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
              aria-label="Drag response"
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
  
  {component.responseType === 'multipleChoice' ? (
  <div
    className={
      component.multipleChoiceLayout === 'twoColumn'
        ? 'grid grid-cols-2 gap-x-6 gap-y-2 px-3 py-2'
        : 'grid grid-cols-1 gap-2 px-3 py-2'
    }
  >
    {(component.multipleChoiceOptions ?? []).map(
      (option, index) => {
        const upperLetter = String.fromCharCode(
          65 + index
        );

        const labelStyle =
          component.multipleChoiceLabelStyle ?? 'A.';

        const letter = labelStyle.startsWith('a')
          ? upperLetter.toLowerCase()
          : upperLetter;

        const suffix = labelStyle.endsWith(')')
          ? ')'
          : '.';

        const choiceStyle =
          component.multipleChoiceDefaultStyle ?? {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'normal',
            italic: false,
            underline: false,
            textColor: '#0F172A',
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
              textDecoration: choiceStyle.underline
                ? 'underline'
                : 'none',
              color: choiceStyle.textColor,
            }}
          >
            {component.multipleChoiceMarkerStyle ===
            'circle' ? (
              <span
                className="shrink-0 border border-slate-500"
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
                }}
              >
                {letter}
              </span>
            ) : (
              <span className="shrink-0">
                {letter}
                {suffix}
              </span>
            )}

            <input
              type="text"
              defaultValue={option.text}
              placeholder="Choice"
              onClick={(event) =>
                event.stopPropagation()
              }
              onBlur={(event) => {
                const nextOptions = (
                  component.multipleChoiceOptions ?? []
                ).map((currentOption) =>
                  currentOption.id === option.id
                    ? {
                        ...currentOption,
                        text: event.target.value,
                      }
                    : currentOption
                );

                onUpdateComponent(component.id, {
                  multipleChoiceOptions: nextOptions,
                });
              }}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-slate-300"
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                fontStyle: 'inherit',
                textDecoration: 'inherit',
                color: 'inherit',
              }}
            />
          </div>
        );
      }
    )}
        </div>
) : component.responseType === 'shortAnswer' ? (
  <div className="px-3 py-3">
    <div
      style={{
        width: '100%',
        borderBottom: '1px solid #64748B',
        height: 24,
      }}
    />
  </div>
) : (
  <div className="flex min-h-12 items-center px-3 py-2 text-sm text-slate-400">
    Choose response type
  </div>
)}
  
        {isSelected &&
          !isGroupSelected &&
          !component.locked && (
            <button
            type="button"
            aria-label="Resize response"
            title="Drag to resize"
            onPointerDown={(event) =>
              onResizeStart(event, component)
            }
            className="absolute flex h-4 w-4 cursor-se-resize items-center justify-center rounded-sm border border-violet-600 bg-white text-[10px] text-violet-600"
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