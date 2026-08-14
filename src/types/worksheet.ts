export type ComponentType = 'text' | 'question';

export type BaseWorksheetComponent = {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  layer: number;
};

export type TextComponent = BaseWorksheetComponent & {
  type: 'text';
  text: string;
  fontSize: number;
};

export type QuestionComponent = BaseWorksheetComponent & {
  type: 'question';
  question: string;
  fontSize: number;
};

export type WorksheetComponent = TextComponent | QuestionComponent;

export type DragState = {
  componentId: string;
  offsetX: number;
  offsetY: number;
} | null;

export type ResizeState = {
  componentId: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null;
