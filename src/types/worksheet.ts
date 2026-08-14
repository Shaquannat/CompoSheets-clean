export type ComponentType = 'text' | 'question' | 'answerLines';

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

export type AnswerLinesComponent = BaseWorksheetComponent & {
  type: 'answerLines';
  lineCount: number;
  lineSpacing: number;
  lineStyle: 'standard' | 'primary';
};

export type WorksheetComponent =
  | TextComponent
  | QuestionComponent
  | AnswerLinesComponent;

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
