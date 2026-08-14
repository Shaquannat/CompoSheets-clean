import { ToolButton } from './ToolButton';

type LibraryProps = {
  onAddText: () => void;
  onAddQuestion: () => void;
};

export function Library({ onAddText, onAddQuestion }: LibraryProps) {
  const componentTools = [
    { icon: 'T', label: 'Text' },
    { icon: 'Q', label: 'Question' },
    { icon: '—', label: 'Answer Lines' },
    { icon: '☐', label: 'Checkbox' },
    { icon: '▦', label: 'Table' },
    { icon: '▭', label: 'Shape' },
    { icon: '⌁', label: 'Image' },
  ];

  return (
    <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
      <div className="mb-4">
        <h2 className="font-bold text-slate-900">Library</h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Add content and reusable worksheet components.
        </p>
      </div>

      <div className="grid gap-2">
        {componentTools.map((tool) => (
          <ToolButton
            key={tool.label}
            icon={tool.icon}
            label={tool.label}
            onClick={
              tool.label === 'Text'
                ? onAddText
                : tool.label === 'Question'
                  ? onAddQuestion
                  : undefined
            }
          />
        ))}
      </div>
    </aside>
  );
}
