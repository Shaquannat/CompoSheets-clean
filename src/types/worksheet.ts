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

export type RichTextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontFamily?: string;
};

export type RichTextSegment = {
  text: string;
  style?: RichTextStyle;
};

export type TextComponent = BaseWorksheetComponent & {
  type: 'text';
  text: string;
  richText: RichTextSegment[];
  paragraphIndents?: number[];
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  italic: boolean;
  underline: boolean;
textColor: string;
};

export type QuestionComponent = BaseWorksheetComponent & {
  type: 'question';
  question: string;
  richText: RichTextSegment[];
  paragraphIndents?: number[];
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  italic: boolean;
  underline: boolean;
  textColor: string;
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
  richText: RichTextSegment[];
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
  fontFamily: string;
  bold: boolean;
  italic: boolean;
underline: boolean;
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
    startX: number;
    startY: number;
    historySaved: boolean;
    components: {
      id: string;
      startX: number;
      startY: number;
    }[];
  } | null;

  export type ResizeState = {
    componentId: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    historySaved: boolean;
    groupBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    components: {
      id: string;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    }[];
  } | null;
