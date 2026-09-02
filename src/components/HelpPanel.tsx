type HelpPanelProps = {
    isOpen: boolean;
    onClose: () => void;
  };
  
  const shortcutGroups = [
    {
      title: 'General',
      shortcuts: [
        {
          keys: 'Ctrl + Z',
          action: 'Undo',
        },
        {
          keys: 'Ctrl + Shift + Z',
          action: 'Redo',
        },
        {
          keys: 'Ctrl + Y',
          action: 'Redo',
        },
        {
          keys: 'Ctrl + F',
          action: 'Find on worksheet',
        },
        {
          keys: 'Ctrl + A',
          action: 'Select all components',
        },
        {
          keys: 'Ctrl + C',
          action: 'Copy selected component',
        },
        {
          keys: 'Ctrl + X',
          action: 'Cut selected component',
        },
        {
          keys: 'Ctrl + V',
          action: 'Paste',
        },
        {
          keys: 'Ctrl + D',
          action: 'Duplicate selected component',
        },
        {
          keys: 'Delete',
          action: 'Delete selected component',
        },
      ],
    },
    {
      title: 'Navigation & movement',
      shortcuts: [
        {
          keys: 'Tab',
          action: 'Select next component',
        },
        {
          keys: 'Shift + Tab',
          action: 'Select previous component',
        },
        {
          keys: 'Arrow keys',
          action: 'Move selected component 1 px',
        },
        {
          keys: 'Shift + Arrow',
          action: 'Move selected component 10 px',
        },
        {
          keys: 'Enter',
          action: 'Edit selected Text or Question',
        },
        {
          keys: 'Start typing',
          action: 'Begin editing selected Text or Question',
        },
        {
          keys: 'Esc',
          action: 'Exit editing, then clear selection',
        },
      ],
    },
    {
      title: 'While editing Text or Question',
      shortcuts: [
        {
          keys: 'Tab',
          action: 'Insert tab spacing',
        },
        {
          keys: 'Shift + Tab',
          action: 'Remove the tab directly before the cursor',
        },
      ],
    },
  ];
  
  export function HelpPanel({
    isOpen,
    onClose,
  }: HelpPanelProps) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-[10000]">
        <button
          type="button"
          aria-label="Close help"
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/30"
        />
  
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="CompoSheets help"
          className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Help
              </h2>
  
              <p className="mt-1 text-sm text-slate-500">
                Keyboard Shortcuts
              </p>

              <p className="mt-2 text-sm text-slate-800">
  <span className="font-semibold text-violet-700">
    Mac users:
  </span>{' '}
  Press{' '}
  <kbd className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-base font-black leading-none text-slate-800 shadow-sm">
  ⌘
</kbd>{' '}
  wherever Ctrl is shown.
</p>
            </div>
  
            <button
              type="button"
              onClick={onClose}
              title="Close help"
              aria-label="Close help"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl text-slate-600 hover:bg-slate-50"
            >
              ×
            </button>
          </div>
  
          <div className="space-y-7 p-5">
            {shortcutGroups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {group.title}
                </h3>
  
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {group.shortcuts.map(
                    (shortcut, index) => (
                      <div
                        key={`${group.title}-${shortcut.keys}`}
                        className={`flex items-center justify-between gap-4 px-4 py-3 ${
                          index <
                          group.shortcuts.length - 1
                            ? 'border-b border-slate-200'
                            : ''
                        }`}
                      >
                        <span className="text-sm text-slate-700">
                          {shortcut.action}
                        </span>
  
                        <kbd className="shrink-0 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    )
                  )}
                </div>
              </section>
            ))}
  
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-semibold text-violet-800">
                More help is coming
              </p>
  
              <p className="mt-1 text-xs leading-5 text-violet-700">
                Components and FAQ / How-To sections
                will be added to this same Help panel.
              </p>
            </div>
          </div>
        </aside>
      </div>
    );
  }