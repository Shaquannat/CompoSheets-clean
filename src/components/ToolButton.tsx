type ToolButtonProps = {
  icon: string;
  label: string;
  onClick?: () => void;
};

export function ToolButton({ icon, label, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm"
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}
