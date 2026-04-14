import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  value: string;
  label: string;
  description?: string;
  dot?: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  searchable?: boolean;
}

export function MultiSelectFilter({ label, options, selected, onChange, searchable = false }: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (value: string) => {
    const next = new Set(selected);
    next.has(value) ? next.delete(value) : next.add(value);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(options.map(o => o.value)));
  const clearAll = () => onChange(new Set());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed">
          {label}
          {selected.size > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px] rounded-sm">
              {selected.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {searchable && (
          <div className="p-2 pb-0">
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        )}
        <div className="p-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className="flex gap-1">
              <button onClick={selectAll} className="text-[10px] text-muted-foreground hover:text-foreground transition">All</button>
              <span className="text-[10px] text-muted-foreground/40">/</span>
              <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-foreground transition">None</button>
            </div>
          </div>
          <Separator className="my-1" />
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">No results</div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.has(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition cursor-pointer text-left"
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition
                      ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                      {isSelected && <span className="text-[8px] text-primary-foreground leading-none">{'\u2713'}</span>}
                    </div>
                    {option.dot && <div className={`w-2 h-2 rounded-full shrink-0 ${option.dot}`} />}
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground truncate block">{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground truncate block">{option.description}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
