export type ComponentType =
  | 'text'
  | 'question'
  | 'multipleChoice'
  | 'matching'
  | 'answerLines'
  | 'checkbox';

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

  attachedToComponentId?: string;
attachmentPlacement?: 'below' | 'right';
attachmentGap?: number;
};

export type RichTextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
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

  export type MultipleChoiceTextStyle = {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    italic?: boolean;
    underline?: boolean;
    textColor?: string;
  };
  
  export type MultipleChoiceOption = {
    id: string;
    text: string;
    richText?: RichTextSegment[];
    style?: MultipleChoiceTextStyle;
  };

  export type MultipleChoiceComponent =
  BaseWorksheetComponent & {
    type: 'multipleChoice';

    options: MultipleChoiceOption[];
    labelStyle?: 'A.' | 'A)' | 'a.' | 'a)';
    layout?: 'vertical' | 'twoColumn';
    markerStyle?: 'plain' | 'circle';
    defaultStyle?: MultipleChoiceTextStyle;

    correctOptionId?: string;
  };

  export type MatchingContentType =
  | 'text'
  | 'image'
  | 'textImage'
  | 'blank';

export type MatchingItem = {
  id: string;
  contentType: MatchingContentType;
  text?: string;
  imageSrc?: string;
  imageAlt?: string;
  blankBorderStyle?: 'none' | 'dashed' | 'solid';
};

export type MatchingRelationship = {
  leftItemId: string;
  rightItemId: string;

  // Per-row display/action shown between the
  // left and right items in Relate Each Row.
  betweenStyle?:
    | 'none'
    | 'arrow'
    | 'writeLine'
    | 'writeBox'
    | 'custom';

arrowStyle?: 'outline' | 'solid';

  // Used when betweenStyle is "custom".
  customBetweenText?: string;

  // Correct response for write-line, write-box,
  // comparison, or other between-item activities.
  correctBetweenValue?: string;

  // Used for activities where the student
  // circles the correct item on the left or right.
  correctSide?: 'left' | 'right';
};

export type MatchColumnsSettings = {
  mode: 'matchColumns';

  activityStyle: 'drawLines' | 'cutPaste';

  connectorStyle:
    | 'none'
    | 'line'
    | 'arrow';

  showFirstMatch: boolean;

  targetBorderStyle:
    | 'none'
    | 'dashed'
    | 'solid';
};

export type RowRelationshipSettings = {
  mode: 'rowRelationship';

  betweenStyle:
    | 'none'
    | 'line'
    | 'arrow'
    | 'writeLine'
    | 'writeBox'
    | 'custom';

  customBetweenText?: string;

  circleSideChoice: boolean;
};

export type MatchingComponent =
  BaseWorksheetComponent & {
    type: 'matching';

    leftItems: MatchingItem[];
    rightItems: MatchingItem[];

    relationships: MatchingRelationship[];

    showHeadings: boolean;
    leftHeading: string;
    rightHeading: string;

    leftLabelStyle:
      | 'none'
      | '1.'
      | '1)'
      | 'A.'
      | 'A)'
      | 'a.'
      | 'a)';

    settings:
      | MatchColumnsSettings
      | RowRelationshipSettings;
  };

export type QuestionComponent = BaseWorksheetComponent & {
  type: 'question';
  question: string;
  richText: RichTextSegment[];
  paragraphIndents?: number[];

  numberingMode?: 'continue' | 'restart' | 'custom' | 'off';
numberingStart?: number;

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
  | MultipleChoiceComponent
  | MatchingComponent
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
