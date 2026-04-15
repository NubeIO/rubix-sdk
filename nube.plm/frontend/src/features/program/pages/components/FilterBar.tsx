import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '@shared/constants/categories';
import { GATES } from '@shared/constants/gates';
import { STATUSES, STATUS_STYLE } from '../constants';

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical', dot: 'bg-red-500' },
  { value: 'High', label: 'High', dot: 'bg-amber-500' },
  { value: 'Medium', label: 'Medium', dot: 'bg-blue-500' },
  { value: 'Low', label: 'Low', dot: 'bg-zinc-500' },
];

const STATUS_OPTIONS = STATUSES.map(s => ({
  value: s,
  label: s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
  dot: STATUS_STYLE[s]?.dot || 'bg-zinc-500',
}));

const CATEGORY_OPTIONS = CATEGORIES.map(c => ({
  value: c.id,
  label: c.name,
}));

const GATE_OPTIONS = GATES.map(g => ({
  value: g.id,
  label: `${g.id.toUpperCase()} ${g.name}`,
}));

export interface TaskFilters {
  statuses: Set<string>;
  priorities: Set<string>;
  categories: Set<string>;
  assignees: Set<string>;
  gates: Set<string>;
  dueDateRange: { from?: string; to?: string };
  progressRange: { min: number; max: number };
}

export const EMPTY_FILTERS: TaskFilters = {
  statuses: new Set(),
  priorities: new Set(),
  categories: new Set(),
  assignees: new Set(),
  gates: new Set(),
  dueDateRange: {},
  progressRange: { min: 0, max: 100 },
};

export function countActiveFilters(filters: TaskFilters): number {
  let count = 0;
  if (filters.statuses.size > 0) count += filters.statuses.size;
  if (filters.priorities.size > 0) count += filters.priorities.size;
  if (filters.categories.size > 0) count += filters.categories.size;
  if (filters.assignees.size > 0) count += filters.assignees.size;
  if (filters.gates.size > 0) count += filters.gates.size;
  if (filters.dueDateRange.from || filters.dueDateRange.to) count++;
  if (filters.progressRange.min > 0 || filters.progressRange.max < 100) count++;
  return count;
}

// ── Filter section inside the unified popover ──

interface FilterOption {
  value: string;
  label: string;
  dot?: string;
}

function FilterSection({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (value: string) => {
    const next = new Set(selected);
    next.has(value) ? next.delete(value) : next.add(value);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {selected.size > 0 && (
          <button onClick={() => onChange(new Set())} className="text-[10px] text-muted-foreground hover:text-foreground transition">
            Clear
          </button>
        )}
      </div>
      {searchable && (
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className="h-6 text-[11px] mb-1"
        />
      )}
      <div className="flex flex-wrap gap-1">
        {filtered.map(option => {
          const isSelected = selected.has(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggle(option.value)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border transition cursor-pointer
                ${isSelected
                  ? 'bg-primary/15 border-primary/40 text-foreground'
                  : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'}`}
            >
              {option.dot && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${option.dot}`} />}
              {option.label}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <span className="text-[10px] text-muted-foreground py-1">No results</span>
        )}
      </div>
    </div>
  );
}

// ── Main FilterBar — single button ──

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  allAssignees: string[];
}

export function FilterBar({ filters, onChange, allAssignees }: FilterBarProps) {
  const activeCount = countActiveFilters(filters);

  const assigneeOptions = useMemo(() =>
    allAssignees.map(name => ({ value: name, label: name })),
  [allAssignees]);

  const update = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="px-3 py-2 flex items-center justify-between border-b border-border/50">
          <span className="text-xs font-medium">Filters</span>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-muted-foreground"
              onClick={() => onChange({ ...EMPTY_FILTERS })}
            >
              Clear all ({activeCount})
            </Button>
          )}
        </div>
        <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
          <FilterSection
            label="Status"
            options={STATUS_OPTIONS}
            selected={filters.statuses}
            onChange={statuses => update({ statuses })}
          />
          <Separator />
          <FilterSection
            label="Priority"
            options={PRIORITY_OPTIONS}
            selected={filters.priorities}
            onChange={priorities => update({ priorities })}
          />
          <Separator />
          <FilterSection
            label="Category"
            options={CATEGORY_OPTIONS}
            selected={filters.categories}
            onChange={categories => update({ categories })}
          />
          <Separator />
          <FilterSection
            label="Gate"
            options={GATE_OPTIONS}
            selected={filters.gates}
            onChange={gates => update({ gates })}
          />
          {allAssignees.length > 0 && (
            <>
              <Separator />
              <FilterSection
                label="Assignee"
                options={assigneeOptions}
                selected={filters.assignees}
                onChange={assignees => update({ assignees })}
                searchable
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
