import {
  useLayoutEffect,
  useRef,
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
    activeRowLeftItemId?: string | null;

    activeItemId?: string | null;
activeItemSide?: 'left' | 'right' | null;
  
    onSelect: (
      id: string,
      event?: ReactPointerEvent<HTMLElement>
    ) => void;

    onRowSelect?: (
      componentId: string,
      leftItemId: string
    ) => void;

    onItemSelect?: (
  componentId: string,
  itemId: string,
  side: 'left' | 'right'
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
    activeRowLeftItemId,
    activeItemId,
activeItemSide,
    onSelect,
    onRowSelect,
    onItemSelect,
    onStartDragging,
    onResizeStart,
    onUpdateComponent,
  }: MatchingComponentProps) {
    const [isHovered, setIsHovered] =
      useState(false);
      const componentRef = useRef<HTMLDivElement | null>(null);

const [exampleLine, setExampleLine] = useState<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null>(null);
  
      const isRowRelationship =
      component.settings.mode === 'rowRelationship';
    
    const isCutPaste =
  component.settings.mode === 'matchColumns' &&
  component.settings.activityStyle === 'cutPaste';

  const cutPastePairsPerRow =
  isCutPaste
    ? component.settings.pairsPerRow ?? 1
    : 1;

const cutPasteRowCount =
  isCutPaste
    ? Math.ceil(
        component.leftItems.length /
          cutPastePairsPerRow
      )
    : 0;

    const cutPasteGroups =
  isCutPaste
    ? Array.from(
        { length: cutPasteRowCount },
        (_, rowIndex) =>
          component.leftItems.slice(
            rowIndex * cutPastePairsPerRow,
            rowIndex * cutPastePairsPerRow +
              cutPastePairsPerRow
          )
      )
    : [];

    const rowCount = isRowRelationship
  ? component.relationships.length
  : isCutPaste
    ? component.leftItems.length
    : Math.max(
        component.leftItems.length,
        component.rightItems.length
      );
useLayoutEffect(() => {
  if (
    component.settings.mode !== 'matchColumns' ||
    !component.settings.showFirstMatch
  ) {
    setExampleLine(null);
    return;
  }

  const container = componentRef.current;
  const firstRelationship = component.relationships[0];

  if (!container || !firstRelationship) {
    setExampleLine(null);
    return;
  }

  const leftDot =
    container.querySelector<HTMLElement>(
      `[data-matching-dot-side="left"][data-matching-dot-item-id="${firstRelationship.leftItemId}"]`
    );

  const rightDot =
    container.querySelector<HTMLElement>(
      `[data-matching-dot-side="right"][data-matching-dot-item-id="${firstRelationship.rightItemId}"]`
    );

  if (!leftDot || !rightDot) {
    setExampleLine(null);
    return;
  }

  const containerRect =
    container.getBoundingClientRect();

  const leftRect =
    leftDot.getBoundingClientRect();

  const rightRect =
    rightDot.getBoundingClientRect();

  setExampleLine({
    x1:
      leftRect.left +
      leftRect.width / 2 -
      containerRect.left,
    y1:
      leftRect.top +
      leftRect.height / 2 -
      containerRect.top,
    x2:
      rightRect.left +
      rightRect.width / 2 -
      containerRect.left,
    y2:
      rightRect.top +
      rightRect.height / 2 -
      containerRect.top,
  });
}, [component]);
useLayoutEffect(() => {
  if (!isCutPaste) {
    return;
  }

  const container = componentRef.current;

  const target =
    container?.querySelector<HTMLElement>(
      '[data-cut-paste-target="true"]'
    );

  if (!container || !target) {
    return;
  }

  container.style.setProperty(
    '--cut-paste-piece-width',
    `${target.offsetWidth}px`
  );

  container.style.setProperty(
    '--cut-paste-piece-height',
    `${target.offsetHeight}px`
  );
}, [
  component,
  isCutPaste,
  cutPastePairsPerRow,
]);
    return (
      <div
  ref={componentRef}
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
  
  {exampleLine && (
  <svg
    className="pointer-events-none absolute inset-0"
    style={{
      width: '100%',
      height: '100%',
      overflow: 'visible',
      zIndex: 1,
    }}
    aria-hidden="true"
  >
    <line
      x1={exampleLine.x1}
      y1={exampleLine.y1}
      x2={exampleLine.x2}
      y2={exampleLine.y2}
      stroke="#334155"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
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
  
  <div
  className={isCutPaste ? 'grid' : 'flex flex-col'}
  style={
    isCutPaste
      ? {
          gridTemplateColumns: `repeat(${cutPastePairsPerRow}, minmax(0, 1fr))`,
          columnGap: '16px',
          rowGap: `${component.rowSpacing ?? 16}px`,
        }
      : {
          gap: `${component.rowSpacing ?? 16}px`,
        }
  }
>
            {Array.from(
              { length: rowCount },
              (_, index) => {
                const leftItem =
                  component.leftItems[index];
  
                const rightItem =
                  component.rightItems[index];

                  const rowRelationship =
  component.relationships.find(
    (relationship) =>
      relationship.leftItemId === leftItem?.id
  );

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
                    data-matching-row-id={
                      isRowRelationship
                        ? leftItem?.id
                        : undefined
                    }
                    onPointerDown={() => {
                      if (
                        isRowRelationship &&
                        leftItem
                      ) {
                        onRowSelect?.(
                          component.id,
                          leftItem.id
                        );
                      }
                    }}
                    className={`grid items-center rounded-md px-1 py-1 ${
                      isRowRelationship &&
                      isSelected &&
                      activeRowLeftItemId === leftItem?.id
                        ? 'bg-violet-100 ring-1 ring-violet-400'
                        : ''
                    }`}
style={{
  gridTemplateColumns: isCutPaste
  ? cutPastePairsPerRow === 1
    ? 'minmax(0, 1fr) 144px minmax(0, 1fr)'
    : 'minmax(0, 1fr) minmax(0, 1fr)'
  : 'minmax(0, 1fr) 144px minmax(0, 1fr)',
  columnGap: '8px',
}}
                  >
                  <div className="flex min-w-0 items-center gap-2">
  {leftLabel && (
    <span className="shrink-0">
      {leftLabel}
    </span>
  )}

  {leftItem && (
    <div
    onPointerDown={() => {
  onItemSelect?.(
    component.id,
    leftItem.id,
    'left'
  );
}}
className={`relative min-w-0 ${
  isCutPaste
    ? 'w-full'
    : 'flex-1'
} ${
  (leftItem.cornerStyle ?? 'rounded') === 'rounded'
    ? 'rounded-md'
    : 'rounded-none'
} ${
  leftItem.borderStyle === 'solid'
    ? 'border border-slate-700'
    : leftItem.borderStyle === 'dashed'
      ? 'border border-dashed border-slate-700'
      : ''
} ${
  isSelected &&
  activeItemId === leftItem.id &&
  activeItemSide === 'left'
    ? 'ring-2 ring-violet-500 ring-offset-1'
    : ''
}`}

style={{
  borderWidth:
    leftItem.borderStyle === 'solid' ||
    leftItem.borderStyle === 'dashed'
      ? leftItem.borderThickness === 'thick'
        ? '4px'
        : leftItem.borderThickness === 'medium'
          ? '2.5px'
          : '1px'
      : undefined,
      borderColor:
  leftItem.borderStyle === 'solid' ||
  leftItem.borderStyle === 'dashed'
    ? leftItem.borderColor ?? '#334155'
    : undefined,
    backgroundColor: leftItem.backgroundColor ?? 'transparent',
}}

  >
      <span
        data-matching-placeholder="true"
className="pointer-events-none absolute left-2 top-1 hidden text-slate-400"
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
        className="relative block min-h-[1.5em] w-full rounded px-2 py-1 outline-none focus:bg-violet-50"
        style={{
          color: leftItem.textColor ?? '#334155',
        }}

        onFocus={(event) => {
  const placeholder =
    event.currentTarget.previousElementSibling as HTMLElement | null;

  if (!event.currentTarget.innerText.trim() && placeholder) {
    placeholder.style.display = 'block';
  }
}}
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
        const placeholder =
  event.currentTarget.previousElementSibling as HTMLElement | null;

if (placeholder) {
  placeholder.style.display = 'none';
}
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

{component.settings.mode === 'matchColumns' && (
  <>
    {isCutPaste ? (
      <div
  className="flex min-h-10 w-full items-center justify-center"
  style={{
    gridColumn:
      cutPastePairsPerRow === 1 ? 3 : undefined,
  }}
>
        {leftItem && (
          <div
            style={{
              width: '100%',
              height: '42px',
              border:
                component.settings.targetBorderStyle === 'none'
                  ? 'none'
                  : component.settings.targetBorderStyle === 'solid'
                    ? '2px solid #334155'
                    : '2px dashed #334155',
              borderRadius: '0px',
              boxSizing: 'border-box',
            }}
            data-cut-paste-target="true"
            aria-hidden="true"
          />
        )}
      </div>
    ) : (
      <div
        className="flex min-h-10 w-full items-center justify-between"
        aria-hidden="true"
      >
        <span
          data-matching-dot-side="left"
          data-matching-dot-item-id={leftItem?.id}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor:
              component.settings.connectionDots && leftItem
                ? '#334155'
                : 'transparent',
            flexShrink: 0,
          }}
        />

        <span
          data-matching-dot-side="right"
          data-matching-dot-item-id={rightItem?.id}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor:
              component.settings.connectionDots && rightItem
                ? '#334155'
                : 'transparent',
            flexShrink: 0,
          }}
        />
      </div>
    )}
  </>
)}

{component.settings.mode === 'rowRelationship' && (
  <div
    className="flex min-h-10 w-full items-center justify-center text-center"
  >
    {rowRelationship?.betweenStyle === 'arrow' && (
  <svg
    width="88"
    height="46"
    viewBox="0 0 88 46"
    aria-hidden="true"
  >
    <path
      d="M3 14 H52 V5 L85 23 L52 41 V32 H3 Z"
      fill={
        (rowRelationship.arrowStyle ?? 'outline') === 'solid'
          ? rowRelationship.betweenColor ?? '#334155'
          : 'none'
      }
      stroke={rowRelationship.betweenColor ?? '#334155'}
      strokeWidth={rowRelationship.arrowStrokeWidth ?? 2}
      strokeLinejoin="round"
    />
  </svg>
)}

    {rowRelationship?.betweenStyle === 'writeLine' && (
      <div
        style={{
          width: '112px',
height: '32px',
borderBottom: `2px solid ${
  rowRelationship.betweenColor ?? '#334155'
}`,
          boxSizing: 'border-box',
        }}
      />
    )}

    {rowRelationship?.betweenStyle === 'writeBox' && (
      <div
        style={{
          width: '112px',
height: '42px',
border: `2px solid ${
  rowRelationship.betweenColor ?? '#334155'
}`,
          borderRadius: '4px',
          boxSizing: 'border-box',
        }}
      />
    )}

    {rowRelationship?.betweenStyle === 'custom' && (
      <span
        style={{
          fontSize: '22px',
          lineHeight: 1.1,
          color: rowRelationship.betweenColor ?? '#334155',
          fontWeight: rowRelationship.customBetweenBold
  ? 700
  : 400,
textDecoration: rowRelationship.customBetweenUnderline
  ? 'underline'
  : 'none',
        }}
      >
        {rowRelationship.customBetweenText ?? ''}
      </span>
    )}
  </div>
)}

<div className={isCutPaste ? 'hidden' : 'min-w-0'}>
  {rightItem && (
    <div
    onPointerDown={() => {
  onItemSelect?.(
    component.id,
    rightItem.id,
    'right'
  );
}}
  className={`relative min-w-0 ${
  (rightItem.cornerStyle ?? 'rounded') === 'rounded'
    ? 'rounded-md'
    : 'rounded-none'
} ${
  rightItem.borderStyle === 'solid'
    ? 'border border-slate-700'
    : rightItem.borderStyle === 'dashed'
      ? 'border border-dashed border-slate-700'
      : ''
} ${
  isSelected &&
  activeItemId === rightItem.id &&
  activeItemSide === 'right'
    ? 'ring-2 ring-violet-500 ring-offset-1'
    : ''
}`}

style={{
  borderWidth:
    rightItem.borderStyle === 'solid' ||
    rightItem.borderStyle === 'dashed'
      ? rightItem.borderThickness === 'thick'
        ? '4px'
        : rightItem.borderThickness === 'medium'
          ? '2.5px'
          : '1px'
      : undefined,
      borderColor:
  rightItem.borderStyle === 'solid' ||
  rightItem.borderStyle === 'dashed'
    ? rightItem.borderColor ?? '#334155'
    : undefined,
    width: isCutPaste ? '112px' : undefined,
height: isCutPaste ? '42px' : undefined,
marginLeft: isCutPaste ? 'auto' : undefined,
marginRight: isCutPaste ? 'auto' : undefined,
borderWidth: isCutPaste
  ? '2px'
  : rightItem.borderStyle === 'solid' ||
      rightItem.borderStyle === 'dashed'
    ? rightItem.borderThickness === 'thick'
      ? '4px'
      : rightItem.borderThickness === 'medium'
        ? '2.5px'
        : '1px'
    : undefined,
borderStyle: isCutPaste
  ? 'solid'
  : rightItem.borderStyle === 'dashed'
    ? 'dashed'
    : rightItem.borderStyle === 'solid'
      ? 'solid'
      : undefined,
borderColor: isCutPaste
  ? '#334155'
  : rightItem.borderStyle === 'solid' ||
      rightItem.borderStyle === 'dashed'
    ? rightItem.borderColor ?? '#334155'
    : undefined,
borderRadius: isCutPaste ? '4px' : undefined,
    backgroundColor: rightItem.backgroundColor ?? 'transparent',
}}

  >
      <span
        data-matching-placeholder="true"
className="pointer-events-none absolute left-2 top-1 hidden text-slate-400"        style={{
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
        className="relative block min-h-[1.5em] w-full rounded px-2 py-1 outline-none focus:bg-violet-50"
        style={{
          color: rightItem.textColor ?? '#334155',
        }}
        onFocus={(event) => {
  const placeholder =
    event.currentTarget.previousElementSibling as HTMLElement | null;

  if (!event.currentTarget.innerText.trim() && placeholder) {
    placeholder.style.display = 'block';
  }
}}
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
        const placeholder =
  event.currentTarget.previousElementSibling as HTMLElement | null;

if (placeholder) {
  placeholder.style.display = 'none';
}
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
    
              {isCutPaste && (
                <div className="mt-6 pt-2">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <span
                    aria-hidden="true"
                    className="text-lg leading-none"
                  >
                    ✂
                  </span>
              
                  <div className="flex-1 border-t border-dashed border-slate-400" />
                </div>
              
                <div className="flex flex-wrap justify-center gap-0">
                    {component.rightItems.map((item) => (
                      <div
                        key={item.id}
                        onPointerDown={() => {
                          onItemSelect?.(
                            component.id,
                            item.id,
                            'right'
                          );
                        }}
                        style={{
                          width: 'var(--cut-paste-piece-width, 112px)',
height: 'var(--cut-paste-piece-height, 42px)',
border: '1px dashed #334155',
marginRight: '-1px',
marginBottom: '-1px',
                          borderRadius: '0px',
                          boxSizing: 'border-box',
                          backgroundColor:
                            item.backgroundColor ?? 'transparent',
                          color:
                            item.textColor ?? '#334155',
                        }}
                        className={`relative flex shrink-0 items-center justify-center px-2 text-center ${
                          isSelected &&
                          activeItemId === item.id &&
                          activeItemSide === 'right'
                            ? 'ring-2 ring-violet-500 ring-offset-1'
                            : ''
                        }`}
                      >
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          className="w-full outline-none"
                          onBlur={(event) => {
                            const nextText =
                              event.currentTarget.innerText;
    
                            if (nextText === (item.text ?? '')) {
                              return;
                            }
    
                            onUpdateComponent(component.id, {
                              rightItems:
                                component.rightItems.map(
                                  (rightItem) =>
                                    rightItem.id === item.id
                                      ? {
                                          ...rightItem,
                                          text: nextText,
                                        }
                                      : rightItem
                                ),
                            });
                          }}
                        >
                          {item.text ?? ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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