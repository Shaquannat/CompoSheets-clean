import type { WorksheetComponent } from '../types/worksheet'

type RightSidebarProps = {
  selectedComponent: WorksheetComponent | null
  onUpdateComponent: (
    id: string,
    changes: Partial<WorksheetComponent>,
  ) => void
  onDuplicate: () => void
  onDelete: () => void
}

export function RightSidebar({
  selectedComponent,
  onUpdateComponent,
  onDuplicate,
  onDelete,
}: RightSidebarProps) {
  return (
    <aside className="hidden border-l border-slate-200 bg-white p-4 lg:block">
      <div className="mb-5">
        <h2 className="font-bold text-slate-900">
          Formatting
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select a component to change its appearance.
        </p>
      </div>

      {selectedComponent ? (
        <div className="space-y-5">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Selected component
            </span>

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm font-semibold text-violet-800">
            {selectedComponent.type === 'text' ? 'Text' : 'Question'}
            </div>
          </div>

          {selectedComponent.type === 'text' && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Font size
              </span>

              <input
                type="number"
                min="8"
                max="72"
                value={selectedComponent.fontSize}
                onChange={(event) =>
                  onUpdateComponent(selectedComponent.id, {
                    fontSize: Number(event.target.value),
                  })
                }
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </label>
          )}

          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <span className="text-sm font-semibold text-slate-800">
              Lock component
            </span>

            <input
              type="checkbox"
              checked={selectedComponent.locked}
              onChange={(event) =>
                onUpdateComponent(selectedComponent.id, {
                  locked: event.target.checked,
                })
              }
              className="h-4 w-4 accent-violet-600"
            />
          </label>

          <button
            type="button"
            onClick={onDuplicate}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 w-full rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Page size
            </span>

            <select className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">
              <option>US Letter</option>
              <option disabled>A4 — coming later</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Orientation
            </span>

            <select className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">
              <option>Portrait</option>
              <option>Landscape</option>
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-violet-600"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Allow full-page placement
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Allows decorative components to extend beyond the printable
                margin.
              </span>
            </span>
          </label>

          <div className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-500">
            Select a worksheet component to see its formatting controls.
          </div>
        </div>
      )}
    </aside>
  )
}