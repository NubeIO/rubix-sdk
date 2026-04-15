export function MiniStat({ label, value, sub, color, icon }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-card min-w-[100px]">
      {icon && (
        <div className={`shrink-0 ${color || 'text-muted-foreground'}`}>
          {icon}
        </div>
      )}
      <div className="flex flex-col">
        <span className={`text-base font-semibold leading-tight ${color || 'text-foreground'}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {label}{sub ? ` · ${sub}` : ''}
        </span>
      </div>
    </div>
  );
}
