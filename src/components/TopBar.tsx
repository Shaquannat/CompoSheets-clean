export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">
          C
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
            CompoSheets
          </h1>

          <p className="hidden text-xs text-slate-500 sm:block">
            Designed for educators who create.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-slate-500 md:inline">
          Untitled worksheet
        </span>

        <button
          type="button"
          className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex sm:items-center"
        >
          Save
        </button>

        <button
          type="button"
          className="min-h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          Download PDF
        </button>
      </div>
    </header>
  );
}
