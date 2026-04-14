import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CATEGORIES } from '@shared/constants/categories';
import { GATES } from '@shared/constants/gates';
import { STATUSES, STATUS_STYLE } from '../constants';
import { MultiSelectFilter } from './MultiSelectFilter';

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
  description: c.description,
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
  if (filters.statuses.size > 0) count++;
  if (filters.priorities.size > 0) count++;
  if (filters.categories.size > 0) count++;
  if (filters.assignees.size > 0) count++;
  if (filters.gates.size > 0) count++;
  if (filters.dueDateRange.from || filters.dueDateRange.to) count++;
  if (filters.progressRange.min > 0 || filters.progressRange.max < 100) count++;
  return count;
}

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
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Filters</span>

      <MultiSelectFilter
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.statuses}
        onChange={statuses => update({ statuses })}
      />

      <MultiSelectFilter
        label="Priority"
        options={PRIORITY_OPTIONS}
        selected={filters.priorities}
        onChange={priorities => update({ priorities })}
      />

      <MultiSelectFilter
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={filters.categories}
        onChange={categories => update({ categories })}
      />

      <MultiSelectFilter
        label="Gate"
        options={GATE_OPTIONS}
        selected={filters.gates}
        onChange={gates => update({ gates })}
      />

      {allAssignees.length > 0 && (
        <MultiSelectFilter
          label="Assignee"
          options={assigneeOptions}
          selected={filters.assignees}
          onChange={assignees => update({ assignees })}
          searchable
        />
      )}

      {activeCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            Clear all
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-sm">
              {activeCount}
            </Badge>
          </Button>
        </>
      )}
    </div>
  );
}
