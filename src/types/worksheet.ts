export type ComponentType = 'text';

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

export type WorksheetComponent = TextComponent;

export type DragState = {
  componentId: string;
  offsetX: number;
  offsetY: number;
} | null;

export type ResizeState = {
  componentId: string;
  startX: number;
  startWidth: number;
} | null;
