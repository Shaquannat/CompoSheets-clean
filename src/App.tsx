import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type {
  DragState,
  ResizeState,
  TextComponent,
  QuestionComponent,
  MultipleChoiceComponent,
  WorksheetComponent,
} from './types/worksheet';

import { TopBar } from './components/TopBar';
import { Library } from './components/Library';
import { WorksheetCanvas } from './components/WorksheetCanvas';
import { RightSidebar } from './components/RightSidebar';
import { HelpPanel } from './components/HelpPanel';

function App() {
  const pageRef = useRef<HTMLElement | null>(null);
  const dragState = useRef<DragState>(null);
  const resizeState = useRef<ResizeState>(null);
  const undoStack = useRef<WorksheetComponent[][]>([]);
const redoStack = useRef<WorksheetComponent[][]>([]);
const componentClipboard = useRef<WorksheetComponent[]>([]);

const textInputHistoryRef = useRef<{
  componentId: string;
  lastText: string;
} | null>(null);

const questionInputHistoryRef = useRef<{
  componentId: string;
  lastQuestion: string;
} | null>(null);

const checkboxInputHistoryRef = useRef<{
  componentId: string;
  itemId: string;
  lastText: string;
} | null>(null);

  const [components, setComponents] = useState<WorksheetComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);

  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    addToSelection: boolean;
  } | null>(null);

  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
const [findQuery, setFindQuery] = useState('');

const [findMatches, setFindMatches] = useState<
  {
    componentId: string;
    itemId?: string;
    start: number;
    end: number;
  }[]
>([]);

const [activeFindMatchIndex, setActiveFindMatchIndex] = useState(0);

const findMatch =
  findMatches[activeFindMatchIndex] ?? null;

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

  const [multipleChoiceSelection, setMultipleChoiceSelection] = useState<{
    componentId: string;
    optionId: string;
    start?: number;
    end?: number;
  } | null>(null);

  const selectedComponent =
    components.find((component) => component.id === selectedComponentId) ??
    null;

    function saveHistory(currentComponents: WorksheetComponent[]) {
      undoStack.current.push(
        structuredClone(currentComponents)
      );
    
      redoStack.current = [];
    }

    function recordTextInputHistory(
      componentId: string,
      nextText: string
    ) {
      const component = components.find(
        (currentComponent) =>
          currentComponent.id === componentId
      );
    
      if (!component || component.type !== 'text') return;
    
      const previousText =
        textInputHistoryRef.current?.componentId === componentId
          ? textInputHistoryRef.current.lastText
          : component.text;
    
      if (previousText === nextText) return;
    
      const previousComponents = components.map(
        (currentComponent) =>
          currentComponent.id === componentId &&
          currentComponent.type === 'text'
            ? {
                ...currentComponent,
                text: previousText,
                richText: previousText
                  ? [{ text: previousText }]
                  : [],
              }
            : currentComponent
      );
    
      undoStack.current.push(
        structuredClone(previousComponents)
      );
    
      redoStack.current = [];
    
      textInputHistoryRef.current = {
        componentId,
        lastText: nextText,
      };
    }
    
    function recordQuestionInputHistory(
      componentId: string,
      nextQuestion: string
    ) {
      const component = components.find(
        (currentComponent) =>
          currentComponent.id === componentId
      );
    
      if (!component || component.type !== 'question') return;
    
      const previousQuestion =
        questionInputHistoryRef.current?.componentId === componentId
          ? questionInputHistoryRef.current.lastQuestion
          : component.question;
    
      if (previousQuestion === nextQuestion) return;
    
      const previousComponents = components.map(
        (currentComponent) =>
          currentComponent.id === componentId &&
          currentComponent.type === 'question'
            ? {
                ...currentComponent,
                question: previousQuestion,
                richText: previousQuestion
                  ? [{ text: previousQuestion }]
                  : [],
              }
            : currentComponent
      );
    
      undoStack.current.push(
        structuredClone(previousComponents)
      );
    
      redoStack.current = [];
    
      questionInputHistoryRef.current = {
        componentId,
        lastQuestion: nextQuestion,
      };
    }

    function recordCheckboxInputHistory(
      componentId: string,
      itemId: string,
      nextText: string
    ) {
      const component = components.find(
        (currentComponent) =>
          currentComponent.id === componentId
      );
    
      if (!component || component.type !== 'checkbox') return;
    
      const item = component.items.find(
        (currentItem) => currentItem.id === itemId
      );
    
      if (!item) return;
    
      const previousText =
        checkboxInputHistoryRef.current?.componentId === componentId &&
        checkboxInputHistoryRef.current?.itemId === itemId
          ? checkboxInputHistoryRef.current.lastText
          : item.text;
    
      if (previousText === nextText) return;
    
      const previousComponents = components.map(
        (currentComponent) => {
          if (
            currentComponent.id !== componentId ||
            currentComponent.type !== 'checkbox'
          ) {
            return currentComponent;
          }
    
          return {
            ...currentComponent,
            items: currentComponent.items.map(
              (currentItem) =>
                currentItem.id === itemId
                  ? {
                      ...currentItem,
                      text: previousText,
                      richText: previousText
                        ? [{ text: previousText }]
                        : [],
                    }
                  : currentItem
            ),
          };
        }
      );
    
      undoStack.current.push(
        structuredClone(previousComponents)
      );
    
      redoStack.current = [];
    
      checkboxInputHistoryRef.current = {
        componentId,
        itemId,
        lastText: nextText,
      };

      setComponents((currentComponents) =>
  currentComponents.map((currentComponent) => {
    if (
      currentComponent.id !== componentId ||
      currentComponent.type !== 'checkbox'
    ) {
      return currentComponent;
    }

    return {
      ...currentComponent,
      items: currentComponent.items.map(
        (currentItem) =>
          currentItem.id === itemId
            ? {
                ...currentItem,
                text: nextText,
                richText: nextText
                  ? [{ text: nextText }]
                  : [],
              }
            : currentItem
      ),
    };
  })
);
    }

    function findMatchingComponent(query: string) {
      const normalizedQuery = query.trim().toLowerCase();
    
      if (!normalizedQuery) {
        setFindMatches([]);
        setActiveFindMatchIndex(0);
        return;
      }
    
      const matches: {
        componentId: string;
        itemId?: string;
        start: number;
        end: number;
      }[] = [];
    
      function collectMatches(
        text: string,
        componentId: string,
        itemId?: string
      ) {
        const normalizedText = text.toLowerCase();
    
        let searchFrom = 0;
    
        while (searchFrom < normalizedText.length) {
          const start = normalizedText.indexOf(
            normalizedQuery,
            searchFrom
          );
    
          if (start === -1) break;
    
          matches.push({
            componentId,
            itemId,
            start,
            end: start + normalizedQuery.length,
          });
    
          searchFrom = start + normalizedQuery.length;
        }
      }
    
      for (const component of components) {
        if (component.type === 'text') {
          const visibleText =
            component.richText.length > 0
              ? component.richText
                  .map((segment) => segment.text)
                  .join('')
              : component.text;
    
          collectMatches(
            visibleText,
            component.id
          );
        }
    
        if (component.type === 'question') {
          const visibleQuestion =
            component.richText.length > 0
              ? component.richText
                  .map((segment) => segment.text)
                  .join('')
              : component.question;
    
          collectMatches(
            visibleQuestion,
            component.id
          );
        }
    
        if (component.type === 'checkbox') {
          for (const item of component.items) {
            const visibleItemText =
              item.richText.length > 0
                ? item.richText
                    .map((segment) => segment.text)
                    .join('')
                : item.text;
    
            collectMatches(
              visibleItemText,
              component.id,
              item.id
            );
          }
        }
      }
    
      setFindMatches(matches);
      setActiveFindMatchIndex(0);
    
      const firstMatch = matches[0];
    
      if (!firstMatch) return;
    
      setSelectedComponentId(firstMatch.componentId);
      setSelectedComponentIds([
        firstMatch.componentId,
      ]);
    }

    function selectFindMatchByIndex(nextIndex: number) {
      if (findMatches.length === 0) return;
    
      const wrappedIndex =
        ((nextIndex % findMatches.length) + findMatches.length) %
        findMatches.length;
    
      const match = findMatches[wrappedIndex];
    
      setActiveFindMatchIndex(wrappedIndex);
      setSelectedComponentId(match.componentId);
      setSelectedComponentIds([match.componentId]);
    }

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
      fontFamily: 'Arial',
      fontWeight: 'normal',
      italic: false,
      underline: false,
textColor: '#0F172A',
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };

    setComponents((currentComponents) => {
      saveHistory(currentComponents);
    
      return [...currentComponents, newComponent];
    });

    setSelectedComponentId(newComponent.id);
    setSelectedComponentIds([newComponent.id]);
  }
  function addQuestionComponent() {
    const newComponent: QuestionComponent = {
      id: crypto.randomUUID(),
      type: 'question',
      question: '',
      richText: [],
      numberingMode: 'continue',
numberingStart: 1,
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 48,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
italic: false,
underline: false,
textColor: '#0F172A',
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };
  
    setComponents((currentComponents) => {
      saveHistory(currentComponents);
    
      return [
        ...currentComponents,
        newComponent,
      ];
    });
  
    setSelectedComponentId(newComponent.id);
    setSelectedComponentIds([newComponent.id]);
  }

  function addMultipleChoiceComponent() {
    const newComponent: MultipleChoiceComponent = {
      id: crypto.randomUUID(),
      type: 'multipleChoice',
  
      options: [
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
      ],
  
      labelStyle: 'A.',
      layout: 'vertical',
      markerStyle: 'plain',
  
      defaultStyle: {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        italic: false,
        underline: false,
        textColor: '#0F172A',
      },
  
      x: 64,
      y: 64 + components.length * 60,
      width: 500,
      height: 120,
      rotation: 0,
      locked: false,
      layer: components.length + 1,
    };
  
    setComponents((currentComponents) => {
      saveHistory(currentComponents);
  
      return [
        ...currentComponents,
        newComponent,
      ];
    });
  
    setSelectedComponentId(newComponent.id);
    setSelectedComponentIds([newComponent.id]);
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
  
    setComponents((currentComponents) => {
      saveHistory(currentComponents);
    
      return [
        ...currentComponents,
        newComponent,
      ];
    });
  
    setSelectedComponentId(newComponent.id);
    setSelectedComponentIds([newComponent.id]);
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
      fontFamily: 'Arial',
      bold: false,
      italic: false,
underline: false,
      markStyle: 'check',
      textColor: '#0f172a',
markColor: '#0f172a',
    };
  
    setComponents((current) => {
      saveHistory(current);
    
      return [...current, newComponent];
    });
    
    requestAnimationFrame(() => {
      setSelectedComponentId(newComponent.id);
      setSelectedComponentIds([newComponent.id]);
    });
  }

  function updateComponent(
    id: string,
    changes: Partial<WorksheetComponent>
  ) {
    const nextComponents = components.map((component) =>
      component.id === id
        ? { ...component, ...changes }
        : component
    );
  
    const hasChanged =
      JSON.stringify(components) !==
      JSON.stringify(nextComponents);
  
    if (!hasChanged) return;
  
    saveHistory(components);
    setComponents(nextComponents);
  }

  function deleteSelectedComponent() {
    if (!selectedComponentId) return;

    setComponents((currentComponents) => {
      saveHistory(currentComponents);
    
      return currentComponents.filter(
        (component) => component.id !== selectedComponentId
      );
    });

    setSelectedComponentId(null);
    setSelectedComponentIds([]);
  }

  function deleteSelectedComponents() {
    if (selectedComponentIds.length === 0) return;
  
    setComponents((currentComponents) => {
      saveHistory(currentComponents);
  
      return currentComponents.filter(
        (component) =>
          !selectedComponentIds.includes(component.id)
      );
    });
  
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    setTextSelection(null);
    setQuestionSelection(null);
    setCheckboxSelection(null);
  }

  function duplicateSelectedComponent() {
    const componentsToDuplicate =
      selectedComponentIds.length > 0
        ? components.filter((component) =>
            selectedComponentIds.includes(component.id)
          )
        : selectedComponent
          ? [selectedComponent]
          : [];
  
    if (componentsToDuplicate.length === 0) return;
  
    const duplicatedComponents =
      componentsToDuplicate.map((component, index) => ({
        ...structuredClone(component),
        id: crypto.randomUUID(),
        locked: false,
        x: component.x + 24,
        y: component.y + 24,
        layer: components.length + index + 1,
      }));
  
    saveHistory(components);
  
    setComponents((currentComponents) => [
      ...currentComponents,
      ...duplicatedComponents,
    ]);
  
    const duplicatedIds = duplicatedComponents.map(
      (component) => component.id
    );
  
    setSelectedComponentIds(duplicatedIds);
  
    setSelectedComponentId(
      duplicatedIds.length === 1
        ? duplicatedIds[0]
        : null
    );
  }

  function copySelectedComponent() {
    if (selectedComponentIds.length > 0) {
      componentClipboard.current = structuredClone(
        components.filter((component) =>
          selectedComponentIds.includes(component.id)
        )
      );
  
      return;
    }
  
    if (!selectedComponent) return;
  
    componentClipboard.current = [
      structuredClone(selectedComponent),
    ];
  }

  function pasteCopiedComponent() {
    const copiedComponents = componentClipboard.current;
  
    if (copiedComponents.length === 0) return;
  
    const pastedComponents = copiedComponents.map(
      (copiedComponent, index) => ({
        ...structuredClone(copiedComponent),
        id: crypto.randomUUID(),
        locked: false,
        x: copiedComponent.x + 24,
        y: copiedComponent.y + 24,
        layer: components.length + index + 1,
      })
    );
  
    saveHistory(components);

setComponents((currentComponents) => [
  ...currentComponents,
  ...pastedComponents,
]);
  
    const pastedIds = pastedComponents.map(
      (component) => component.id
    );
  
    setSelectedComponentIds(pastedIds);
  
    setSelectedComponentId(
      pastedIds.length === 1
        ? pastedIds[0]
        : null
    );
  }

  function cutSelectedComponent() {
    if (selectedComponentIds.length > 0) {
      componentClipboard.current = structuredClone(
        components.filter((component) =>
          selectedComponentIds.includes(component.id)
        )
      );
  
      saveHistory(components);

      setComponents((currentComponents) =>
        currentComponents.filter(
          (component) =>
            !selectedComponentIds.includes(component.id)
        )
      );
  
      setSelectedComponentId(null);
      setSelectedComponentIds([]);
      setTextSelection(null);
      setQuestionSelection(null);
      setCheckboxSelection(null);
  
      return;
    }
  
    if (!selectedComponent) return;
  
    componentClipboard.current = [
      structuredClone(selectedComponent),
    ];
  
    saveHistory(components);

setComponents((currentComponents) =>
  currentComponents.filter(
    (component) =>
      component.id !== selectedComponent.id
  )
);
  
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    setTextSelection(null);
    setQuestionSelection(null);
    setCheckboxSelection(null);
  }

  function undo() {
    if (undoStack.current.length === 0) return;
  
    const previousState = undoStack.current.pop();
  
    if (!previousState) return;
  
    const currentComponents = components.map((component) => {
      if (
        component.type === 'text' &&
        textInputHistoryRef.current?.componentId === component.id
      ) {
        const liveText = textInputHistoryRef.current.lastText;
  
        return {
          ...component,
          text: liveText,
          richText: liveText
            ? [{ text: liveText }]
            : [],
        };
      }
  
      if (
        component.type === 'question' &&
        questionInputHistoryRef.current?.componentId === component.id
      ) {
        const liveQuestion =
          questionInputHistoryRef.current.lastQuestion;
  
        return {
          ...component,
          question: liveQuestion,
          richText: liveQuestion
            ? [{ text: liveQuestion }]
            : [],
        };
      }
  
      if (
        component.type === 'checkbox' &&
        checkboxInputHistoryRef.current?.componentId === component.id
      ) {
        const liveItemId =
          checkboxInputHistoryRef.current.itemId;
  
        const liveText =
          checkboxInputHistoryRef.current.lastText;
  
        return {
          ...component,
          items: component.items.map((item) =>
            item.id === liveItemId
              ? {
                  ...item,
                  text: liveText,
                  richText: liveText
                    ? [{ text: liveText }]
                    : [],
                }
              : item
          ),
        };
      }
  
      return component;
    });
  
    redoStack.current.push(
      structuredClone(currentComponents)
    );
  
    setComponents(
      structuredClone(previousState)
    );
  
    if (textInputHistoryRef.current) {
      const previousTextComponent = previousState.find(
        (component) =>
          component.id === textInputHistoryRef.current?.componentId &&
          component.type === 'text'
      );
  
      if (
        previousTextComponent &&
        previousTextComponent.type === 'text'
      ) {
        textInputHistoryRef.current = {
          componentId: previousTextComponent.id,
          lastText: previousTextComponent.text,
        };
      } else {
        textInputHistoryRef.current = null;
      }
    }
  
    if (questionInputHistoryRef.current) {
      const previousQuestionComponent = previousState.find(
        (component) =>
          component.id ===
            questionInputHistoryRef.current?.componentId &&
          component.type === 'question'
      );
  
      if (
        previousQuestionComponent &&
        previousQuestionComponent.type === 'question'
      ) {
        questionInputHistoryRef.current = {
          componentId: previousQuestionComponent.id,
          lastQuestion: previousQuestionComponent.question,
        };
      } else {
        questionInputHistoryRef.current = null;
      }
    }
  
    if (checkboxInputHistoryRef.current) {
      const previousCheckboxComponent =
        previousState.find(
          (component) =>
            component.id ===
              checkboxInputHistoryRef.current?.componentId &&
            component.type === 'checkbox'
        );
  
      if (
        previousCheckboxComponent &&
        previousCheckboxComponent.type === 'checkbox'
      ) {
        const previousItem =
          previousCheckboxComponent.items.find(
            (item) =>
              item.id ===
              checkboxInputHistoryRef.current?.itemId
          );
  
        if (previousItem) {
          checkboxInputHistoryRef.current = {
            componentId: previousCheckboxComponent.id,
            itemId: previousItem.id,
            lastText: previousItem.text,
          };
        } else {
          checkboxInputHistoryRef.current = null;
        }
      } else {
        checkboxInputHistoryRef.current = null;
      }
    }
  
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    setTextSelection(null);
    setQuestionSelection(null);
    setCheckboxSelection(null);
  }

  function redo() {
    if (redoStack.current.length === 0) return;
  
    const nextState = redoStack.current.pop();
  
    if (!nextState) return;
  
    const currentComponents = components.map((component) => {
      if (
        component.type === 'text' &&
        textInputHistoryRef.current?.componentId === component.id
      ) {
        const liveText = textInputHistoryRef.current.lastText;
  
        return {
          ...component,
          text: liveText,
          richText: liveText
            ? [{ text: liveText }]
            : [],
        };
      }
  
      if (
        component.type === 'question' &&
        questionInputHistoryRef.current?.componentId === component.id
      ) {
        const liveQuestion =
          questionInputHistoryRef.current.lastQuestion;
  
        return {
          ...component,
          question: liveQuestion,
          richText: liveQuestion
            ? [{ text: liveQuestion }]
            : [],
        };
      }
  
      if (
        component.type === 'checkbox' &&
        checkboxInputHistoryRef.current?.componentId === component.id
      ) {
        const liveItemId =
          checkboxInputHistoryRef.current.itemId;
  
        const liveText =
          checkboxInputHistoryRef.current.lastText;
  
        return {
          ...component,
          items: component.items.map((item) =>
            item.id === liveItemId
              ? {
                  ...item,
                  text: liveText,
                  richText: liveText
                    ? [{ text: liveText }]
                    : [],
                }
              : item
          ),
        };
      }
  
      return component;
    });
  
    undoStack.current.push(
      structuredClone(currentComponents)
    );
  
    setComponents(
      structuredClone(nextState)
    );
  
    if (textInputHistoryRef.current) {
      const nextTextComponent = nextState.find(
        (component) =>
          component.id === textInputHistoryRef.current?.componentId &&
          component.type === 'text'
      );
  
      if (
        nextTextComponent &&
        nextTextComponent.type === 'text'
      ) {
        textInputHistoryRef.current = {
          componentId: nextTextComponent.id,
          lastText: nextTextComponent.text,
        };
      } else {
        textInputHistoryRef.current = null;
      }
    }
  
    if (questionInputHistoryRef.current) {
      const nextQuestionComponent = nextState.find(
        (component) =>
          component.id ===
            questionInputHistoryRef.current?.componentId &&
          component.type === 'question'
      );
  
      if (
        nextQuestionComponent &&
        nextQuestionComponent.type === 'question'
      ) {
        questionInputHistoryRef.current = {
          componentId: nextQuestionComponent.id,
          lastQuestion: nextQuestionComponent.question,
        };
      } else {
        questionInputHistoryRef.current = null;
      }
    }
  
    if (checkboxInputHistoryRef.current) {
      const nextCheckboxComponent =
        nextState.find(
          (component) =>
            component.id ===
              checkboxInputHistoryRef.current?.componentId &&
            component.type === 'checkbox'
        );
  
      if (
        nextCheckboxComponent &&
        nextCheckboxComponent.type === 'checkbox'
      ) {
        const nextItem =
          nextCheckboxComponent.items.find(
            (item) =>
              item.id ===
              checkboxInputHistoryRef.current?.itemId
          );
  
        if (nextItem) {
          checkboxInputHistoryRef.current = {
            componentId: nextCheckboxComponent.id,
            itemId: nextItem.id,
            lastText: nextItem.text,
          };
        } else {
          checkboxInputHistoryRef.current = null;
        }
      } else {
        checkboxInputHistoryRef.current = null;
      }
    }
  
    setSelectedComponentId(null);
    setSelectedComponentIds([]);
    setTextSelection(null);
    setQuestionSelection(null);
    setCheckboxSelection(null);
  }
  
  function handleToolbarUndo() {
    undo();
  }
  
  function handleToolbarRedo() {
    redo();
  }
  
  function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
  
    return (
      target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    );
  }

  function selectAdjacentComponent(direction: 1 | -1) {
    if (components.length === 0) return;
  
    const orderedComponents = [...components].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 8) {
        return a.x - b.x;
      }
  
      return a.y - b.y;
    });
  
    const currentIndex = selectedComponentId
      ? orderedComponents.findIndex(
          (component) => component.id === selectedComponentId
        )
      : -1;
  
    let nextIndex: number;
  
    if (currentIndex === -1) {
      nextIndex =
        direction === 1
          ? 0
          : orderedComponents.length - 1;
    } else {
      nextIndex =
        (currentIndex + direction + orderedComponents.length) %
        orderedComponents.length;
    }
  
    const nextComponent = orderedComponents[nextIndex];
  
    setSelectedComponentId(nextComponent.id);
    setSelectedComponentIds([nextComponent.id]);
  
    setTextSelection(null);
    setQuestionSelection(null);
    setCheckboxSelection(null);
  }

  function beginEditingSelectedComponent(): HTMLElement | null {
    if (!selectedComponentId) return null;
  
    const component = components.find(
      (currentComponent) =>
        currentComponent.id === selectedComponentId
    );
  
    if (!component) return null;
  
    let editor: HTMLElement | null = null;
  
    if (component.type === 'text') {
      editor = document.querySelector<HTMLElement>(
        `[data-text-component-id="${component.id}"]`
      );
    }
  
    if (component.type === 'question') {
      editor = document.querySelector<HTMLElement>(
        `[data-question-component-id="${component.id}"]`
      );
    }
  
    if (!editor) return null;
  
    editor.focus();
  
    const selection = window.getSelection();
  
    if (!selection) return editor;
  
    const range = document.createRange();
  
    range.selectNodeContents(editor);
    range.collapse(false);
  
    selection.removeAllRanges();
    selection.addRange(range);
  
    return editor;
  }

  function insertCharacterIntoEditor(
    editor: HTMLElement,
    character: string
  ) {
    const selection = window.getSelection();
  
    if (!selection) return;
  
    let range: Range;
  
    if (
      selection.rangeCount > 0 &&
      editor.contains(
        selection.getRangeAt(0).startContainer
      )
    ) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
  
    range.deleteContents();
  
    const textNode = document.createTextNode(character);
  
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
  
    selection.removeAllRanges();
    selection.addRange(range);
  
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: character,
      })
    );
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'Escape' &&
        isHelpOpen
      ) {
        event.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      if (
        event.key === '?' &&
        !isHelpOpen &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        setIsHelpOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        if (isEditableTarget(event.target)) {
          event.preventDefault();
      
          if (event.target instanceof HTMLElement) {
            event.target.blur();
          }
      
          setTextSelection(null);
          setQuestionSelection(null);
          setCheckboxSelection(null);
      
          if (selectedComponentId) {
            setSelectedComponentIds([selectedComponentId]);
          }
      
          return;
        }
      
        setSelectedComponentId(null);
        setSelectedComponentIds([]);
        setTextSelection(null);
        setQuestionSelection(null);
        setCheckboxSelection(null);
      
        return;
      }
      
      if (
        event.key === 'Tab' &&
        !isEditableTarget(event.target)
      ) {
        const target = event.target;
      
        if (
          target instanceof HTMLElement &&
          target.closest(
            'button, a, input, textarea, select, [role="button"]'
          )
        ) {
          return;
        }
      
        event.preventDefault();
      
        selectAdjacentComponent(
          event.shiftKey ? -1 : 1
        );
      
        return;
      }

      if (
        event.key === 'Enter' &&
        !isEditableTarget(event.target) &&
        selectedComponentIds.length === 1 &&
        selectedComponentId
      ) {
        const selected = components.find(
          (component) =>
            component.id === selectedComponentId
        );
      
        if (
          selected?.type === 'text' ||
          selected?.type === 'question'
        ) {
          event.preventDefault();
      
          beginEditingSelectedComponent();
      
          return;
        }
      }

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditableTarget(event.target) &&
        selectedComponentIds.length === 1 &&
        selectedComponentId
      ) {
        const target = event.target;
      
        if (
          target instanceof HTMLElement &&
          target.closest(
            'button, a, input, textarea, select, [role="button"]'
          )
        ) {
          return;
        }
      
        const selected = components.find(
          (component) =>
            component.id === selectedComponentId
        );
      
        if (
          selected?.type === 'text' ||
          selected?.type === 'question'
        ) {
          event.preventDefault();
      
          const editor =
            beginEditingSelectedComponent();
      
          if (editor) {
            insertCharacterIntoEditor(
              editor,
              event.key
            );
          }
      
          return;
        }
      }
      
      const isModifierPressed =
        event.ctrlKey || event.metaKey;

        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'f'
        ) {
          event.preventDefault();
          setIsFindOpen(true);
          return;
        }

        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'a' &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
        
          const allComponentIds = components.map(
            (component) => component.id
          );
        
          setSelectedComponentIds(allComponentIds);
          setSelectedComponentId(null);
        
          return;
        }

        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'd'
        ) {
          event.preventDefault();
        
          if (!isEditableTarget(event.target)) {
            duplicateSelectedComponent();
          }
        
          return;
        }

        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'c' &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
          copySelectedComponent();
          return;
        }
        
        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'x' &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
          cutSelectedComponent();
          return;
        }
        
        if (
          isModifierPressed &&
          event.key.toLowerCase() === 'v' &&
          !isEditableTarget(event.target)
        ) {
          event.preventDefault();
          pasteCopiedComponent();
          return;
        }

        if (
          event.key === 'Delete' &&
          !isEditableTarget(event.target)
        ) {
          if (selectedComponentIds.length > 1) {
            event.preventDefault();
            deleteSelectedComponents();
            return;
          }
        
          if (selectedComponentId) {
            event.preventDefault();
            deleteSelectedComponent();
            return;
          }
        }

        if (
          !isEditableTarget(event.target) &&
          ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) &&
          selectedComponentIds.length > 0
        ) {
          event.preventDefault();
        
          const nudgeAmount = event.shiftKey ? 10 : 1;
        
          const deltaX =
            event.key === 'ArrowLeft'
              ? -nudgeAmount
              : event.key === 'ArrowRight'
                ? nudgeAmount
                : 0;
        
          const deltaY =
            event.key === 'ArrowUp'
              ? -nudgeAmount
              : event.key === 'ArrowDown'
                ? nudgeAmount
                : 0;
        
          setComponents((currentComponents) => {
            saveHistory(currentComponents);
        
            return currentComponents.map((component) =>
              selectedComponentIds.includes(component.id)
                ? {
                    ...component,
                    x: component.x + deltaX,
                    y: component.y + deltaY,
                  }
                : component
            );
          });
        
          return;
        }
  
        if (!isModifierPressed) return;

        const key = event.key.toLowerCase();
        
        if (
          isEditableTarget(event.target) &&
          (key === 'z' || key === 'y')
        ) {
          event.preventDefault();
        
          if (key === 'y' || (key === 'z' && event.shiftKey)) {
            redo();
          } else {
            undo();
          }
        
          return;
        }
        
        if (key === 'z') {
          event.preventDefault();
        
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        
          return;
        }
        
        if (key === 'y') {
          event.preventDefault();
          redo();
        }
      }
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

  }, [components, selectedComponentId, selectedComponentIds, isHelpOpen,]);

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

    const draggedComponentIds =
  selectedComponentIds.includes(component.id) &&
  selectedComponentIds.length > 1
    ? selectedComponentIds
    : [component.id];

dragState.current = {
  componentId: component.id,
  offsetX: event.clientX - pageRect.left - component.x,
  offsetY: event.clientY - pageRect.top - component.y,
  startX: component.x,
  startY: component.y,
  historySaved: false,
  components: components
    .filter((currentComponent) =>
      draggedComponentIds.includes(currentComponent.id)
    )
    .map((currentComponent) => ({
      id: currentComponent.id,
      startX: currentComponent.x,
      startY: currentComponent.y,
    })),
};

    setSelectedComponentId(component.id);
  }

  function moveSelectedComponent(event: ReactPointerEvent<HTMLElement>) {
    const page = pageRef.current;
    const drag = dragState.current;
  
    if (!page || !drag) return;
  
    const pageRect = page.getBoundingClientRect();
  
    const draggedComponent = components.find(
      (currentComponent) =>
        currentComponent.id === drag.componentId
    );
  
    if (!draggedComponent || draggedComponent.locked) return;
  
    const proposedX =
      event.clientX - pageRect.left - drag.offsetX;
  
    const proposedY =
      event.clientY - pageRect.top - drag.offsetY;
  
    const deltaX = proposedX - drag.startX;
    const deltaY = proposedY - drag.startY;
  
    const draggedIds = drag.components.map(
      (item) => item.id
    );
  
    const draggedComponents = components.filter(
      (component) => draggedIds.includes(component.id)
    );
  
    if (draggedComponents.length === 0) return;
  
    const minimumX = Math.min(
      ...drag.components.map((item) => item.startX)
    );
  
    const minimumY = Math.min(
      ...drag.components.map((item) => item.startY)
    );
  
    const maximumRight = Math.max(
      ...drag.components.map((item) => {
        const currentComponent = components.find(
          (component) => component.id === item.id
        );
    
        return (
          item.startX +
          (currentComponent?.width ?? 0)
        );
      })
    );
    
    const maximumBottom = Math.max(
      ...drag.components.map((item) => {
        const currentComponent = components.find(
          (component) => component.id === item.id
        );
    
        return (
          item.startY +
          (currentComponent?.height ?? 0)
        );
      })
    );
  
    const minimumDeltaX = 48 - minimumX;
    const minimumDeltaY = 48 - minimumY;
  
    const maximumDeltaX =
      pageRect.width - 48 - maximumRight;
  
    const maximumDeltaY =
      pageRect.height - 48 - maximumBottom;
  
    const clampedDeltaX = Math.min(
      Math.max(deltaX, minimumDeltaX),
      maximumDeltaX
    );
  
    const clampedDeltaY = Math.min(
      Math.max(deltaY, minimumDeltaY),
      maximumDeltaY
    );
  
    if (!drag.historySaved) {
      saveHistory(components);
      drag.historySaved = true;
    }
  
    setComponents((currentComponents) =>
      currentComponents.map((component) => {
        const original = drag.components.find(
          (item) => item.id === component.id
        );
  
        if (!original) return component;
  
        return {
          ...component,
          x: original.startX + clampedDeltaX,
          y: original.startY + clampedDeltaY,
        };
      })
    );
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

    const resizeComponentIds =
  selectedComponentIds.includes(component.id) &&
  selectedComponentIds.length > 1
    ? selectedComponentIds
    : [component.id];

const resizeComponents = components.filter(
  (currentComponent) =>
    resizeComponentIds.includes(currentComponent.id)
);

const groupLeft = Math.min(
  ...resizeComponents.map(
    (currentComponent) => currentComponent.x
  )
);

const groupTop = Math.min(
  ...resizeComponents.map(
    (currentComponent) => currentComponent.y
  )
);

const groupRight = Math.max(
  ...resizeComponents.map(
    (currentComponent) =>
      currentComponent.x + currentComponent.width
  )
);

const groupBottom = Math.max(
  ...resizeComponents.map(
    (currentComponent) =>
      currentComponent.y + currentComponent.height
  )
);

resizeState.current = {
  componentId: component.id,
  startX: event.clientX,
  startY: event.clientY,
  startWidth: component.width,
  startHeight: component.height,
  historySaved: false,
  groupBounds:
    resizeComponents.length > 1
      ? {
          x: groupLeft,
          y: groupTop,
          width: groupRight - groupLeft,
          height: groupBottom - groupTop,
        }
      : null,
  components: resizeComponents.map(
    (currentComponent) => ({
      id: currentComponent.id,
      startX: currentComponent.x,
      startY: currentComponent.y,
      startWidth: currentComponent.width,
      startHeight: currentComponent.height,
    })
  ),
};

    setSelectedComponentId(component.id);
  }

  function resizeSelectedComponent(event: ReactPointerEvent<HTMLElement>) {
    const page = pageRef.current;
    const resize = resizeState.current;
  
    if (!page || !resize) return;
  
    const component = components.find(
      (currentComponent) =>
        currentComponent.id === resize.componentId
    );
  
    if (!component || component.locked) return;
  
    const pageRect = page.getBoundingClientRect();
  
    const changeInWidth = event.clientX - resize.startX;
    const changeInHeight = event.clientY - resize.startY;
  
    // GROUP RESIZE
    if (resize.groupBounds && resize.components.length > 1) {
      const bounds = resize.groupBounds;
  
      const proposedWidth = Math.max(
        100,
        bounds.width + changeInWidth
      );
  
      const proposedHeight = Math.max(
        40,
        bounds.height + changeInHeight
      );
  
      const widthScale = proposedWidth / bounds.width;
      const heightScale = proposedHeight / bounds.height;
  
      // Keep the whole group proportional.
      const scale =
  Math.abs(widthScale - 1) >= Math.abs(heightScale - 1)
    ? widthScale
    : heightScale;
  
      const maximumScaleX =
        (pageRect.width - 48 - bounds.x) / bounds.width;
  
      const maximumScaleY =
        (pageRect.height - 48 - bounds.y) / bounds.height;
  
      const minimumScale = Math.max(
        ...resize.components.map((item) =>
          Math.max(
            40 / item.startWidth,
            24 / item.startHeight
          )
        )
      );
  
      const clampedScale = Math.min(
        Math.max(scale, minimumScale),
        maximumScaleX,
        maximumScaleY
      );
  
      if (!resize.historySaved) {
        saveHistory(components);
        resize.historySaved = true;
      }
  
      setComponents((currentComponents) =>
        currentComponents.map((currentComponent) => {
          const original = resize.components.find(
            (item) => item.id === currentComponent.id
          );
  
          if (!original) return currentComponent;
  
          return {
            ...currentComponent,
            x:
              bounds.x +
              (original.startX - bounds.x) * clampedScale,
            y:
              bounds.y +
              (original.startY - bounds.y) * clampedScale,
            width: original.startWidth * clampedScale,
            height: original.startHeight * clampedScale,
          };
        })
      );
  
      return;
    }
  
    // SINGLE COMPONENT RESIZE
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
  
    const proposedWidth =
      resize.startWidth + changeInWidth;
  
    const proposedHeight =
      resize.startHeight + changeInHeight;
  
      if (!resize.historySaved) {
        saveHistory(components);
        resize.historySaved = true;
      }
      
      if (
        component.type === 'answerLines' ||
        component.type === 'checkbox'
      ) {
        setComponents((currentComponents) =>
          currentComponents.map((currentComponent) =>
            currentComponent.id === component.id
              ? {
                  ...currentComponent,
                  width: Math.min(
                    Math.max(proposedWidth, minimumWidth),
                    maximumWidth
                  ),
                }
              : currentComponent
          )
        );
      
        return;
      }
      
      setComponents((currentComponents) =>
        currentComponents.map((currentComponent) =>
          currentComponent.id === component.id
            ? {
                ...currentComponent,
                width: Math.min(
                  Math.max(proposedWidth, minimumWidth),
                  maximumWidth
                ),
                height: Math.min(
                  Math.max(proposedHeight, minimumHeight),
                  maximumHeight
                ),
              }
            : currentComponent
        )
      );
  }

  function startSelectionBox(event: ReactPointerEvent<HTMLElement>) {
    const page = pageRef.current;
  
    if (!page) return;
  
    const target = event.target as HTMLElement;
  
    if (target.closest('[data-worksheet-component="true"]')) {
      return;
    }
  
    const pageRect = page.getBoundingClientRect();
  
    const x = event.clientX - pageRect.left;
    const y = event.clientY - pageRect.top;
  
    setSelectionBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      addToSelection: event.ctrlKey || event.metaKey,
    });
  
    if (!(event.ctrlKey || event.metaKey)) {
      setSelectedComponentId(null);
      setSelectedComponentIds([]);
    }
  }

  function handlePagePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (selectionBox) {
      const page = pageRef.current;
  
      if (!page) return;
  
      const pageRect = page.getBoundingClientRect();
  
      setSelectionBox((currentBox) =>
        currentBox
          ? {
              ...currentBox,
              currentX: event.clientX - pageRect.left,
              currentY: event.clientY - pageRect.top,
            }
          : null
      );
  
      return;
    }
  
    if (resizeState.current) {
      resizeSelectedComponent(event);
      return;
    }
  
    moveSelectedComponent(event);
  }

  function stopPointerInteraction() {
    if (selectionBox) {
      const left = Math.min(
        selectionBox.startX,
        selectionBox.currentX
      );
  
      const right = Math.max(
        selectionBox.startX,
        selectionBox.currentX
      );
  
      const top = Math.min(
        selectionBox.startY,
        selectionBox.currentY
      );
  
      const bottom = Math.max(
        selectionBox.startY,
        selectionBox.currentY
      );
  
      const selectedIds = components
        .filter((component) => {
          const componentRight =
            component.x + component.width;
  
          const componentBottom =
            component.y + component.height;
  
          return (
            component.x < right &&
            componentRight > left &&
            component.y < bottom &&
            componentBottom > top
          );
        })
        .map((component) => component.id);
  
        const nextSelectedIds = selectionBox.addToSelection
        ? Array.from(
            new Set([
              ...selectedComponentIds,
              ...selectedIds,
            ])
          )
        : selectedIds;
      
      setSelectedComponentIds(nextSelectedIds);
      
      setSelectedComponentId(
        nextSelectedIds.length === 1
          ? nextSelectedIds[0]
          : null
      );
  
      setSelectionBox(null);
    }
  
    dragState.current = null;
    resizeState.current = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {isFindOpen && (
  <div className="fixed right-4 top-20 z-[20000] flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
    <input
      type="text"
      value={findQuery}
      onChange={(event) => {
        const nextQuery = event.target.value;

        setFindQuery(nextQuery);
        findMatchingComponent(nextQuery);
      }}
      placeholder="Find in worksheet"
      autoFocus
      className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
    />

    <span className="min-w-[52px] text-center text-sm text-slate-500">
      {findMatches.length > 0
        ? `${activeFindMatchIndex + 1} of ${findMatches.length}`
        : '0 of 0'}
    </span>

    <button
      type="button"
      onClick={() =>
        selectFindMatchByIndex(activeFindMatchIndex - 1)
      }
      disabled={findMatches.length === 0}
      className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Previous match"
      title="Previous match"
    >
    <svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2.5"
  strokeLinecap="round"
  strokeLinejoin="round"
  aria-hidden="true"
>
  <path d="M12 19V5" />
  <path d="M6 11l6-6 6 6" />
</svg>
    </button>

    <button
      type="button"
      onClick={() =>
        selectFindMatchByIndex(activeFindMatchIndex + 1)
      }
      disabled={findMatches.length === 0}
      className="flex h-9 w-9 items-center justify-center rounded-md text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Next match"
      title="Next match"
    >
    <svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2.5"
  strokeLinecap="round"
  strokeLinejoin="round"
  aria-hidden="true"
>
  <path d="M12 5v14" />
  <path d="M18 13l-6 6-6-6" />
</svg>
    </button>

    <button
      type="button"
      onClick={() => {
        setIsFindOpen(false);
        setFindQuery('');
        setFindMatches([]);
        setActiveFindMatchIndex(0);
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
      aria-label="Close find"
      title="Close find"
    >
      ×
    </button>
  </div>
)}

<HelpPanel
  isOpen={isHelpOpen}
  onClose={() => setIsHelpOpen(false)}
/>

<TopBar
  onUndo={handleToolbarUndo}
  onRedo={handleToolbarRedo}
  onHelp={() => setIsHelpOpen(true)}
/>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_260px]">
      <Library 
  onAddText={addTextComponent}
  onAddQuestion={addQuestionComponent}
  onAddMultipleChoice={addMultipleChoiceComponent}
  onAddAnswerLines={addAnswerLinesComponent}
  onAddCheckbox={addCheckboxComponent}
/>

        <WorksheetCanvas
          components={components}
          selectedComponentId={selectedComponentId}
          selectedComponentIds={selectedComponentIds}
          selectionBox={selectionBox}
          findMatch={findMatch}
          findMatches={findMatches}
activeFindMatch={findMatch}
          pageRef={pageRef}
          onSelectComponent={(id, event) => {
            if (!id) {
              setSelectedComponentId(null);
              setSelectedComponentIds([]);
              return;
            }
          
            const isMultiSelect =
              event?.ctrlKey || event?.metaKey;
          
            if (isMultiSelect) {
              setSelectedComponentIds((currentIds) => {
                const alreadySelected =
                  currentIds.includes(id);
          
                const nextIds = alreadySelected
                  ? currentIds.filter(
                      (currentId) => currentId !== id
                    )
                  : [...currentIds, id];
          
                setSelectedComponentId(
                  nextIds.length === 1
                    ? nextIds[0]
                    : null
                );
          
                return nextIds;
              });
          
              return;
            }
          
            setSelectedComponentId(id);
            setSelectedComponentIds([id]);
          }}
          onStartSelectionBox={startSelectionBox}
          onStartDragging={startDragging}
          onPointerMove={handlePagePointerMove}
          onPointerEnd={stopPointerInteraction}
          onTextChange={(id, text) => updateComponent(id, { text })}
          onTextInput={recordTextInputHistory}
          onQuestionInput={recordQuestionInputHistory}
          onCheckboxInput={recordCheckboxInputHistory}
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

          onMultipleChoiceSelectionChange={(componentId, optionId, range) => {
            setMultipleChoiceSelection({
              componentId,
              optionId,
              start: range?.start,
              end: range?.end,
            });
          }}

          onResizeStart={startResizing}
        />

<RightSidebar
  selectedComponent={selectedComponent}
  selectedComponentCount={selectedComponentIds.length}
  textSelection={textSelection}
  questionSelection={questionSelection}
  checkboxSelection={checkboxSelection}
  multipleChoiceSelection={multipleChoiceSelection}
  onUpdateComponent={updateComponent}
  onDuplicate={duplicateSelectedComponent}
  onDelete={
    selectedComponentIds.length > 1
      ? deleteSelectedComponents
      : deleteSelectedComponent
  }
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
