import type { RefObject, PointerEvent as ReactPointerEvent } from 'react';

import type { WorksheetComponent } from '../types/worksheet';
import { TextComponent } from './TextComponent';

type WorksheetCanvasProps = {
  components: WorksheetComponent[];
  selectedComponentId: string | null;
  pageRef: RefObject<HTMLElement | null>;
  onSelectComponent: (id: string | null) => void;
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
};

export function WorksheetCanvas({
  components,
  selectedComponentId,
  pageRef,
  onSelectComponent,
  onStartDragging,
  onResizeStart,
  onPointerMove,
  onPointerEnd,
  onTextChange,
}: WorksheetCanvasProps) {
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
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onPointerLeave={onPointerEnd}
            onClick={() => onSelectComponent(null)}
          >
            <div className="pointer-events-none absolute inset-[48px] border border-dashed border-violet-300">
              <span className="absolute -top-6 left-0 text-[11px] font-medium text-violet-500">
                Printable margin
              </span>
            </div>
            {components.map((component) => {
              if (component.type !== 'text') return null;

              return (
                <TextComponent
                  key={component.id}
                  component={component}
                  isSelected={component.id === selectedComponentId}
                  onSelect={onSelectComponent}
                  onStartDragging={onStartDragging}
                  onResizeStart={onResizeStart}
                  onTextChange={onTextChange}
                />
              );
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
