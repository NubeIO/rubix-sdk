export function GateTab({ label, count, status, isActive, onClick }: {
  label: string;
  count: number;
  status?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const dotColor =
    status === 'done' ? 'bg-emerald-500'
    : status === 'active' ? 'bg-blue-500'
    : count > 0 ? 'bg-muted-foreground'
    : 'bg-muted-foreground/30';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition border-b-2 cursor-pointer whitespace-nowrap
        ${isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
      {count > 0 && <span className="text-[10px] text-muted-foreground/60">{count}</span>}
    </button>
  );
}
