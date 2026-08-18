export type ComponentType = 'text' | 'question' | 'answerLines' | 'checkbox';

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
  fontWeight: 'normal' | 'bold';
textColor: string;
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
export type CheckboxItem = {
  id: string;
  text: string;
  checked: boolean;
  markStyle: 'check' | 'x';
  markColor: string;
  showPlaceholder: boolean;
};

export type CheckboxComponent = BaseWorksheetComponent & {
  type: 'checkbox';
  items: CheckboxItem[];
  layout: 'list' | 'inline';
  fontSize: number;
  bold: boolean;
  textColor: string;
markColor: string;

};
export type WorksheetComponent =
  | TextComponent
  | QuestionComponent
  | AnswerLinesComponent
  | CheckboxComponent;

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
