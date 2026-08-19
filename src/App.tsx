import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  DragState,
  ResizeState,
  TextComponent,
  QuestionComponent,
  WorksheetComponent,
} from './types/worksheet';

import { TopBar } from './components/TopBar';
import { Library } from './components/Library';
import { WorksheetCanvas } from './components/WorksheetCanvas';
import { RightSidebar } from './components/RightSidebar';

function App() {
  const pageRef = useRef<HTMLElement | null>(null);
  const dragState = useRef<DragState>(null);
  const resizeState = useRef<ResizeState>(null);
  const [components, setComponents] = useState<WorksheetComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );

  const [textSelection, setTextSelection] = useState<{
    id: string;
    start: number;
    end: number;
  } | null>(null);

  const [questionSelection, setQuestionSelection] = useState<{
    id: string;
    start: number;
    end: number;
  } | null>(null);

  const [checkboxSelection, setCheckboxSelection] = useState<{
    componentId: string;
    itemId: string;
    start: number;
    end: number;
  } | null>(null);

  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ??
    null;

  function addTextComponent() {
    const newComponent: TextComponent = {
      id: crypto.randomUUID(),
      type: 'text',
      text: '',
      richText: [],
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 48,
      fontSize: 16,
      fontWeight: 'normal',
      italic: false,
      underline: false,
textColor: '#0F172A',
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };

    setComponents((currentComponents) => [...currentComponents, newComponent]);

    setSelectedComponentId(newComponent.id);
  }
  function addQuestionComponent() {
    const newComponent: QuestionComponent = {
      id: crypto.randomUUID(),
      type: 'question',
      question: '',
      richText: [],
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 48,
      fontSize: 16,
      fontWeight: 'normal',
italic: false,
underline: false,
textColor: '#0F172A',
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };
  
    setComponents((currentComponents) => [
      ...currentComponents,
      newComponent,
    ]);
  
    setSelectedComponentId(newComponent.id);
  }
  function addAnswerLinesComponent() {
    const newComponent: AnswerLinesComponent = {
      id: crypto.randomUUID(),
      type: 'answerLines',
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 40,
      lineCount: 1,
      lineSpacing: 40,
      lineStyle: 'standard',
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };
  
    setComponents((currentComponents) => [
      ...currentComponents,
      newComponent,
    ]);
  
    setSelectedComponentId(newComponent.id);
  }

  function addCheckboxComponent() {
    const newComponent: WorksheetComponent = {
      id: crypto.randomUUID(),
      type: 'checkbox',
      x: 64,
      y: 64 + components.length * 60,
      width: 300,
      height: 48,
      rotation: 0,
      locked: false,
      layer: components.length,
      items: [
        {
          id: crypto.randomUUID(),
          text: '',
          richText: [],
          checked: false,
          markStyle: 'check',
          markColor: '#0F172A',
          showPlaceholder: true,
        },
      ],
      layout: 'list',
      fontSize: 16,
      bold: false,
      italic: false,
underline: false,
      markStyle: 'check',
      textColor: '#0f172a',
markColor: '#0f172a',
    };
  
    setComponents((current) => [...current, newComponent]);
    
    requestAnimationFrame(() => {
      setSelectedComponentId(newComponent.id);
    });
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
      locked: false,
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
      startY: event.clientY,
      startWidth: component.width,
      startHeight: component.height,
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
const changeInHeight = event.clientY - resize.startY;

const minimumWidth = 100;
const minimumHeight = 40;

const maximumWidth = Math.max(
  minimumWidth,
  pageRect.width - component.x - 48
);

const maximumHeight = Math.max(
  minimumHeight,
  pageRect.height - component.y - 48
);

const proposedWidth = resize.startWidth + changeInWidth;
const proposedHeight = resize.startHeight + changeInHeight;

if (
  component.type === 'answerLines' ||
  component.type === 'checkbox'
) {
  updateComponent(component.id, {
    width: Math.min(
      Math.max(proposedWidth, minimumWidth),
      maximumWidth
    ),
  });

  return;
}

updateComponent(component.id, {
  width: Math.min(
    Math.max(proposedWidth, minimumWidth),
    maximumWidth
  ),
  height: Math.min(
    Math.max(proposedHeight, minimumHeight),
    maximumHeight
  ),
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
      <Library
  onAddText={addTextComponent}
  onAddQuestion={addQuestionComponent}
  onAddAnswerLines={addAnswerLinesComponent}
  onAddCheckbox={addCheckboxComponent}
/>

        <WorksheetCanvas
          components={components}
          selectedComponentId={selectedComponentId}
          pageRef={pageRef}
          onSelectComponent={setSelectedComponentId}
          onStartDragging={startDragging}
          onPointerMove={handlePagePointerMove}
          onPointerEnd={stopPointerInteraction}
          onTextChange={(id, text) => updateComponent(id, { text })}
          onUpdateComponent={updateComponent}

          onTextSelectionChange={(id, range) => {
            setTextSelection(
              range
                ? {
                    id,
                    start: range.start,
                    end: range.end,
                  }
                : null
            );
          }}

          onQuestionSelectionChange={(id, range) => {
            setQuestionSelection(
              range
                ? {
                    id,
                    start: range.start,
                    end: range.end,
                  }
                : null
            );
          }}

          onCheckboxSelectionChange={(componentId, itemId, range) => {
            setCheckboxSelection(
              range
                ? {
                    componentId,
                    itemId,
                    start: range.start,
                    end: range.end,
                  }
                : null
            );
          }}

          onResizeStart={startResizing}
        />

<RightSidebar
  selectedComponent={selectedComponent}
  textSelection={textSelection}
  questionSelection={questionSelection}
  checkboxSelection={checkboxSelection}
  onUpdateComponent={updateComponent}
  onDuplicate={duplicateSelectedComponent}
  onDelete={deleteSelectedComponent}
/>
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
