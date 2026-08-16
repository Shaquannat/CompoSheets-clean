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
            {selectedComponent.type === 'text'
  ? 'Text'
  : selectedComponent.type === 'question'
    ? 'Question'
    : selectedComponent.type === 'answerLines'
      ? 'Answer Lines'
      : selectedComponent.type === 'checkbox'
        ? 'Checkbox'
        : selectedComponent.type}
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

{selectedComponent.type === 'answerLines' && (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Line style
    </span>

    <select
      value={selectedComponent.lineStyle}
      onChange={(event) =>
        onUpdateComponent(selectedComponent.id, {
          lineStyle: event.target.value as
  | 'standard'
  | 'primary',
        })
      }
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      <option value="standard">Standard</option>
      <option value="primary">Primary handwriting</option>
    </select>
  </label>
)}
{selectedComponent.type === 'checkbox' && (
  <div className="space-y-5">
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Layout
      </label>

      <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>
        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              layout: 'list',
            })
          }
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            selectedComponent.layout === 'list'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          List
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              layout: 'inline',
            })
          }
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            selectedComponent.layout === 'inline'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Inline
        </button>
      </div>
    </div>
    <div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Mark Style
  </label>

  <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>
    <button
      type="button"
      onClick={() =>
        onUpdateComponent(selectedComponent.id, {
          markStyle: 'check',
        })
      }
      className={`rounded-md border px-3 py-2 text-sm font-medium ${
        selectedComponent.markStyle === 'check'
          ? 'border-violet-500 bg-violet-50 text-violet-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      ✓
    </button>

    <button
      type="button"
      onClick={() =>
        onUpdateComponent(selectedComponent.id, {
          markStyle: 'x',
        })
      }
      className={`rounded-md border px-3 py-2 text-sm font-medium ${
        selectedComponent.markStyle === 'x'
          ? 'border-violet-500 bg-violet-50 text-violet-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      ×
    </button>
  </div>
</div>
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    alignItems: 'end',
  }}
>
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      Font Size
    </label>

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
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none"
    />
  </div>

  <button
  type="button"
  onClick={() =>
    onUpdateComponent(selectedComponent.id, {
      bold: !selectedComponent.bold,
    })
  }
  className={`w-full rounded-md border px-3 py-2 text-sm font-semibold ${
    selectedComponent.bold
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  }`}
>
  Bold
</button>
</div>

<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Text Color
  </label>

  <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 92px',
    gap: '8px',
    alignItems: 'center',
  }}
>
  <input
    type="color"
    value={selectedComponent.textColor}
    onChange={(event) =>
      onUpdateComponent(selectedComponent.id, {
        textColor: event.target.value,
      })
    }
    style={{
      width: '100%',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="cursor-pointer rounded-md border border-slate-300 bg-white p-1"
    aria-label="Choose text color"
  />

  <input
    type="text"
    value={selectedComponent.textColor.toUpperCase()}
    onChange={(event) => {
      const value = event.target.value;

      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          textColor: value,
        });
      }
    }}
    onBlur={(event) => {
      const value = event.target.value;

      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          textColor: '#0F172A',
        });
      }
    }}
    maxLength={7}
    style={{
      width: '92px',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
    aria-label="Text color hex value"
  />
</div>

<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Mark Color
  </label>
  
  <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 92px',
    gap: '8px',
    alignItems: 'center',
  }}
>
  <input
    type="color"
    value={selectedComponent.markColor}
    onChange={(event) =>
      onUpdateComponent(selectedComponent.id, {
        markColor: event.target.value,
      })
    }
    style={{
      width: '100%',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="cursor-pointer rounded-md border border-slate-300 bg-white p-1"
    aria-label="Choose mark color"
  />

  <input
    type="text"
    value={selectedComponent.markColor.toUpperCase()}
    onChange={(event) => {
      const value = event.target.value;

      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          markColor: value,
        });
      }
    }}
    onBlur={(event) => {
      const value = event.target.value;

      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          markColor: '#0F172A',
        });
      }
    }}
    maxLength={7}
    style={{
      width: '92px',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
    aria-label="Mark color hex value"
  />
</div>
  </div>
</div>

  </div>
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

          <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>

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