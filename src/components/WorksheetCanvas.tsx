import type { RefObject, PointerEvent as ReactPointerEvent } from 'react';

import type { WorksheetComponent } from '../types/worksheet';
import { TextComponent } from './TextComponent';
import { QuestionComponent } from './QuestionComponent';
import { AnswerLinesComponent } from './AnswerLinesComponent';
import { CheckboxComponent } from './CheckboxComponent';

type WorksheetCanvasProps = {
  components: WorksheetComponent[];
  selectedComponentId: string | null;
  selectedComponentIds: string[];

  selectionBox: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;

  findMatch?: {
    componentId: string;
    itemId?: string;
    start: number;
    end: number;
  } | null;

  pageRef: RefObject<HTMLElement | null>;
  onSelectComponent: (
    id: string | null,
    event?: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartSelectionBox: (
    event: ReactPointerEvent<HTMLElement>
  ) => void;
  onStartDragging: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: WorksheetComponent
  ) => void;
  onResizeStart: (
    event: ReactPointerEvent<HTMLButtonElement>,
    component: WorksheetComponent
  ) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerEnd: () => void;
  onTextChange: (id: string, text: string) => void;
  onTextInput?: (id: string, text: string) => void;
  onTextSelectionChange?: (
    id: string,
    range: { start: number; end: number } | null
  ) => void;
  onQuestionSelectionChange?: (
    id: string,
    range: { start: number; end: number } | null
  ) => void;
  onCheckboxSelectionChange?: (
    componentId: string,
    itemId: string,
    range: { start: number; end: number } | null
  ) => void;
  onUpdateComponent: (
    id: string,
    changes: Partial<WorksheetComponent>
  ) => void;
};

export function WorksheetCanvas({
  components,
  selectedComponentId,
  selectedComponentIds,
  selectionBox,
  findMatch,
  pageRef,
  onSelectComponent,
  onStartSelectionBox,
  onStartDragging,
  onResizeStart,
  onPointerMove,
  onPointerEnd,
  onTextChange,
  onTextInput,
  onTextSelectionChange,
onQuestionSelectionChange,
onCheckboxSelectionChange,
onUpdateComponent,
}: WorksheetCanvasProps) {
  const selectedComponents = components.filter((component) =>
  selectedComponentIds.includes(component.id)
);
const isGroupSelected = selectedComponents.length > 1;

const groupBounds =
  selectedComponents.length > 1
    ? {
        left: Math.min(
          ...selectedComponents.map((component) => component.x)
        ),
        top: Math.min(
          ...selectedComponents.map((component) => component.y)
        ),
        right: Math.max(
          ...selectedComponents.map(
            (component) => component.x + component.width
          )
        ),
        bottom: Math.max(
          ...selectedComponents.map(
            (component) => component.y + component.height
          )
        ),
      }
    : null;
  return (
    <section className="min-w-0 overflow-auto bg-slate-200/70">
      <div className="flex min-h-full flex-col items-center px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-4 flex w-full max-w-[816px] flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Worksheet Canvas
            </h2>

            <p className="text-xs text-slate-500">
              US Letter · Portrait · 8.5 × 11 inches
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              −
            </button>

            <span className="min-w-14 text-center text-sm font-semibold text-slate-700">
              100%
            </span>

            <button
              type="button"
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="w-full max-w-[816px] pb-8">
          <article
            ref={pageRef}
            aria-label="Blank US Letter worksheet page"
            className="relative mx-auto aspect-[8.5/11] w-full touch-none bg-white shadow-xl"
            onPointerDown={onStartSelectionBox}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onPointerLeave={onPointerEnd}
          >
            <div className="pointer-events-none absolute inset-[48px] border border-dashed border-violet-300">
              <span className="absolute -top-6 left-0 text-[11px] font-medium text-violet-500">
                Printable margin
              </span>
            </div>
            {selectionBox && (
  <div
    className="pointer-events-none absolute border border-violet-500 bg-violet-200/20"
    style={{
      left: Math.min(
        selectionBox.startX,
        selectionBox.currentX
      ),
      top: Math.min(
        selectionBox.startY,
        selectionBox.currentY
      ),
      width: Math.abs(
        selectionBox.currentX -
          selectionBox.startX
      ),
      height: Math.abs(
        selectionBox.currentY -
          selectionBox.startY
      ),
      zIndex: 10002,
    }}
  />
)}
            {groupBounds && isGroupSelected && (
  <>
    <div
      className="pointer-events-none absolute"
      style={{
        left: groupBounds.left,
        top: groupBounds.top,
        width: groupBounds.right - groupBounds.left,
        height: groupBounds.bottom - groupBounds.top,
        border: '2px solid rgb(124 58 237)',
        boxSizing: 'border-box',
        zIndex: 10000,
      }}
    />

    <button
      type="button"
      aria-label="Resize selected group"
      title="Resize selected group"
      className="absolute flex h-5 w-5 cursor-se-resize items-center justify-center rounded-sm border border-violet-600 bg-white text-[10px] text-violet-600 shadow-sm"
      style={{
        left: groupBounds.right - 10,
        top: groupBounds.bottom - 10,
        zIndex: 10001,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();

        const anchorComponent = selectedComponents[0];

        if (!anchorComponent) return;

        onResizeStart(event, anchorComponent);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      ↘
    </button>
  </>
)}
            {components.map((component) => {
  if (component.type === 'text') {
    return (
      <TextComponent
        key={component.id}
        component={component}
        isSelected={
          component.id === selectedComponentId ||
          selectedComponentIds.includes(component.id)
        }
        isGroupSelected={isGroupSelected}
        findMatch={
          findMatch?.componentId === component.id
            ? {
                start: findMatch.start,
                end: findMatch.end,
              }
            : null
        }
        onSelect={onSelectComponent}
        onStartDragging={onStartDragging}
        onResizeStart={onResizeStart}
        onTextChange={onTextChange}
        onTextInput={onTextInput}
        onSelectionChange={onTextSelectionChange}
        onUpdateComponent={onUpdateComponent}
      />
    );
  }

  if (component.type === 'question') {
    return (
      <QuestionComponent
        key={component.id}
        component={component}
        isSelected={
          component.id === selectedComponentId ||
          selectedComponentIds.includes(component.id)
        }
        isGroupSelected={isGroupSelected}
        onSelect={onSelectComponent}
        onStartDragging={onStartDragging}
        onResizeStart={onResizeStart}
        onQuestionChange={(id, question) =>
          onUpdateComponent(id, { question })
        }
        onSelectionChange={onQuestionSelectionChange}
      />
    );
  }

  if (component.type === 'answerLines') {
    return (
      <AnswerLinesComponent
        key={component.id}
        component={component}
        isSelected={
          component.id === selectedComponentId ||
          selectedComponentIds.includes(component.id)
        }
        isGroupSelected={isGroupSelected}
        onSelect={onSelectComponent}
        onStartDragging={onStartDragging}
        onResizeStart={onResizeStart}
        onLineCountChange={(id, lineCount, height) =>
          onUpdateComponent(id, { lineCount, height })
        }
      />
    );
  }

  if (component.type === 'checkbox') {
    return (
      <CheckboxComponent
        key={component.id}
        component={component}
        isSelected={
          component.id === selectedComponentId ||
          selectedComponentIds.includes(component.id)
        }
        isGroupSelected={isGroupSelected}
        onSelect={onSelectComponent}
        onStartDragging={onStartDragging}
        onResizeStart={onResizeStart}
        onSelectionChange={onCheckboxSelectionChange}
        onUpdateComponent={onUpdateComponent}
      />
    );
  }
  return null;
})}

            {components.length === 0 && (
              <div className="absolute inset-[48px] flex items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                    ＋
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">
                    Your worksheet starts here
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Add text, questions, answer lines, tables, images, and
                    reusable components.
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>

        <button
          type="button"
          className="min-h-11 rounded-lg border border-dashed border-slate-400 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-violet-500 hover:text-violet-700"
        >
          + Add Page
        </button>
      </div>
    </section>
  );
}
