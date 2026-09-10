import { useRef } from 'react';

import type {
  WorksheetComponent,
  RichTextSegment,
  RichTextStyle,
} from '../types/worksheet';

function applyStyleToRange(
  segments: RichTextSegment[],
  start: number,
  end: number,
  styleChanges: RichTextStyle
): RichTextSegment[] {
  const result: RichTextSegment[] = [];
  let position = 0;

  for (const segment of segments) {
    const segmentStart = position;
    const segmentEnd = position + segment.text.length;

    if (segmentEnd <= start || segmentStart >= end) {
      result.push(segment);
      position = segmentEnd;
      continue;
    }

    const localStart = Math.max(0, start - segmentStart);
    const localEnd = Math.min(segment.text.length, end - segmentStart);

    if (localStart > 0) {
      result.push({
        text: segment.text.slice(0, localStart),
        style: segment.style,
      });
    }

    result.push({
      text: segment.text.slice(localStart, localEnd),
      style: {
        ...segment.style,
        ...styleChanges,
      },
    });

    if (localEnd < segment.text.length) {
      result.push({
        text: segment.text.slice(localEnd),
        style: segment.style,
      });
    }

    position = segmentEnd;
  }

  return result;
}

function isRangeFullyStyled(
  segments: RichTextSegment[],
  start: number,
  end: number,
  styleKey: 'bold' | 'italic' | 'underline'
): boolean {
  let position = 0;
  let foundSelectedText = false;

  for (const segment of segments) {
    const segmentStart = position;
    const segmentEnd = position + segment.text.length;

    const overlapsSelection =
      segmentEnd > start && segmentStart < end;

    if (overlapsSelection) {
      foundSelectedText = true;

      if (!segment.style?.[styleKey]) {
        return false;
      }
    }

    position = segmentEnd;
  }

  return foundSelectedText;
}

function getTouchedParagraphRange(
  text: string,
  start: number,
  end: number
) {
  const safeStart = Math.max(
    0,
    Math.min(start, text.length)
  );

  const safeEnd = Math.max(
    safeStart,
    Math.min(end, text.length)
  );

  function getParagraphIndex(offset: number) {
    return text
      .slice(0, offset)
      .split('\n').length - 1;
  }

  const startParagraph =
    getParagraphIndex(safeStart);

  const endPosition =
    safeEnd > safeStart
      ? safeEnd - 1
      : safeEnd;

  const endParagraph =
    getParagraphIndex(endPosition);

  return {
    startParagraph,
    endParagraph,
  };
}

function changeParagraphIndents(
  text: string,
  currentIndents: number[] | undefined,
  start: number,
  end: number,
  direction: 1 | -1
) {
  const paragraphCount =
    text.split('\n').length;

  const nextIndents = Array.from(
    { length: paragraphCount },
    (_, index) =>
      Math.max(
        0,
        Math.min(
          8,
          currentIndents?.[index] ?? 0
        )
      )
  );

  const {
    startParagraph,
    endParagraph,
  } = getTouchedParagraphRange(
    text,
    start,
    end
  );

  for (
    let index = startParagraph;
    index <= endParagraph;
    index += 1
  ) {
    nextIndents[index] = Math.max(
      0,
      Math.min(
        8,
        nextIndents[index] + direction
      )
    );
  }

  return nextIndents;
}

type RightSidebarProps = {
  selectedComponent: WorksheetComponent | null
  selectedComponentCount: number;
  textSelection: {
    id: string;
    start: number;
    end: number;
  } | null;

  questionSelection: {
    id: string;
    start: number;
    end: number;
  } | null;

  checkboxSelection: {
    componentId: string;
    itemId: string;
    start: number;
    end: number;
  } | null;

  multipleChoiceSelection: {
    componentId: string;
    optionId: string;
    start?: number;
    end?: number;
  } | null;

  matchingRowSelection: {
  componentId: string;
  leftItemId: string;
} | null;

  onUpdateComponent: (
    id: string,
    changes: Partial<WorksheetComponent>,
  ) => void
  onDuplicate: () => void
  onDelete: () => void
}

export function RightSidebar({
  selectedComponent,
  selectedComponentCount,
  textSelection,
  questionSelection,
  checkboxSelection,
  multipleChoiceSelection,
  matchingRowSelection,
  onUpdateComponent,
  onDuplicate,
  onDelete,
}: RightSidebarProps) {
  function addMatchingRelationship() {
  if (
    !selectedComponent ||
    selectedComponent.type !== 'matching'
  ) {
    return;
  }

  const leftItemId = crypto.randomUUID();
  const rightItemId = crypto.randomUUID();

  onUpdateComponent(selectedComponent.id, {
    leftItems: [
      ...selectedComponent.leftItems,
      {
        id: leftItemId,
        contentType: 'text',
        text: '',
      },
    ],

    rightItems: [
      ...selectedComponent.rightItems,
      {
        id: rightItemId,
        contentType: 'text',
        text: '',
      },
    ],

    relationships: [
      ...selectedComponent.relationships,
      {
        leftItemId,
        rightItemId,
      },
    ],
  });
}

function removeMatchingRelationship() {
  if (
    !selectedComponent ||
    selectedComponent.type !== 'matching' ||
    selectedComponent.relationships.length <= 1
  ) {
    return;
  }

  const relationshipToRemove =
    selectedComponent.relationships[
      selectedComponent.relationships.length - 1
    ];

  onUpdateComponent(selectedComponent.id, {
    relationships:
      selectedComponent.relationships.slice(0, -1),

    leftItems:
      selectedComponent.leftItems.filter(
        (item) =>
          item.id !==
          relationshipToRemove.leftItemId
      ),

    rightItems:
      selectedComponent.rightItems.filter(
        (item) =>
          item.id !==
          relationshipToRemove.rightItemId
      ),
  });
}
  const activeMultipleChoiceOption =
    selectedComponent?.type === 'multipleChoice' &&
    multipleChoiceSelection?.componentId === selectedComponent.id
      ? selectedComponent.options.find(
          (option) =>
            option.id === multipleChoiceSelection.optionId
        ) ?? null
      : null;

        const multipleChoiceHexSelectionRef = useRef<{
    componentId: string;
    optionId: string;
    start: number;
    end: number;
  } | null>(null);

  return (
    <aside className="hidden border-l border-slate-200 bg-white p-4 lg:block">
      <div className="mb-5">
        <h2 className="font-bold text-slate-900">
          Formatting
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Select a component to change its appearance.
        </p>
      </div>

      {selectedComponentCount > 1 ? (
  <div className="space-y-5">
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Selected components
      </span>

      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm font-semibold text-violet-800">
        {selectedComponentCount} components selected
      </div>
    </div>

    <button
      type="button"
      onClick={onDelete}
      className="min-h-11 w-full rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
    >
      Delete selected
    </button>

    <button
  type="button"
  onClick={onDuplicate}
  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
>
  Duplicate selected
</button>
  </div>
) : selectedComponent ? (
        <div className="space-y-5">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Selected component
            </span>

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm font-semibold text-violet-800">
            {selectedComponent.type === 'text'
  ? 'Text'
  : selectedComponent.type === 'question'
    ? 'Question'
    : selectedComponent.type === 'multipleChoice'
  ? 'Multiple Choice'
  : selectedComponent.type === 'matching'
    ? 'Matching'
    : selectedComponent.type === 'answerLines'
      ? 'Answer Lines'
        : selectedComponent.type === 'checkbox'
          ? 'Checkbox'
          : selectedComponent.type}
            </div>
          </div>

          {selectedComponent.type === 'matching' && (
  <div className="space-y-4">
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Activity Format
      </span>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              settings: {
                mode: 'matchColumns',
                activityStyle: 'drawLines',
                connectorStyle: 'none',
                showFirstMatch: false,
                targetBorderStyle: 'dashed',
              },
            })
          }
          className={`rounded-lg border px-3 py-3 text-sm ${
            selectedComponent.settings.mode === 'matchColumns'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="text-left">
            <div className="font-semibold">
              Match Across Columns
            </div>

            <div className="mt-1 text-xs font-normal leading-4 text-slate-500">
              Connect each item to a choice in the other column.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              settings: {
                mode: 'rowRelationship',
                betweenStyle: 'none',
                customBetweenText: '',
                circleSideChoice: false,
              },
            })
          }
          className={`rounded-lg border px-3 py-3 text-sm ${
            selectedComponent.settings.mode === 'rowRelationship'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="text-left">
            <div className="font-semibold">
              Relate Each Row
            </div>

            <div className="mt-1 text-xs font-normal leading-4 text-slate-500">
              Compare, choose, or complete the relationship within each row.
            </div>
          </div>
        </button>
      </div>
    </div>

  {selectedComponent.settings.mode === 'rowRelationship' && (
  <div>
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Between Items
    </span>

    {matchingRowSelection?.componentId === selectedComponent.id ? (
      <>
        <select
          value={
            selectedComponent.relationships.find(
              (relationship) =>
                relationship.leftItemId ===
                matchingRowSelection.leftItemId
            )?.betweenStyle ?? 'none'
          }
          onChange={(event) => {
            const nextStyle = event.target.value as
              | 'none'
              | 'arrow'
              | 'writeLine'
              | 'writeBox'
              | 'custom';

            onUpdateComponent(selectedComponent.id, {
              relationships:
                selectedComponent.relationships.map(
                  (relationship) =>
                    relationship.leftItemId ===
                    matchingRowSelection.leftItemId
                      ? {
                          ...relationship,
                          betweenStyle: nextStyle,
                        }
                      : relationship
                ),
            });
          }}
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="none">
            None
          </option>

          <option value="arrow">
            Arrow
          </option>

          <option value="writeLine">
            Student writes on a line
          </option>

          <option value="writeBox">
            Student writes in a box
          </option>

          <option value="custom">
            Custom symbol or text
          </option>
        </select>

        {selectedComponent.relationships.find(
          (relationship) =>
            relationship.leftItemId ===
            matchingRowSelection.leftItemId
        )?.betweenStyle === 'custom' && (
          <input
            type="text"
            value={
              selectedComponent.relationships.find(
                (relationship) =>
                  relationship.leftItemId ===
                  matchingRowSelection.leftItemId
              )?.customBetweenText ?? ''
            }
            onChange={(event) =>
              onUpdateComponent(selectedComponent.id, {
                relationships:
                  selectedComponent.relationships.map(
                    (relationship) =>
                      relationship.leftItemId ===
                      matchingRowSelection.leftItemId
                        ? {
                            ...relationship,
                            customBetweenText:
                              event.target.value,
                          }
                        : relationship
                  ),
              })
            }
            placeholder="Example: =, >, <, causes"
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        )}
      </>
    ) : (
      <div className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">
        Select a row to change its between-item setting.
      </div>
    )}
  </div>
)}
    
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {selectedComponent.settings.mode === 'matchColumns'
          ? 'Pairs'
          : 'Rows'}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={removeMatchingRelationship}
          disabled={selectedComponent.relationships.length <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>

        <div className="flex h-10 min-w-14 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
          {selectedComponent.relationships.length}
        </div>

        <button
          type="button"
          onClick={addMatchingRelationship}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 hover:bg-slate-50"
        >
          +
        </button>
      </div>
    </div>
  </div>
)}

          {selectedComponent.type === 'text' && (
  <div className="space-y-4">
    <div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Font family
  </span>

  <select
    value={selectedComponent.fontFamily}
    onChange={(event) => {
      const newFontFamily = event.target.value;
    
      const hasSelection =
        textSelection?.id === selectedComponent.id &&
        textSelection.start !== textSelection.end;
    
      if (hasSelection) {
        const baseSegments =
          selectedComponent.richText.length > 0
            ? selectedComponent.richText
            : selectedComponent.text
              ? [{ text: selectedComponent.text }]
              : [];
    
        const updatedRichText = applyStyleToRange(
          baseSegments,
          textSelection.start,
          textSelection.end,
          {
            fontFamily: newFontFamily,
          }
        );
    
        onUpdateComponent(selectedComponent.id, {
          richText: updatedRichText,
        });
    
        return;
      }
    
      onUpdateComponent(selectedComponent.id, {
        fontFamily: newFontFamily,
      });
    }}
    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
  >
    <option value="Arial">Arial</option>
    <option value="Verdana">Verdana</option>
    <option value="Georgia">Georgia</option>
    <option value="Times New Roman">Times New Roman</option>
    <option value="Trebuchet MS">Trebuchet MS</option>
    <option value="Courier New">Courier New</option>
  </select>
</div>
<div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Font size
      </span>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="8"
          max="72"
          value={selectedComponent.fontSize}
          onChange={(event) =>
            onUpdateComponent(selectedComponent.id, {
              fontSize: Number(event.target.value),
            })
          }
          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
        />

        <button
          type="button"
          onClick={() => {
            const hasSelection =
              textSelection?.id === selectedComponent.id &&
              textSelection.start !== textSelection.end;
          
            if (hasSelection) {
              const baseSegments =
                selectedComponent.richText.length > 0
                  ? selectedComponent.richText
                  : selectedComponent.text
                    ? [{ text: selectedComponent.text }]
                    : [];
          
                    const selectedIsBold = isRangeFullyStyled(
                      baseSegments,
                      textSelection.start,
                      textSelection.end,
                      'bold'
                    );
                    
                    const updatedRichText = applyStyleToRange(
                      baseSegments,
                      textSelection.start,
                      textSelection.end,
                      {
                        bold: !selectedIsBold,
                      }
                    );
          
              onUpdateComponent(selectedComponent.id, {
                richText: updatedRichText,
              });
          
              return;
            }
          
            onUpdateComponent(selectedComponent.id, {
              fontWeight:
                selectedComponent.fontWeight === 'bold'
                  ? 'normal'
                  : 'bold',
            });
          }}
          className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
            (
              textSelection?.id === selectedComponent.id &&
              textSelection.start !== textSelection.end
                ? isRangeFullyStyled(
                    selectedComponent.richText.length > 0
                      ? selectedComponent.richText
                      : selectedComponent.text
                        ? [{ text: selectedComponent.text }]
                        : [],
                    textSelection.start,
                    textSelection.end,
                    'bold'
                  )
                : selectedComponent.fontWeight === 'bold'
            )
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          Bold
        </button>
        <button
  type="button"
  onClick={() => {
    const hasSelection =
      textSelection?.id === selectedComponent.id &&
      textSelection.start !== textSelection.end;
  
    if (hasSelection) {
      const baseSegments =
        selectedComponent.richText.length > 0
          ? selectedComponent.richText
          : selectedComponent.text
            ? [{ text: selectedComponent.text }]
            : [];
  
            const selectedIsItalic = isRangeFullyStyled(
              baseSegments,
              textSelection.start,
              textSelection.end,
              'italic'
            );
            
            const updatedRichText = applyStyleToRange(
              baseSegments,
              textSelection.start,
              textSelection.end,
              {
                italic: !selectedIsItalic,
              }
            );
  
      onUpdateComponent(selectedComponent.id, {
        richText: updatedRichText,
      });
  
      return;
    }
  
    onUpdateComponent(selectedComponent.id, {
      italic: !selectedComponent.italic,
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (
      textSelection?.id === selectedComponent.id &&
      textSelection.start !== textSelection.end
        ? isRangeFullyStyled(
            selectedComponent.richText.length > 0
              ? selectedComponent.richText
              : selectedComponent.text
                ? [{ text: selectedComponent.text }]
                : [],
            textSelection.start,
            textSelection.end,
            'italic'
          )
        : selectedComponent.italic
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  }`}
>
  Italic
</button>
<button
  type="button"
  onClick={() => {
    const hasSelection =
      textSelection?.id === selectedComponent.id &&
      textSelection.start !== textSelection.end;
  
    if (hasSelection) {
      const baseSegments =
        selectedComponent.richText.length > 0
          ? selectedComponent.richText
          : selectedComponent.text
            ? [{ text: selectedComponent.text }]
            : [];
  
      const selectedIsUnderlined = isRangeFullyStyled(
        baseSegments,
        textSelection.start,
        textSelection.end,
        'underline'
      );
  
      const updatedRichText = applyStyleToRange(
        baseSegments,
        textSelection.start,
        textSelection.end,
        {
          underline: !selectedIsUnderlined,
        }
      );
  
      onUpdateComponent(selectedComponent.id, {
        richText: updatedRichText,
      });
  
      return;
    }
  
    onUpdateComponent(selectedComponent.id, {
      underline: !selectedComponent.underline,
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (
      textSelection?.id === selectedComponent.id &&
      textSelection.start !== textSelection.end
        ? isRangeFullyStyled(
            selectedComponent.richText.length > 0
              ? selectedComponent.richText
              : selectedComponent.text
                ? [{ text: selectedComponent.text }]
                : [],
            textSelection.start,
            textSelection.end,
            'underline'
          )
        : selectedComponent.underline
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  }`}
>
  Underline
</button>
      </div>
    </div>

    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Paragraph indent
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          title="Decrease indent"
          aria-label="Decrease indent"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          disabled={
            textSelection?.id !==
            selectedComponent.id
          }
          onClick={() => {
            if (
              textSelection?.id !==
              selectedComponent.id
            ) {
              return;
            }

            const questionEditor =
  document.querySelector<HTMLElement>(
    `[data-question-component-id="${selectedComponent.id}"]`
  );

const questionText =
  questionEditor?.innerText
    .replace(/\r\n/g, '\n')
    .replace(/\n$/, '') ??
  selectedComponent.question;

const nextIndents =
  changeParagraphIndents(
    questionText,
    selectedComponent.paragraphIndents,
    questionSelection.start,
    questionSelection.end,
    -1
  );

  const questionChanged =
  questionText !==
  selectedComponent.question;

onUpdateComponent(
  selectedComponent.id,
  {
    question: questionText,
    richText: questionChanged
      ? questionText
        ? [{ text: questionText }]
        : []
      : selectedComponent.richText,
    paragraphIndents: nextIndents,
  }
);
          }}
          className={`flex min-h-11 items-center justify-center rounded-lg border ${
            textSelection?.id ===
            selectedComponent.id
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 6h10" />
            <path d="M10 10h10" />
            <path d="M4 14h16" />
            <path d="M4 18h16" />
            <path d="m7 7-3 3 3 3" />
          </svg>
        </button>

        <button
  type="button"
  title="Increase indent"
  aria-label="Increase indent"
  onMouseDown={(event) => {
    event.preventDefault();
  }}
  disabled={
    textSelection?.id !==
    selectedComponent.id
  }
          onClick={() => {
            if (
              textSelection?.id !==
              selectedComponent.id
            ) {
              return;
            }

            const questionEditor =
  document.querySelector<HTMLElement>(
    `[data-question-component-id="${selectedComponent.id}"]`
  );

const questionText =
  questionEditor?.innerText
    .replace(/\r\n/g, '\n')
    .replace(/\n$/, '') ??
  selectedComponent.question;

const nextIndents =
  changeParagraphIndents(
    questionText,
    selectedComponent.paragraphIndents,
    questionSelection.start,
    questionSelection.end,
    1
  );

  const questionChanged =
  questionText !==
  selectedComponent.question;

onUpdateComponent(
  selectedComponent.id,
  {
    question: questionText,
    richText: questionChanged
      ? questionText
        ? [{ text: questionText }]
        : []
      : selectedComponent.richText,
    paragraphIndents: nextIndents,
  }
);
          }}
          className={`flex min-h-11 items-center justify-center rounded-lg border ${
            textSelection?.id ===
            selectedComponent.id
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 6h10" />
            <path d="M10 10h10" />
            <path d="M4 14h16" />
            <path d="M4 18h16" />
            <path d="m4 7 3 3-3 3" />
          </svg>
        </button>
      </div>
    </div>

    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Text color
      </span>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={selectedComponent.textColor}
          onChange={(event) => {
            const newColor = event.target.value;
          
            const hasSelection =
              textSelection?.id === selectedComponent.id &&
              textSelection.start !== textSelection.end;
          
            if (hasSelection) {
              const baseSegments =
                selectedComponent.richText.length > 0
                  ? selectedComponent.richText
                  : selectedComponent.text
                    ? [{ text: selectedComponent.text }]
                    : [];
          
              const updatedRichText = applyStyleToRange(
                baseSegments,
                textSelection.start,
                textSelection.end,
                {
                  color: newColor,
                }
              );
          
              onUpdateComponent(selectedComponent.id, {
                richText: updatedRichText,
              });
          
              return;
            }
          
            onUpdateComponent(selectedComponent.id, {
              textColor: newColor,
            });
          }}
          className="h-10 flex-1 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
          aria-label="Choose text color"
        />

<input
  key={selectedComponent.textColor}
  type="text"
  defaultValue={selectedComponent.textColor.toUpperCase()}
  maxLength={7}
  style={{
    width: '92px',
    height: '38px',
    boxSizing: 'border-box',
  }}
  className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
  aria-label="Text color hex value"
  onKeyDown={(event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }}
  onBlur={(event) => {
    const value = event.currentTarget.value.trim();
  
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hasSelection =
        textSelection?.id === selectedComponent.id &&
        textSelection.start !== textSelection.end;
  
      if (hasSelection) {
        const baseSegments =
          selectedComponent.richText.length > 0
            ? selectedComponent.richText
            : selectedComponent.text
              ? [{ text: selectedComponent.text }]
              : [];
  
        const updatedRichText = applyStyleToRange(
          baseSegments,
          textSelection.start,
          textSelection.end,
          {
            color: value,
          }
        );
  
        onUpdateComponent(selectedComponent.id, {
          richText: updatedRichText,
        });
  
        return;
      }
  
      onUpdateComponent(selectedComponent.id, {
        textColor: value,
      });
    } else {
      event.currentTarget.value =
        selectedComponent.textColor.toUpperCase();
    }
  }}
/>
      </div>
    </div>
  </div>
)}

{selectedComponent.type === 'question' && (
  <div className="space-y-4">

<div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Numbering
  </span>

  <select
    value={selectedComponent.numberingMode ?? 'continue'}
    onChange={(event) => {
      const numberingMode = event.target.value as
        | 'continue'
        | 'restart'
        | 'custom'
        | 'off';

      onUpdateComponent(selectedComponent.id, {
        numberingMode,
        ...(numberingMode === 'custom'
          ? {
              numberingStart:
                selectedComponent.numberingStart ?? 1,
            }
          : {}),
      });
    }}
    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
  >
    <option value="continue">Continue numbering</option>
    <option value="restart">Restart at 1</option>
    <option value="custom">Start at...</option>
    <option value="off">Numbering off</option>
  </select>

  {(selectedComponent.numberingMode ?? 'continue') === 'custom' && (
  <div className="mt-2">
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Start number
      </span>

      <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={selectedComponent.numberingStart ?? ''}
  onChange={(event) => {
    const rawValue = event.target.value.replace(/\D/g, '');

    if (rawValue === '') {
      onUpdateComponent(selectedComponent.id, {
        numberingStart: undefined,
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      numberingStart: Math.max(
        1,
        Number(rawValue)
      ),
    });
  }}
  onBlur={() => {
    if (selectedComponent.numberingStart === undefined) {
      onUpdateComponent(selectedComponent.id, {
        numberingStart: 1,
      });
    }
  }}
  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
/>
    </label>
  </div>
)}
</div>

<div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Font family
  </span>

  <select
    value={selectedComponent.fontFamily}
    onChange={(event) => {
      const newFontFamily = event.target.value;

      const hasSelection =
        questionSelection?.id === selectedComponent.id &&
        questionSelection.start !== questionSelection.end;

      if (hasSelection) {
        const baseSegments =
          selectedComponent.richText.length > 0
            ? selectedComponent.richText
            : selectedComponent.question
              ? [{ text: selectedComponent.question }]
              : [];

        const updatedRichText = applyStyleToRange(
          baseSegments,
          questionSelection.start,
          questionSelection.end,
          {
            fontFamily: newFontFamily,
          }
        );

        onUpdateComponent(selectedComponent.id, {
          richText: updatedRichText,
        });

        return;
      }

      onUpdateComponent(selectedComponent.id, {
        fontFamily: newFontFamily,
      });
    }}
    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
  >
    <option value="Arial">Arial</option>
    <option value="Verdana">Verdana</option>
    <option value="Georgia">Georgia</option>
    <option value="Times New Roman">Times New Roman</option>
    <option value="Trebuchet MS">Trebuchet MS</option>
    <option value="Courier New">Courier New</option>
  </select>
</div>
<div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Font size
      </span>

      <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        min="8"
        max="72"
        value={selectedComponent.fontSize}
        onChange={(event) =>
          onUpdateComponent(selectedComponent.id, {
            fontSize: Number(event.target.value),
          })
        }
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />

<button
  type="button"
  onClick={() => {
    const hasSelection =
      questionSelection?.id === selectedComponent.id &&
      questionSelection.start !== questionSelection.end;

    if (hasSelection) {
      const baseSegments =
        selectedComponent.richText.length > 0
          ? selectedComponent.richText
          : selectedComponent.question
            ? [{ text: selectedComponent.question }]
            : [];

      const selectedIsBold = isRangeFullyStyled(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        'bold'
      );

      const updatedRichText = applyStyleToRange(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        {
          bold: !selectedIsBold,
        }
      );

      onUpdateComponent(selectedComponent.id, {
        richText: updatedRichText,
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      fontWeight:
        selectedComponent.fontWeight === 'bold'
          ? 'normal'
          : 'bold',
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    selectedComponent.fontWeight === 'bold'
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  }`}
>
  Bold
</button>

<button
  type="button"
  onClick={() => {
    const hasSelection =
      questionSelection?.id === selectedComponent.id &&
      questionSelection.start !== questionSelection.end;

    if (hasSelection) {
      const baseSegments =
        selectedComponent.richText.length > 0
          ? selectedComponent.richText
          : selectedComponent.question
            ? [{ text: selectedComponent.question }]
            : [];

      const selectedIsItalic = isRangeFullyStyled(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        'italic'
      );

      const updatedRichText = applyStyleToRange(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        {
          italic: !selectedIsItalic,
        }
      );

      onUpdateComponent(selectedComponent.id, {
        richText: updatedRichText,
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      italic: !selectedComponent.italic,
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (
      questionSelection?.id === selectedComponent.id &&
      questionSelection.start !== questionSelection.end
        ? isRangeFullyStyled(
            selectedComponent.richText.length > 0
              ? selectedComponent.richText
              : selectedComponent.question
                ? [{ text: selectedComponent.question }]
                : [],
            questionSelection.start,
            questionSelection.end,
            'italic'
          )
        : selectedComponent.italic
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  }`}
>
  Italic
</button>

<button
  type="button"
  onClick={() => {
    const hasSelection =
      questionSelection?.id === selectedComponent.id &&
      questionSelection.start !== questionSelection.end;

    if (hasSelection) {
      const baseSegments =
        selectedComponent.richText.length > 0
          ? selectedComponent.richText
          : selectedComponent.question
            ? [{ text: selectedComponent.question }]
            : [];

      const selectedIsUnderlined = isRangeFullyStyled(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        'underline'
      );

      const updatedRichText = applyStyleToRange(
        baseSegments,
        questionSelection.start,
        questionSelection.end,
        {
          underline: !selectedIsUnderlined,
        }
      );

      onUpdateComponent(selectedComponent.id, {
        richText: updatedRichText,
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      underline: !selectedComponent.underline,
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (
      questionSelection?.id === selectedComponent.id &&
      questionSelection.start !== questionSelection.end
        ? isRangeFullyStyled(
            selectedComponent.richText.length > 0
              ? selectedComponent.richText
              : selectedComponent.question
                ? [{ text: selectedComponent.question }]
                : [],
            questionSelection.start,
            questionSelection.end,
            'underline'
          )
        : selectedComponent.underline
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  }`}
>
Underline
</button>
      </div>
    </div>

    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Paragraph indent
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          title="Decrease indent"
          aria-label="Decrease indent"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          disabled={
            questionSelection?.id !==
            selectedComponent.id
          }
          onClick={() => {
            if (
              questionSelection?.id !==
              selectedComponent.id
            ) {
              return;
            }
          
            const questionEditor =
              document.querySelector<HTMLElement>(
                `[data-question-component-id="${selectedComponent.id}"]`
              );
          
            const questionText =
              questionEditor?.innerText
                .replace(/\r\n/g, '\n')
                .replace(/\n$/, '') ??
              selectedComponent.question;
          
            const nextIndents =
              changeParagraphIndents(
                questionText,
                selectedComponent.paragraphIndents,
                questionSelection.start,
                questionSelection.end,
                -1
              );
          
            const questionChanged =
              questionText !== selectedComponent.question;
          
            onUpdateComponent(
              selectedComponent.id,
              {
                question: questionText,
                richText: questionChanged
                  ? questionText
                    ? [{ text: questionText }]
                    : []
                  : selectedComponent.richText,
                paragraphIndents: nextIndents,
              }
            );
          }}
          className={`flex min-h-11 items-center justify-center rounded-lg border ${
            questionSelection?.id ===
            selectedComponent.id
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 6h10" />
            <path d="M10 10h10" />
            <path d="M4 14h16" />
            <path d="M4 18h16" />
            <path d="m7 7-3 3 3 3" />
          </svg>
        </button>

        <button
          type="button"
          title="Increase indent"
          aria-label="Increase indent"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          disabled={
            questionSelection?.id !==
            selectedComponent.id
          }
          onClick={() => {
            if (
              questionSelection?.id !==
              selectedComponent.id
            ) {
              return;
            }
          
            const questionEditor =
              document.querySelector<HTMLElement>(
                `[data-question-component-id="${selectedComponent.id}"]`
              );
          
            const questionText =
              questionEditor?.innerText
                .replace(/\r\n/g, '\n')
                .replace(/\n$/, '') ??
              selectedComponent.question;
          
            const nextIndents =
              changeParagraphIndents(
                questionText,
                selectedComponent.paragraphIndents,
                questionSelection.start,
                questionSelection.end,
                1
              );
          
            const questionChanged =
              questionText !== selectedComponent.question;
          
            onUpdateComponent(
              selectedComponent.id,
              {
                question: questionText,
                richText: questionChanged
                  ? questionText
                    ? [{ text: questionText }]
                    : []
                  : selectedComponent.richText,
                paragraphIndents: nextIndents,
              }
            );
          }}
          className={`flex min-h-11 items-center justify-center rounded-lg border ${
            questionSelection?.id ===
            selectedComponent.id
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              : 'cursor-not-allowed border-slate-200 bg-white text-slate-300'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 6h10" />
            <path d="M10 10h10" />
            <path d="M4 14h16" />
            <path d="M4 18h16" />
            <path d="m4 7 3 3-3 3" />
          </svg>
        </button>
      </div>
    </div>

    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Text color
  </span>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 92px',
      gap: '8px',
      alignItems: 'center',
    }}
  >
    <input
      type="color"
      value={selectedComponent.textColor}
      onChange={(event) => {
        const newColor = event.target.value;

        const hasSelection =
          questionSelection?.id === selectedComponent.id &&
          questionSelection.start !== questionSelection.end;

        if (hasSelection) {
          const baseSegments =
            selectedComponent.richText.length > 0
              ? selectedComponent.richText
              : selectedComponent.question
                ? [{ text: selectedComponent.question }]
                : [];

          const updatedRichText = applyStyleToRange(
            baseSegments,
            questionSelection.start,
            questionSelection.end,
            {
              color: newColor,
            }
          );

          onUpdateComponent(selectedComponent.id, {
            richText: updatedRichText,
          });

          return;
        }

        onUpdateComponent(selectedComponent.id, {
          textColor: newColor,
        });
      }}
      style={{
        width: '100%',
        height: '38px',
        boxSizing: 'border-box',
      }}
      className="cursor-pointer rounded-md border border-slate-300 bg-white p-1"
      aria-label="Choose question text color"
    />

    <input
      key={selectedComponent.textColor}
      type="text"
      defaultValue={selectedComponent.textColor.toUpperCase()}
      maxLength={7}
      style={{
        width: '92px',
        height: '38px',
        boxSizing: 'border-box',
      }}
      className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
      aria-label="Question text color hex value"
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => {
        const value = event.currentTarget.value.trim();

        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
          const hasSelection =
            questionSelection?.id === selectedComponent.id &&
            questionSelection.start !== questionSelection.end;

          if (hasSelection) {
            const baseSegments =
              selectedComponent.richText.length > 0
                ? selectedComponent.richText
                : selectedComponent.question
                  ? [{ text: selectedComponent.question }]
                  : [];

            const updatedRichText = applyStyleToRange(
              baseSegments,
              questionSelection.start,
              questionSelection.end,
              {
                color: value,
              }
            );

            onUpdateComponent(selectedComponent.id, {
              richText: updatedRichText,
            });

            return;
          }

          onUpdateComponent(selectedComponent.id, {
            textColor: value,
          });
        } else {
          event.currentTarget.value =
            selectedComponent.textColor.toUpperCase();
        }
      }}
    />
  </div>
</div>

  </div>
)}

{selectedComponent.type === 'answerLines' && (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Line style
    </span>

    <select
      value={selectedComponent.lineStyle}
      onChange={(event) =>
        onUpdateComponent(selectedComponent.id, {
          lineStyle: event.target.value as
  | 'standard'
  | 'primary',
        })
      }
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
    >
      <option value="standard">Standard</option>
      <option value="primary">Primary handwriting</option>
    </select>
  </label>
)}
{selectedComponent.type === 'checkbox' && (
  <div className="space-y-5">
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Layout
      </label>

      <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>
        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              layout: 'list',
            })
          }
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            selectedComponent.layout === 'list'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          List
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateComponent(selectedComponent.id, {
              layout: 'inline',
            })
          }
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            selectedComponent.layout === 'inline'
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Inline
        </button>
      </div>
    </div>
    <div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Mark Style
  </label>

  <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>
    <button
      type="button"
      onClick={() =>
        onUpdateComponent(selectedComponent.id, {
          markStyle: 'check',
        })
      }
      className={`rounded-md border px-3 py-2 text-sm font-medium ${
        selectedComponent.markStyle === 'check'
          ? 'border-violet-500 bg-violet-50 text-violet-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      ✓
    </button>

    <button
      type="button"
      onClick={() =>
        onUpdateComponent(selectedComponent.id, {
          markStyle: 'x',
        })
      }
      className={`rounded-md border px-3 py-2 text-sm font-medium ${
        selectedComponent.markStyle === 'x'
          ? 'border-violet-500 bg-violet-50 text-violet-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      ×
    </button>
  </div>
</div>
<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Font Family
  </label>

  <select
    value={selectedComponent.fontFamily}
    onChange={(event) => {
      const newFontFamily = event.target.value;

      const hasSelection =
        checkboxSelection?.componentId === selectedComponent.id &&
        checkboxSelection.start !== checkboxSelection.end;

      if (hasSelection) {
        const selectedItem =
          selectedComponent.items.find(
            (item) => item.id === checkboxSelection.itemId
          );

        if (!selectedItem) return;

        const baseSegments =
          selectedItem.richText.length > 0
            ? selectedItem.richText
            : selectedItem.text
              ? [{ text: selectedItem.text }]
              : [];

        const updatedRichText = applyStyleToRange(
          baseSegments,
          checkboxSelection.start,
          checkboxSelection.end,
          {
            fontFamily: newFontFamily,
          }
        );

        onUpdateComponent(selectedComponent.id, {
          items: selectedComponent.items.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  richText: updatedRichText,
                }
              : item
          ),
        });

        return;
      }

      onUpdateComponent(selectedComponent.id, {
        fontFamily: newFontFamily,
      });
    }}
    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
  >
    <option value="Arial">Arial</option>
    <option value="Verdana">Verdana</option>
    <option value="Georgia">Georgia</option>
    <option value="Times New Roman">Times New Roman</option>
    <option value="Trebuchet MS">Trebuchet MS</option>
    <option value="Courier New">Courier New</option>
  </select>
</div>
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    alignItems: 'end',
  }}
>
  <div>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      Font Size
    </label>

    <input
      type="number"
      min="8"
      max="72"
      value={selectedComponent.fontSize}
      onChange={(event) =>
        onUpdateComponent(selectedComponent.id, {
          fontSize: Number(event.target.value),
        })
      }
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none"
    />
  </div>

  <button
  type="button"
  onClick={() => {
    const hasSelection =
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end;
  
    if (hasSelection) {
      const selectedItem =
        selectedComponent.items.find(
          (item) =>
            item.id === checkboxSelection.itemId
        );
  
      if (!selectedItem) return;
  
      const baseSegments =
        selectedItem.richText.length > 0
          ? selectedItem.richText
          : selectedItem.text
            ? [{ text: selectedItem.text }]
            : [];
  
      const selectedIsBold = isRangeFullyStyled(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        'bold'
      );
  
      const updatedRichText = applyStyleToRange(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        {
          bold: !selectedIsBold,
        }
      );
  
      onUpdateComponent(selectedComponent.id, {
        items: selectedComponent.items.map(
          (item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  richText: updatedRichText,
                }
              : item
        ),
      });
  
      return;
    }
  
    onUpdateComponent(selectedComponent.id, {
      bold: !selectedComponent.bold,
    });
  }}
  className={`w-full rounded-md border px-3 py-2 text-sm font-semibold ${
    (
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end
        ? (() => {
            const selectedItem =
              selectedComponent.items.find(
                (item) =>
                  item.id === checkboxSelection.itemId
              );
  
            if (!selectedItem) return false;
  
            const baseSegments =
              selectedItem.richText.length > 0
                ? selectedItem.richText
                : selectedItem.text
                  ? [{ text: selectedItem.text }]
                  : [];
  
            return isRangeFullyStyled(
              baseSegments,
              checkboxSelection.start,
              checkboxSelection.end,
              'bold'
            );
          })()
        : selectedComponent.bold
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  }`}
>
  Bold
</button>
<button
  type="button"
  onClick={() => {
    const hasSelection =
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end;

    if (hasSelection) {
      const selectedItem =
        selectedComponent.items.find(
          (item) =>
            item.id === checkboxSelection.itemId
        );

      if (!selectedItem) return;

      const baseSegments =
        selectedItem.richText.length > 0
          ? selectedItem.richText
          : selectedItem.text
            ? [{ text: selectedItem.text }]
            : [];

      const selectedIsItalic = isRangeFullyStyled(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        'italic'
      );

      const updatedRichText = applyStyleToRange(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        {
          italic: !selectedIsItalic,
        }
      );

      onUpdateComponent(selectedComponent.id, {
        items: selectedComponent.items.map(
          (item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  richText: updatedRichText,
                }
              : item
        ),
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      italic: !selectedComponent.italic,
    });
  }}
  className={`w-full rounded-md border px-3 py-2 text-sm font-semibold ${
    (
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end
        ? (() => {
            const selectedItem =
              selectedComponent.items.find(
                (item) =>
                  item.id === checkboxSelection.itemId
              );

            if (!selectedItem) return false;

            const baseSegments =
              selectedItem.richText.length > 0
                ? selectedItem.richText
                : selectedItem.text
                  ? [{ text: selectedItem.text }]
                  : [];

            return isRangeFullyStyled(
              baseSegments,
              checkboxSelection.start,
              checkboxSelection.end,
              'italic'
            );
          })()
        : selectedComponent.italic
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  }`}
>
  Italic
</button>
<button
  type="button"
  onClick={() => {
    const hasSelection =
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end;

    if (hasSelection) {
      const selectedItem =
        selectedComponent.items.find(
          (item) =>
            item.id === checkboxSelection.itemId
        );

      if (!selectedItem) return;

      const baseSegments =
        selectedItem.richText.length > 0
          ? selectedItem.richText
          : selectedItem.text
            ? [{ text: selectedItem.text }]
            : [];

      const selectedIsUnderlined = isRangeFullyStyled(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        'underline'
      );

      const updatedRichText = applyStyleToRange(
        baseSegments,
        checkboxSelection.start,
        checkboxSelection.end,
        {
          underline: !selectedIsUnderlined,
        }
      );

      onUpdateComponent(selectedComponent.id, {
        items: selectedComponent.items.map(
          (item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  richText: updatedRichText,
                }
              : item
        ),
      });

      return;
    }

    onUpdateComponent(selectedComponent.id, {
      underline: !selectedComponent.underline,
    });
  }}
  className={`w-full rounded-md border px-3 py-2 text-sm font-semibold ${
    (
      checkboxSelection?.componentId === selectedComponent.id &&
      checkboxSelection.start !== checkboxSelection.end
        ? (() => {
            const selectedItem =
              selectedComponent.items.find(
                (item) =>
                  item.id === checkboxSelection.itemId
              );

            if (!selectedItem) return false;

            const baseSegments =
              selectedItem.richText.length > 0
                ? selectedItem.richText
                : selectedItem.text
                  ? [{ text: selectedItem.text }]
                  : [];

            return isRangeFullyStyled(
              baseSegments,
              checkboxSelection.start,
              checkboxSelection.end,
              'underline'
            );
          })()
        : selectedComponent.underline
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  }`}
>
  Underline
</button>
</div>

<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Text Color
  </label>

  <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 92px',
    gap: '8px',
    alignItems: 'center',
  }}
>
  <input
    type="color"
    value={selectedComponent.textColor}
    onChange={(event) => {
      const newColor = event.target.value;
    
      const hasSelection =
        checkboxSelection?.componentId === selectedComponent.id &&
        checkboxSelection.start !== checkboxSelection.end;
    
      if (hasSelection) {
        const selectedItem =
          selectedComponent.items.find(
            (item) =>
              item.id === checkboxSelection.itemId
          );
    
        if (!selectedItem) return;
    
        const baseSegments =
          selectedItem.richText.length > 0
            ? selectedItem.richText
            : selectedItem.text
              ? [{ text: selectedItem.text }]
              : [];
    
        const updatedRichText = applyStyleToRange(
          baseSegments,
          checkboxSelection.start,
          checkboxSelection.end,
          {
            color: newColor,
          }
        );
    
        onUpdateComponent(selectedComponent.id, {
          items: selectedComponent.items.map(
            (item) =>
              item.id === selectedItem.id
                ? {
                    ...item,
                    richText: updatedRichText,
                  }
                : item
          ),
        });
    
        return;
      }
    
      onUpdateComponent(selectedComponent.id, {
        textColor: newColor,
      });
    }}
    style={{
      width: '100%',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="cursor-pointer rounded-md border border-slate-300 bg-white p-1"
    aria-label="Choose text color"
  />

<input
  key={selectedComponent.textColor}
  type="text"
  defaultValue={selectedComponent.textColor.toUpperCase()}
  maxLength={7}
  style={{
    width: '92px',
    height: '38px',
    boxSizing: 'border-box',
  }}
  className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
  aria-label="Text color hex value"
  onKeyDown={(event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }}
  onBlur={(event) => {
    const value = event.currentTarget.value.trim();

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hasSelection =
        checkboxSelection?.componentId === selectedComponent.id &&
        checkboxSelection.start !== checkboxSelection.end;

      if (hasSelection) {
        const selectedItem =
          selectedComponent.items.find(
            (item) =>
              item.id === checkboxSelection.itemId
          );

        if (!selectedItem) return;

        const baseSegments =
          selectedItem.richText.length > 0
            ? selectedItem.richText
            : selectedItem.text
              ? [{ text: selectedItem.text }]
              : [];

        const updatedRichText = applyStyleToRange(
          baseSegments,
          checkboxSelection.start,
          checkboxSelection.end,
          {
            color: value,
          }
        );

        onUpdateComponent(selectedComponent.id, {
          items: selectedComponent.items.map(
            (item) =>
              item.id === selectedItem.id
                ? {
                    ...item,
                    richText: updatedRichText,
                  }
                : item
          ),
        });

        return;
      }

      onUpdateComponent(selectedComponent.id, {
        textColor: value,
      });
    } else {
      event.currentTarget.value =
        selectedComponent.textColor.toUpperCase();
    }
  }}
/>
    
</div>

<div>
  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    Mark Color
  </label>
  
  <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 92px',
    gap: '8px',
    alignItems: 'center',
  }}
>
  <input
    type="color"
    value={selectedComponent.markColor}
    onChange={(event) =>
      onUpdateComponent(selectedComponent.id, {
        markColor: event.target.value,
      })
    }
    style={{
      width: '100%',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="cursor-pointer rounded-md border border-slate-300 bg-white p-1"
    aria-label="Choose mark color"
  />

  <input
    type="text"
    value={selectedComponent.markColor.toUpperCase()}
    onChange={(event) => {
      const value = event.target.value;

      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          markColor: value,
        });
      }
    }}
    onBlur={(event) => {
      const value = event.target.value;

      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        onUpdateComponent(selectedComponent.id, {
          markColor: '#0F172A',
        });
      }
    }}
    maxLength={7}
    style={{
      width: '92px',
      height: '38px',
      boxSizing: 'border-box',
    }}
    className="rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500"
    aria-label="Mark color hex value"
  />
</div>
  </div>
</div>

  </div>
)}

{selectedComponent?.type === 'response' && (
  <div className="mb-4">
    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Response type
    </label>

    <select
      value={selectedComponent.responseType ?? ''}
      onChange={(event) => {
        const responseType =
          event.target.value === ''
            ? undefined
            : (event.target.value as
                | 'multipleChoice'
                | 'answerLines');
      
        if (responseType === 'multipleChoice') {
          onUpdateComponent(selectedComponent.id, {
            responseType,
            multipleChoiceOptions:
              selectedComponent.multipleChoiceOptions ?? [
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
                { id: crypto.randomUUID(), text: '' },
              ],
            multipleChoiceLabelStyle:
              selectedComponent.multipleChoiceLabelStyle ?? 'A.',
            multipleChoiceLayout:
              selectedComponent.multipleChoiceLayout ?? 'vertical',
            multipleChoiceMarkerStyle:
              selectedComponent.multipleChoiceMarkerStyle ?? 'plain',
          });
      
          return;
        }
      
        onUpdateComponent(selectedComponent.id, {
          responseType,
        });
      }}
      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
    >
      <option value="">Choose response type</option>
      <option value="multipleChoice">Multiple Choice</option>
      <option value="answerLines">Answer Lines</option>
    </select>
  </div>
)}

{selectedComponent.type === 'multipleChoice' && (
  <div className="space-y-4">
   
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Choices
      </span>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={selectedComponent.options.length <= 2}
          onClick={() => {
            if (selectedComponent.options.length <= 2) return;
          
            const nextOptions =
              selectedComponent.options.slice(0, -1);
          
            const rowCount =
              selectedComponent.layout === 'twoColumn'
                ? Math.ceil(nextOptions.length / 2)
                : nextOptions.length;
          
            onUpdateComponent(selectedComponent.id, {
              options: nextOptions,
              height: 8 + rowCount * 32,
            });
          }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          − Remove
        </button>

        <button
          type="button"
          disabled={selectedComponent.options.length >= 5}
          onClick={() => {
            if (selectedComponent.options.length >= 5) return;
          
            const nextOptions = [
              ...selectedComponent.options,
              {
                id: crypto.randomUUID(),
                text: '',
              },
            ];
          
            const rowCount =
              selectedComponent.layout === 'twoColumn'
                ? Math.ceil(nextOptions.length / 2)
                : nextOptions.length;
          
            onUpdateComponent(selectedComponent.id, {
              options: nextOptions,
              height: 8 + rowCount * 32,
            });
          }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
  <div>
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Choice labels
    </span>

    <select
      value={selectedComponent.labelStyle ?? 'A.'}
      onChange={(event) =>
        onUpdateComponent(selectedComponent.id, {
          labelStyle: event.target.value as
            | 'A.'
            | 'A)'
            | 'a.'
            | 'a)',
        })
      }
      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
    >
      <option value="A.">A. B. C.</option>
      <option value="A)">A) B) C)</option>
      <option value="a.">a. b. c.</option>
      <option value="a)">a) b) c)</option>
    </select>
  </div>

  <div>
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
      Choice marker
    </span>

    <select
      value={selectedComponent.markerStyle ?? 'plain'}
      onChange={(event) =>
        onUpdateComponent(selectedComponent.id, {
          markerStyle: event.target.value as
            | 'plain'
            | 'circle',
        })
      }
      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
    >
      <option value="plain">Plain label</option>
      <option value="circle">Letter in circle</option>
    </select>
  </div>
</div>

<div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Choice layout
  </span>

  <select
    value={selectedComponent.layout ?? 'vertical'}
    onChange={(event) =>
      onUpdateComponent(selectedComponent.id, {
        layout: event.target.value as
          | 'vertical'
          | 'twoColumn',
      })
    }
    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
  >
    <option value="vertical">Vertical</option>
    <option value="twoColumn">2 columns</option>
  </select>
</div>
    <div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Font family
  </span>

  <select
    value={(() => {
      const wholeChoiceFont =
        activeMultipleChoiceOption?.style?.fontFamily ??
        selectedComponent.defaultStyle?.fontFamily ??
        'Arial';

      if (!activeMultipleChoiceOption) {
        return wholeChoiceFont;
      }

      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;

      if (!hasSelection) {
        return wholeChoiceFont;
      }

      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [{ text: activeMultipleChoiceOption.text }]
            : [];

      let position = 0;
      let selectedFont: string | null = null;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          const effectiveFont =
            segment.style?.fontFamily ??
            wholeChoiceFont;

          if (selectedFont === null) {
            selectedFont = effectiveFont;
          } else if (
            selectedFont !== effectiveFont
          ) {
            return '';
          }
        }

        position = segmentEnd;
      }

      return selectedFont ?? wholeChoiceFont;
    })()}
    onChange={(event) => {
      const newFontFamily = event.target.value;
    
      // No specific choice active:
      // apply font family to the entire Multiple Choice component.
      if (!activeMultipleChoiceOption) {
        const cleanedOptions =
          selectedComponent.options.map((option) => {
            const nextOptionStyle = {
              ...(option.style ?? {}),
            };
    
            delete nextOptionStyle.fontFamily;
    
            const cleanedRichText =
              option.richText?.map((segment) => {
                const nextStyle: RichTextStyle = {
                  ...(segment.style ?? {}),
                };
    
                delete nextStyle.fontFamily;
    
                return {
                  ...segment,
                  style:
                    Object.keys(nextStyle).length > 0
                      ? nextStyle
                      : undefined,
                };
              });
    
            return {
              ...option,
              style:
                Object.keys(nextOptionStyle).length > 0
                  ? nextOptionStyle
                  : undefined,
              richText: cleanedRichText,
            };
          });
    
        onUpdateComponent(selectedComponent.id, {
          defaultStyle: {
            ...selectedComponent.defaultStyle,
            fontFamily: newFontFamily,
          },
          options: cleanedOptions,
        });
    
        return;
      }
    
      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;
    
      // Highlighted text:
      // change only that text.
      if (hasSelection) {
        const baseSegments =
          activeMultipleChoiceOption.richText &&
          activeMultipleChoiceOption.richText.length > 0
            ? activeMultipleChoiceOption.richText
            : activeMultipleChoiceOption.text
              ? [
                  {
                    text:
                      activeMultipleChoiceOption.text,
                  },
                ]
              : [];
    
        const updatedRichText =
          applyStyleToRange(
            baseSegments,
            multipleChoiceSelection.start!,
            multipleChoiceSelection.end!,
            {
              fontFamily: newFontFamily,
            }
          );
    
        onUpdateComponent(selectedComponent.id, {
          options: selectedComponent.options.map(
            (option) =>
              option.id ===
              activeMultipleChoiceOption.id
                ? {
                    ...option,
                    richText: updatedRichText,
                  }
                : option
          ),
        });
    
        return;
      }
    
      // Specific choice active, no highlighted text:
      // change the entire choice.
      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) => {
            if (
              option.id !==
              activeMultipleChoiceOption.id
            ) {
              return option;
            }
    
            const cleanedRichText =
              option.richText?.map((segment) => {
                const nextStyle: RichTextStyle = {
                  ...(segment.style ?? {}),
                };
    
                delete nextStyle.fontFamily;
    
                return {
                  ...segment,
                  style:
                    Object.keys(nextStyle).length > 0
                      ? nextStyle
                      : undefined,
                };
              });
    
            return {
              ...option,
              style: {
                ...option.style,
                fontFamily: newFontFamily,
              },
              richText: cleanedRichText,
            };
          }
        ),
      });
    }}
    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
  >
    <option value="" disabled>
      Mixed fonts
    </option>
    <option value="Arial">Arial</option>
    <option value="Verdana">Verdana</option>
    <option value="Georgia">Georgia</option>
    <option value="Times New Roman">
      Times New Roman
    </option>
    <option value="Trebuchet MS">
      Trebuchet MS
    </option>
    <option value="Courier New">
      Courier New
    </option>
  </select>
</div>

<div>
<span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
  Font size
</span>

<div className="grid grid-cols-2 gap-2">
<input
    type="number"
    min="8"
    max="72"
    value={(() => {
      const wholeChoiceSize =
        activeMultipleChoiceOption?.style?.fontSize ??
        selectedComponent.defaultStyle?.fontSize ??
        16;

      if (!activeMultipleChoiceOption) {
        return wholeChoiceSize;
      }

      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;

      if (!hasSelection) {
        return wholeChoiceSize;
      }

      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [{ text: activeMultipleChoiceOption.text }]
            : [];

      let position = 0;
      let selectedSize: number | null = null;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          const effectiveSize =
            segment.style?.fontSize ??
            wholeChoiceSize;

          if (selectedSize === null) {
            selectedSize = effectiveSize;
          } else if (
            selectedSize !== effectiveSize
          ) {
            return '';
          }
        }

        position = segmentEnd;
      }

      return selectedSize ?? wholeChoiceSize;
    })()}
    onChange={(event) => {
      const newFontSize =
        Number(event.target.value);
    
      if (!newFontSize) return;
    
      // No specific choice active:
      // apply size to the entire Multiple Choice component.
      if (!activeMultipleChoiceOption) {
        const cleanedOptions =
          selectedComponent.options.map((option) => {
            const nextOptionStyle = {
              ...(option.style ?? {}),
            };
    
            delete nextOptionStyle.fontSize;
    
            const cleanedRichText =
              option.richText?.map((segment) => {
                const nextStyle: RichTextStyle = {
                  ...(segment.style ?? {}),
                };
    
                delete nextStyle.fontSize;
    
                return {
                  ...segment,
                  style:
                    Object.keys(nextStyle).length > 0
                      ? nextStyle
                      : undefined,
                };
              });
    
            return {
              ...option,
              style:
                Object.keys(nextOptionStyle).length > 0
                  ? nextOptionStyle
                  : undefined,
              richText: cleanedRichText,
            };
          });
    
        onUpdateComponent(selectedComponent.id, {
          defaultStyle: {
            ...selectedComponent.defaultStyle,
            fontSize: newFontSize,
          },
          options: cleanedOptions,
        });
    
        return;
      }
    
      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;
    
      // Highlighted text:
      // change only that selected text.
      if (hasSelection) {
        const baseSegments =
          activeMultipleChoiceOption.richText &&
          activeMultipleChoiceOption.richText.length > 0
            ? activeMultipleChoiceOption.richText
            : activeMultipleChoiceOption.text
              ? [
                  {
                    text:
                      activeMultipleChoiceOption.text,
                  },
                ]
              : [];
    
        const updatedRichText =
          applyStyleToRange(
            baseSegments,
            multipleChoiceSelection.start!,
            multipleChoiceSelection.end!,
            {
              fontSize: newFontSize,
            }
          );
    
        onUpdateComponent(selectedComponent.id, {
          options: selectedComponent.options.map(
            (option) =>
              option.id ===
              activeMultipleChoiceOption.id
                ? {
                    ...option,
                    richText: updatedRichText,
                  }
                : option
          ),
        });
    
        return;
      }
    
      // Specific choice active, no highlighted text:
      // change that whole choice.
      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) => {
            if (
              option.id !==
              activeMultipleChoiceOption.id
            ) {
              return option;
            }
    
            const cleanedRichText =
              option.richText?.map((segment) => {
                const nextStyle: RichTextStyle = {
                  ...(segment.style ?? {}),
                };
    
                delete nextStyle.fontSize;
    
                return {
                  ...segment,
                  style:
                    Object.keys(nextStyle).length > 0
                      ? nextStyle
                      : undefined,
                };
              });
    
            return {
              ...option,
              style: {
                ...option.style,
                fontSize: newFontSize,
              },
              richText: cleanedRichText,
            };
          }
        ),
      });
    }}
    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
  />

<button
  type="button"
  onClick={() => {
    const componentIsBold =
      (
        selectedComponent.defaultStyle?.fontWeight ??
        'normal'
      ) === 'bold';
  
    // No specific choice active:
    // apply Bold to the entire Multiple Choice component.
    if (!activeMultipleChoiceOption) {
      const nextFontWeight =
        componentIsBold ? 'normal' : 'bold';
  
      const cleanedOptions =
        selectedComponent.options.map((option) => {
          const nextOptionStyle = {
            ...(option.style ?? {}),
          };
  
          delete nextOptionStyle.fontWeight;
  
          const cleanedRichText =
            option.richText?.map((segment) => {
              const nextStyle: RichTextStyle = {
                ...(segment.style ?? {}),
              };
  
              delete nextStyle.bold;
  
              return {
                ...segment,
                style:
                  Object.keys(nextStyle).length > 0
                    ? nextStyle
                    : undefined,
              };
            });
  
          return {
            ...option,
            style:
              Object.keys(nextOptionStyle).length > 0
                ? nextOptionStyle
                : undefined,
            richText: cleanedRichText,
          };
        });
  
      onUpdateComponent(selectedComponent.id, {
        defaultStyle: {
          ...selectedComponent.defaultStyle,
          fontWeight: nextFontWeight,
        },
        options: cleanedOptions,
      });
  
      return;
    }
  
    const hasSelection =
      multipleChoiceSelection?.componentId ===
        selectedComponent.id &&
      multipleChoiceSelection.optionId ===
        activeMultipleChoiceOption.id &&
      multipleChoiceSelection.start !== undefined &&
      multipleChoiceSelection.end !== undefined &&
      multipleChoiceSelection.start !==
        multipleChoiceSelection.end;

    const wholeChoiceIsBold =
      (
        activeMultipleChoiceOption.style?.fontWeight ??
        selectedComponent.defaultStyle?.fontWeight ??
        'normal'
      ) === 'bold';

    if (hasSelection) {
      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [
                {
                  text: activeMultipleChoiceOption.text,
                },
              ]
            : [];

      const selectedIsBold = (() => {
        let position = 0;
        let foundSelectedText = false;

        for (const segment of baseSegments) {
          const segmentStart = position;
          const segmentEnd =
            position + segment.text.length;

          const overlapsSelection =
            segmentEnd >
              multipleChoiceSelection.start! &&
            segmentStart <
              multipleChoiceSelection.end!;

          if (overlapsSelection) {
            foundSelectedText = true;

            const effectiveBold =
              segment.style?.bold ??
              wholeChoiceIsBold;

            if (!effectiveBold) {
              return false;
            }
          }

          position = segmentEnd;
        }

        return foundSelectedText;
      })();

      const updatedRichText =
        applyStyleToRange(
          baseSegments,
          multipleChoiceSelection.start!,
          multipleChoiceSelection.end!,
          {
            bold: !selectedIsBold,
          }
        );

      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) =>
            option.id ===
            activeMultipleChoiceOption.id
              ? {
                  ...option,
                  richText: updatedRichText,
                }
              : option
        ),
      });

      return;
    }

    const nextFontWeight =
  wholeChoiceIsBold ? 'normal' : 'bold';

onUpdateComponent(selectedComponent.id, {
  options: selectedComponent.options.map(
    (option) => {
      if (
        option.id !==
        activeMultipleChoiceOption.id
      ) {
        return option;
      }

      const cleanedRichText =
        option.richText?.map((segment) => {
          const nextStyle: RichTextStyle = {
            ...(segment.style ?? {}),
          };

          delete nextStyle.bold;

          return {
            ...segment,
            style:
              Object.keys(nextStyle).length > 0
                ? nextStyle
                : undefined,
          };
        });

      return {
        ...option,
        style: {
          ...option.style,
          fontWeight: nextFontWeight,
        },
        richText: cleanedRichText,
      };
    }
  ),
});
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (
      multipleChoiceSelection?.componentId ===
        selectedComponent.id &&
      multipleChoiceSelection.optionId ===
        activeMultipleChoiceOption?.id &&
      multipleChoiceSelection.start !== undefined &&
      multipleChoiceSelection.end !== undefined &&
      multipleChoiceSelection.start !==
        multipleChoiceSelection.end
        ? (() => {
            if (!activeMultipleChoiceOption) {
              return false;
            }

            const baseSegments =
              activeMultipleChoiceOption.richText &&
              activeMultipleChoiceOption.richText.length > 0
                ? activeMultipleChoiceOption.richText
                : activeMultipleChoiceOption.text
                  ? [
                      {
                        text:
                          activeMultipleChoiceOption.text,
                      },
                    ]
                  : [];

            const wholeChoiceIsBold =
              (
                activeMultipleChoiceOption.style
                  ?.fontWeight ??
                selectedComponent.defaultStyle
                  ?.fontWeight ??
                'normal'
              ) === 'bold';

            let position = 0;
            let foundSelectedText = false;

            for (const segment of baseSegments) {
              const segmentStart = position;
              const segmentEnd =
                position + segment.text.length;

              const overlapsSelection =
                segmentEnd >
                  multipleChoiceSelection.start! &&
                segmentStart <
                  multipleChoiceSelection.end!;

              if (overlapsSelection) {
                foundSelectedText = true;

                if (
                  !(
                    segment.style?.bold ??
                    wholeChoiceIsBold
                  )
                ) {
                  return false;
                }
              }

              position = segmentEnd;
            }

            return foundSelectedText;
          })()
        : (
            activeMultipleChoiceOption?.style
              ?.fontWeight ??
            selectedComponent.defaultStyle
              ?.fontWeight ??
            'normal'
          ) === 'bold'
    )
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  } disabled:cursor-not-allowed disabled:opacity-40`}
>
  Bold
</button>

<button
  type="button"
  onClick={() => {
    const componentIsItalic =
      selectedComponent.defaultStyle?.italic ??
      false;
  
    // No specific choice active:
    // apply Italic to the whole Multiple Choice component.
    if (!activeMultipleChoiceOption) {
      const nextItalic = !componentIsItalic;
  
      const cleanedOptions =
        selectedComponent.options.map((option) => {
          const nextOptionStyle = {
            ...(option.style ?? {}),
          };
  
          delete nextOptionStyle.italic;
  
          const cleanedRichText =
            option.richText?.map((segment) => {
              const nextStyle: RichTextStyle = {
                ...(segment.style ?? {}),
              };
  
              delete nextStyle.italic;
  
              return {
                ...segment,
                style:
                  Object.keys(nextStyle).length > 0
                    ? nextStyle
                    : undefined,
              };
            });
  
          return {
            ...option,
            style:
              Object.keys(nextOptionStyle).length > 0
                ? nextOptionStyle
                : undefined,
            richText: cleanedRichText,
          };
        });
  
      onUpdateComponent(selectedComponent.id, {
        defaultStyle: {
          ...selectedComponent.defaultStyle,
          italic: nextItalic,
        },
        options: cleanedOptions,
      });
  
      return;
    }
  
    const hasSelection =
      multipleChoiceSelection?.componentId ===
        selectedComponent.id &&
      multipleChoiceSelection.optionId ===
        activeMultipleChoiceOption.id &&
      multipleChoiceSelection.start !== undefined &&
      multipleChoiceSelection.end !== undefined &&
      multipleChoiceSelection.start !==
        multipleChoiceSelection.end;

    const wholeChoiceIsItalic =
      activeMultipleChoiceOption.style?.italic ??
      selectedComponent.defaultStyle?.italic ??
      false;

    if (hasSelection) {
      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [
                {
                  text: activeMultipleChoiceOption.text,
                },
              ]
            : [];

      let position = 0;
      let foundSelectedText = false;
      let selectedIsItalic = true;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          foundSelectedText = true;

          const effectiveItalic =
            segment.style?.italic ??
            wholeChoiceIsItalic;

          if (!effectiveItalic) {
            selectedIsItalic = false;
            break;
          }
        }

        position = segmentEnd;
      }

      if (!foundSelectedText) {
        selectedIsItalic = false;
      }

      const updatedRichText =
        applyStyleToRange(
          baseSegments,
          multipleChoiceSelection.start!,
          multipleChoiceSelection.end!,
          {
            italic: !selectedIsItalic,
          }
        );

      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) =>
            option.id ===
            activeMultipleChoiceOption.id
              ? {
                  ...option,
                  richText: updatedRichText,
                }
              : option
        ),
      });

      return;
    }

    const nextItalic = !wholeChoiceIsItalic;

    onUpdateComponent(selectedComponent.id, {
      options: selectedComponent.options.map(
        (option) => {
          if (
            option.id !==
            activeMultipleChoiceOption.id
          ) {
            return option;
          }

          const cleanedRichText =
            option.richText?.map((segment) => {
              const nextStyle: RichTextStyle = {
                ...(segment.style ?? {}),
              };

              delete nextStyle.italic;

              return {
                ...segment,
                style:
                  Object.keys(nextStyle).length > 0
                    ? nextStyle
                    : undefined,
              };
            });

          return {
            ...option,
            style: {
              ...option.style,
              italic: nextItalic,
            },
            richText: cleanedRichText,
          };
        }
      ),
    });
  }}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (() => {
      if (!activeMultipleChoiceOption) {
        return false;
      }

      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;

      const wholeChoiceIsItalic =
        activeMultipleChoiceOption.style?.italic ??
        selectedComponent.defaultStyle?.italic ??
        false;

      if (!hasSelection) {
        return wholeChoiceIsItalic;
      }

      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [
                {
                  text: activeMultipleChoiceOption.text,
                },
              ]
            : [];

      let position = 0;
      let foundSelectedText = false;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          foundSelectedText = true;

          const effectiveItalic =
            segment.style?.italic ??
            wholeChoiceIsItalic;

          if (!effectiveItalic) {
            return false;
          }
        }

        position = segmentEnd;
      }

      return foundSelectedText;
    })()
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  } disabled:cursor-not-allowed disabled:opacity-40`}
>
  Italic
</button>

<button
  type="button"
  onClick={() => {
    if (!activeMultipleChoiceOption) return;
  
    const hasSelection =
      multipleChoiceSelection?.componentId ===
        selectedComponent.id &&
      multipleChoiceSelection.optionId ===
        activeMultipleChoiceOption.id &&
      multipleChoiceSelection.start !== undefined &&
      multipleChoiceSelection.end !== undefined &&
      multipleChoiceSelection.start !==
        multipleChoiceSelection.end;

    const wholeChoiceIsUnderlined =
      activeMultipleChoiceOption.style?.underline ??
      selectedComponent.defaultStyle?.underline ??
      false;

    if (hasSelection) {
      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [
                {
                  text: activeMultipleChoiceOption.text,
                },
              ]
            : [];

      let position = 0;
      let foundSelectedText = false;
      let selectedIsUnderlined = true;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          foundSelectedText = true;

          const effectiveUnderline =
            segment.style?.underline ??
            wholeChoiceIsUnderlined;

          if (!effectiveUnderline) {
            selectedIsUnderlined = false;
            break;
          }
        }

        position = segmentEnd;
      }

      if (!foundSelectedText) {
        selectedIsUnderlined = false;
      }

      const updatedRichText =
        applyStyleToRange(
          baseSegments,
          multipleChoiceSelection.start!,
          multipleChoiceSelection.end!,
          {
            underline: !selectedIsUnderlined,
          }
        );

      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) =>
            option.id ===
            activeMultipleChoiceOption.id
              ? {
                  ...option,
                  richText: updatedRichText,
                }
              : option
        ),
      });

      return;
    }

    const nextUnderline =
      !wholeChoiceIsUnderlined;

    onUpdateComponent(selectedComponent.id, {
      options: selectedComponent.options.map(
        (option) => {
          if (
            option.id !==
            activeMultipleChoiceOption.id
          ) {
            return option;
          }

          const cleanedRichText =
            option.richText?.map((segment) => {
              const nextStyle: RichTextStyle = {
                ...(segment.style ?? {}),
              };

              delete nextStyle.underline;

              return {
                ...segment,
                style:
                  Object.keys(nextStyle).length > 0
                    ? nextStyle
                    : undefined,
              };
            });

          return {
            ...option,
            style: {
              ...option.style,
              underline: nextUnderline,
            },
            richText: cleanedRichText,
          };
        }
      ),
    });
  }}
  disabled={!activeMultipleChoiceOption}
  className={`min-h-11 w-full rounded-lg border px-3 text-sm font-semibold ${
    (() => {
      if (!activeMultipleChoiceOption) {
        return false;
      }

      const hasSelection =
        multipleChoiceSelection?.componentId ===
          selectedComponent.id &&
        multipleChoiceSelection.optionId ===
          activeMultipleChoiceOption.id &&
        multipleChoiceSelection.start !== undefined &&
        multipleChoiceSelection.end !== undefined &&
        multipleChoiceSelection.start !==
          multipleChoiceSelection.end;

      const wholeChoiceIsUnderlined =
        activeMultipleChoiceOption.style?.underline ??
        selectedComponent.defaultStyle?.underline ??
        false;

      if (!hasSelection) {
        return wholeChoiceIsUnderlined;
      }

      const baseSegments =
        activeMultipleChoiceOption.richText &&
        activeMultipleChoiceOption.richText.length > 0
          ? activeMultipleChoiceOption.richText
          : activeMultipleChoiceOption.text
            ? [
                {
                  text: activeMultipleChoiceOption.text,
                },
              ]
            : [];

      let position = 0;
      let foundSelectedText = false;

      for (const segment of baseSegments) {
        const segmentStart = position;
        const segmentEnd =
          position + segment.text.length;

        const overlapsSelection =
          segmentEnd >
            multipleChoiceSelection.start! &&
          segmentStart <
            multipleChoiceSelection.end!;

        if (overlapsSelection) {
          foundSelectedText = true;

          const effectiveUnderline =
            segment.style?.underline ??
            wholeChoiceIsUnderlined;

          if (!effectiveUnderline) {
            return false;
          }
        }

        position = segmentEnd;
      }

      return foundSelectedText;
    })()
      ? 'border-violet-500 bg-violet-50 text-violet-700'
      : 'border-slate-300 bg-white text-slate-700'
  } disabled:cursor-not-allowed disabled:opacity-40`}
>
  Underline
</button>

</div>
</div>

<div>
  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
    Text color
  </span>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 92px',
      gap: '8px',
      alignItems: 'center',
    }}
  >
    <input
      type="color"
      value={(() => {
        const wholeChoiceColor =
          activeMultipleChoiceOption?.style?.textColor ??
          selectedComponent.defaultStyle?.textColor ??
          '#0F172A';

        if (!activeMultipleChoiceOption) {
          return wholeChoiceColor;
        }

        const hasSelection =
          multipleChoiceSelection?.componentId ===
            selectedComponent.id &&
          multipleChoiceSelection.optionId ===
            activeMultipleChoiceOption.id &&
          multipleChoiceSelection.start !== undefined &&
          multipleChoiceSelection.end !== undefined &&
          multipleChoiceSelection.start !==
            multipleChoiceSelection.end;

        if (!hasSelection) {
          return wholeChoiceColor;
        }

        const baseSegments =
          activeMultipleChoiceOption.richText &&
          activeMultipleChoiceOption.richText.length > 0
            ? activeMultipleChoiceOption.richText
            : activeMultipleChoiceOption.text
              ? [
                  {
                    text:
                      activeMultipleChoiceOption.text,
                  },
                ]
              : [];

        let position = 0;

        for (const segment of baseSegments) {
          const segmentStart = position;
          const segmentEnd =
            position + segment.text.length;

          const overlapsSelection =
            segmentEnd >
              multipleChoiceSelection.start! &&
            segmentStart <
              multipleChoiceSelection.end!;

          if (overlapsSelection) {
            return (
              segment.style?.color ??
              wholeChoiceColor
            );
          }

          position = segmentEnd;
        }

        return wholeChoiceColor;
      })()}
      onChange={(event) => {
        const newColor = event.target.value;
      
        // No specific choice active:
        // apply color to the entire Multiple Choice component.
        if (!activeMultipleChoiceOption) {
          const cleanedOptions =
            selectedComponent.options.map((option) => {
              const nextOptionStyle = {
                ...(option.style ?? {}),
              };
      
              delete nextOptionStyle.textColor;
      
              const cleanedRichText =
                option.richText?.map((segment) => {
                  const nextStyle: RichTextStyle = {
                    ...(segment.style ?? {}),
                  };
      
                  delete nextStyle.color;
      
                  return {
                    ...segment,
                    style:
                      Object.keys(nextStyle).length > 0
                        ? nextStyle
                        : undefined,
                  };
                });
      
              return {
                ...option,
                style:
                  Object.keys(nextOptionStyle).length > 0
                    ? nextOptionStyle
                    : undefined,
                richText: cleanedRichText,
              };
            });
      
          onUpdateComponent(selectedComponent.id, {
            defaultStyle: {
              ...selectedComponent.defaultStyle,
              textColor: newColor,
            },
            options: cleanedOptions,
          });
      
          return;
        }
      
        const hasSelection =
          multipleChoiceSelection?.componentId ===
            selectedComponent.id &&
          multipleChoiceSelection.optionId ===
            activeMultipleChoiceOption.id &&
          multipleChoiceSelection.start !== undefined &&
          multipleChoiceSelection.end !== undefined &&
          multipleChoiceSelection.start !==
            multipleChoiceSelection.end;

        if (hasSelection) {
          const baseSegments =
            activeMultipleChoiceOption.richText &&
            activeMultipleChoiceOption.richText.length > 0
              ? activeMultipleChoiceOption.richText
              : activeMultipleChoiceOption.text
                ? [
                    {
                      text:
                        activeMultipleChoiceOption.text,
                    },
                  ]
                : [];

          const updatedRichText =
            applyStyleToRange(
              baseSegments,
              multipleChoiceSelection.start!,
              multipleChoiceSelection.end!,
              {
                color: newColor,
              }
            );

          onUpdateComponent(
            selectedComponent.id,
            {
              options:
                selectedComponent.options.map(
                  (option) =>
                    option.id ===
                    activeMultipleChoiceOption.id
                      ? {
                          ...option,
                          richText:
                            updatedRichText,
                        }
                      : option
                ),
            }
          );

          return;
        }

        onUpdateComponent(
          selectedComponent.id,
          {
            options:
              selectedComponent.options.map(
                (option) => {
                  if (
                    option.id !==
                    activeMultipleChoiceOption.id
                  ) {
                    return option;
                  }

                  const cleanedRichText =
                    option.richText?.map(
                      (segment) => {
                        const nextStyle:
                          RichTextStyle = {
                          ...(segment.style ?? {}),
                        };

                        delete nextStyle.color;

                        return {
                          ...segment,
                          style:
                            Object.keys(nextStyle)
                              .length > 0
                              ? nextStyle
                              : undefined,
                        };
                      }
                    );

                  return {
                    ...option,
                    style: {
                      ...option.style,
                      textColor: newColor,
                    },
                    richText:
                      cleanedRichText,
                  };
                }
              ),
          }
        );
      }}
      className="h-10 w-full cursor-pointer rounded-md border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Choose choice text color"
    />

    <input
      key={(() => {
        const wholeChoiceColor =
          activeMultipleChoiceOption?.style?.textColor ??
          selectedComponent.defaultStyle?.textColor ??
          '#0F172A';

        if (!activeMultipleChoiceOption) {
          return wholeChoiceColor;
        }

        const hasSelection =
          multipleChoiceSelection?.componentId ===
            selectedComponent.id &&
          multipleChoiceSelection.optionId ===
            activeMultipleChoiceOption.id &&
          multipleChoiceSelection.start !== undefined &&
          multipleChoiceSelection.end !== undefined &&
          multipleChoiceSelection.start !==
            multipleChoiceSelection.end;

        if (!hasSelection) {
          return wholeChoiceColor;
        }

        const baseSegments =
          activeMultipleChoiceOption.richText &&
          activeMultipleChoiceOption.richText.length > 0
            ? activeMultipleChoiceOption.richText
            : activeMultipleChoiceOption.text
              ? [
                  {
                    text:
                      activeMultipleChoiceOption.text,
                  },
                ]
              : [];

        let position = 0;

        for (const segment of baseSegments) {
          const segmentStart = position;
          const segmentEnd =
            position + segment.text.length;

          if (
            segmentEnd >
              multipleChoiceSelection.start! &&
            segmentStart <
              multipleChoiceSelection.end!
          ) {
            return (
              segment.style?.color ??
              wholeChoiceColor
            );
          }

          position = segmentEnd;
        }

        return wholeChoiceColor;
      })()}
      type="text"
      defaultValue={(() => {
        const wholeChoiceColor =
          activeMultipleChoiceOption?.style?.textColor ??
          selectedComponent.defaultStyle?.textColor ??
          '#0F172A';

        if (!activeMultipleChoiceOption) {
          return wholeChoiceColor.toUpperCase();
        }

        const hasSelection =
          multipleChoiceSelection?.componentId ===
            selectedComponent.id &&
          multipleChoiceSelection.optionId ===
            activeMultipleChoiceOption.id &&
          multipleChoiceSelection.start !== undefined &&
          multipleChoiceSelection.end !== undefined &&
          multipleChoiceSelection.start !==
            multipleChoiceSelection.end;

        if (!hasSelection) {
          return wholeChoiceColor.toUpperCase();
        }

        const baseSegments =
          activeMultipleChoiceOption.richText &&
          activeMultipleChoiceOption.richText.length > 0
            ? activeMultipleChoiceOption.richText
            : activeMultipleChoiceOption.text
              ? [
                  {
                    text:
                      activeMultipleChoiceOption.text,
                  },
                ]
              : [];

        let position = 0;

        for (const segment of baseSegments) {
          const segmentStart = position;
          const segmentEnd =
            position + segment.text.length;

          if (
            segmentEnd >
              multipleChoiceSelection.start! &&
            segmentStart <
              multipleChoiceSelection.end!
          ) {
            return (
              segment.style?.color ??
              wholeChoiceColor
            ).toUpperCase();
          }

          position = segmentEnd;
        }

        return wholeChoiceColor.toUpperCase();
      })()}
      maxLength={7}
      className="h-[38px] w-[92px] rounded-md border border-slate-300 px-2 font-mono text-sm uppercase outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      onPointerDown={() => {
        const selection =
          multipleChoiceSelection;

        if (
          selection?.componentId ===
            selectedComponent.id &&
          selection.start !== undefined &&
          selection.end !== undefined &&
          selection.start !== selection.end
        ) {
          multipleChoiceHexSelectionRef.current = {
            componentId: selection.componentId,
            optionId: selection.optionId,
            start: selection.start,
            end: selection.end,
          };
        } else {
          multipleChoiceHexSelectionRef.current =
            null;
        }
      }}
            onFocus={(event) => {
        event.currentTarget.select();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => {
        const rawValue =
  event.currentTarget.value.trim();

const value =
  rawValue.startsWith('#')
    ? rawValue
    : `#${rawValue}`;

if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
  return;
}

event.currentTarget.value =
  value.toUpperCase();
        const savedSelection =
    multipleChoiceHexSelectionRef.current
      ?.componentId === selectedComponent.id
      ? multipleChoiceHexSelectionRef.current
      : null;

  multipleChoiceHexSelectionRef.current = null;

  if (savedSelection) {
    const selectedOption =
      selectedComponent.options.find(
        (option) =>
          option.id === savedSelection.optionId
      );

    if (selectedOption) {
      const baseSegments =
        selectedOption.richText &&
        selectedOption.richText.length > 0
          ? selectedOption.richText
          : selectedOption.text
            ? [{ text: selectedOption.text }]
            : [];

      const updatedRichText =
        applyStyleToRange(
          baseSegments,
          savedSelection.start,
          savedSelection.end,
          {
            color: value,
          }
        );

      onUpdateComponent(selectedComponent.id, {
        options: selectedComponent.options.map(
          (option) =>
            option.id === selectedOption.id
              ? {
                  ...option,
                  richText: updatedRichText,
                }
              : option
        ),
      });

      return;
    }
  }
        // No specific choice active:
        // apply color to the entire Multiple Choice component.
        if (!activeMultipleChoiceOption) {
          const cleanedOptions =
            selectedComponent.options.map((option) => {
              const nextOptionStyle = {
                ...(option.style ?? {}),
              };
      
              delete nextOptionStyle.textColor;
      
              const cleanedRichText =
                option.richText?.map((segment) => {
                  const nextStyle: RichTextStyle = {
                    ...(segment.style ?? {}),
                  };
      
                  delete nextStyle.color;
      
                  return {
                    ...segment,
                    style:
                      Object.keys(nextStyle).length > 0
                        ? nextStyle
                        : undefined,
                  };
                });
      
              return {
                ...option,
                style:
                  Object.keys(nextOptionStyle).length > 0
                    ? nextOptionStyle
                    : undefined,
                richText: cleanedRichText,
              };
            });
      
          onUpdateComponent(selectedComponent.id, {
            defaultStyle: {
              ...selectedComponent.defaultStyle,
              textColor: value,
            },
            options: cleanedOptions,
          });
      
          return;
        }
      
        const hasSelection =
          multipleChoiceSelection?.componentId ===
            selectedComponent.id &&
          multipleChoiceSelection.optionId ===
            activeMultipleChoiceOption.id &&
          multipleChoiceSelection.start !== undefined &&
          multipleChoiceSelection.end !== undefined &&
          multipleChoiceSelection.start !==
            multipleChoiceSelection.end;

        if (hasSelection) {
          const baseSegments =
            activeMultipleChoiceOption.richText &&
            activeMultipleChoiceOption.richText.length > 0
              ? activeMultipleChoiceOption.richText
              : activeMultipleChoiceOption.text
                ? [
                    {
                      text:
                        activeMultipleChoiceOption.text,
                    },
                  ]
                : [];

          const updatedRichText =
            applyStyleToRange(
              baseSegments,
              multipleChoiceSelection.start!,
              multipleChoiceSelection.end!,
              {
                color: value,
              }
            );

          onUpdateComponent(
            selectedComponent.id,
            {
              options:
                selectedComponent.options.map(
                  (option) =>
                    option.id ===
                    activeMultipleChoiceOption.id
                      ? {
                          ...option,
                          richText:
                            updatedRichText,
                        }
                      : option
                ),
            }
          );

          return;
        }

        onUpdateComponent(
          selectedComponent.id,
          {
            options:
              selectedComponent.options.map(
                (option) => {
                  if (
                    option.id !==
                    activeMultipleChoiceOption.id
                  ) {
                    return option;
                  }

                  const cleanedRichText =
                    option.richText?.map(
                      (segment) => {
                        const nextStyle:
                          RichTextStyle = {
                          ...(segment.style ?? {}),
                        };

                        delete nextStyle.color;

                        return {
                          ...segment,
                          style:
                            Object.keys(nextStyle)
                              .length > 0
                              ? nextStyle
                              : undefined,
                        };
                      }
                    );

                  return {
                    ...option,
                    style: {
                      ...option.style,
                      textColor: value,
                    },
                    richText:
                      cleanedRichText,
                  };
                }
              ),
          }
        );
      }}
    />
  </div>
</div>
  </div>
)}

          <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <span className="text-sm font-semibold text-slate-800">
              Lock component
            </span>

            <input
              type="checkbox"
              checked={selectedComponent.locked}
              onChange={(event) =>
                onUpdateComponent(selectedComponent.id, {
                  locked: event.target.checked,
                })
              }
              className="h-4 w-4 accent-violet-600"
            />
          </label>

          <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  }}
>

          <button
            type="button"
            onClick={onDuplicate}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Duplicate
          </button>

          <button
  type="button"
  onClick={onDelete}
  disabled={selectedComponent.locked}
  title={
    selectedComponent.locked
      ? 'Unlock component to delete'
      : 'Delete component'
  }
  className={`min-h-11 w-full rounded-lg border px-4 text-sm font-semibold ${
    selectedComponent.locked
      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
      : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
  }`}
>
  Delete
</button>
        </div>

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
  )
}