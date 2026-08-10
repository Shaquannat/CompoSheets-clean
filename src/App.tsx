import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  DragState,
  ResizeState,
  TextComponent,
  WorksheetComponent,
} from './types/worksheet';

import { TopBar } from './components/TopBar';
import { Library } from './components/Library';
import { WorksheetCanvas } from './components/WorksheetCanvas';

function App() {
  const pageRef = useRef<HTMLElement | null>(null);
  const dragState = useRef<DragState>(null);
  const resizeState = useRef<ResizeState>(null);
  const [components, setComponents] = useState<WorksheetComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );

  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ??
    null;

  function addTextComponent() {
    const newComponent: TextComponent = {
      id: crypto.randomUUID(),
      type: 'text',
      text: 'Double-click to edit this text',
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 48,
      fontSize: 16,
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };

    setComponents((currentComponents) => [...currentComponents, newComponent]);

    setSelectedComponentId(newComponent.id);
  }

  function updateComponent(id: string, changes: Partial<WorksheetComponent>) {
    setComponents((currentComponents) =>
      currentComponents.map((component) =>
        component.id === id ? { ...component, ...changes } : component
      )
    );
  }

  function deleteSelectedComponent() {
    if (!selectedComponentId) return;

    setComponents((currentComponents) =>
      currentComponents.filter(
        (component) => component.id !== selectedComponentId
      )
    );

    setSelectedComponentId(null);
  }

  function duplicateSelectedComponent() {
    if (!selectedComponent) return;

    const duplicatedComponent: WorksheetComponent = {
      ...selectedComponent,
      id: crypto.randomUUID(),
      x: selectedComponent.x + 24,
      y: selectedComponent.y + 24,
      layer: components.length + 1,
    };

    setComponents((currentComponents) => [
      ...currentComponents,
      duplicatedComponent,
    ]);

    setSelectedComponentId(duplicatedComponent.id);
  }

  function startDragging(
    event: ReactPointerEvent<HTMLButtonElement>,
    component: WorksheetComponent
  ) {
    const page = pageRef.current;

    if (!page || component.locked) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const pageRect = page.getBoundingClientRect();

    dragState.current = {
      componentId: component.id,
      offsetX: event.clientX - pageRect.left - component.x,
      offsetY: event.clientY - pageRect.top - component.y,
    };

    setSelectedComponentId(component.id);
  }

  function moveSelectedComponent(event: ReactPointerEvent<HTMLElement>) {
    const page = pageRef.current;
    const drag = dragState.current;

    if (!page || !drag) return;

    const pageRect = page.getBoundingClientRect();

    const component = components.find(
      (currentComponent) => currentComponent.id === drag.componentId
    );

    if (!component || component.locked) return;

    const minimumX = 48;
    const minimumY = 48;

    const maximumX = Math.max(minimumX, pageRect.width - component.width - 48);

    const maximumY = Math.max(
      minimumY,
      pageRect.height - component.height - 48
    );

    const proposedX = event.clientX - pageRect.left - drag.offsetX;

    const proposedY = event.clientY - pageRect.top - drag.offsetY;

    updateComponent(component.id, {
      x: Math.min(Math.max(proposedX, minimumX), maximumX),
      y: Math.min(Math.max(proposedY, minimumY), maximumY),
    });
  }

  function startResizing(
    event: ReactPointerEvent<HTMLButtonElement>,
    component: WorksheetComponent
  ) {
    if (component.locked) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragState.current = null;

    resizeState.current = {
      componentId: component.id,
      startX: event.clientX,
      startWidth: component.width,
    };

    setSelectedComponentId(component.id);
  }

  function resizeSelectedComponent(event: ReactPointerEvent<HTMLElement>) {
    const page = pageRef.current;
    const resize = resizeState.current;

    if (!page || !resize) return;

    const component = components.find(
      (currentComponent) => currentComponent.id === resize.componentId
    );

    if (!component || component.locked) return;

    const pageRect = page.getBoundingClientRect();
    const changeInWidth = event.clientX - resize.startX;

    const minimumWidth = 100;
    const maximumWidth = Math.max(
      minimumWidth,
      pageRect.width - component.x - 48
    );

    const proposedWidth = resize.startWidth + changeInWidth;

    updateComponent(component.id, {
      width: Math.min(Math.max(proposedWidth, minimumWidth), maximumWidth),
    });
  }

  function handlePagePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (resizeState.current) {
      resizeSelectedComponent(event);
      return;
    }

    moveSelectedComponent(event);
  }

  function stopPointerInteraction() {
    dragState.current = null;
    resizeState.current = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <TopBar />

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
        <Library onAddText={addTextComponent} />

        <WorksheetCanvas
          components={components}
          selectedComponentId={selectedComponentId}
          pageRef={pageRef}
          onSelectComponent={setSelectedComponentId}
          onStartDragging={startDragging}
          onPointerMove={handlePagePointerMove}
          onPointerEnd={stopPointerInteraction}
          onTextChange={(id, text) => updateComponent(id, { text })}
          onResizeStart={startResizing}
        />

        <aside className="hidden border-l border-slate-200 bg-white p-4 lg:block">
          <div className="mb-5">
            <h2 className="font-bold text-slate-900">Formatting</h2>

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
                  Text
                </div>
              </div>

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
                    updateComponent(selectedComponent.id, {
                      fontSize: Number(event.target.value),
                    })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-semibold text-slate-800">
                  Lock component
                </span>

                <input
                  type="checkbox"
                  checked={selectedComponent.locked}
                  onChange={(event) =>
                    updateComponent(selectedComponent.id, {
                      locked: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-violet-600"
                />
              </label>

              <button
                type="button"
                onClick={duplicateSelectedComponent}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Duplicate
              </button>

              <button
                type="button"
                onClick={deleteSelectedComponent}
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
      </main>

      <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-1 py-2 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] lg:hidden">
        {['Add', 'Edit', 'Arrange', 'Pages', 'Export'].map((item) => (
          <button
            key={item}
            type="button"
            className="min-h-12 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
