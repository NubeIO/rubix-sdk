import type { GateId } from '@shared/constants/gates';
import type { CategoryId } from '@shared/constants/categories';

export interface GateProgress {
  gateId: GateId;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
  status: 'done' | 'active' | 'upcoming';
}

export interface ProductSummary {
  product: any;
  tasks: any[];
  gateProgress: GateProgress[];
  currentGate: GateId | null;
  overallProgress: number;
}

export interface GanttTask {
  id: string;
  name: string;
  category: CategoryId | string;
  gate: GateId | null;
  assignee?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  tickets: GanttTicket[];
}

export interface GanttTicket {
  id: string;
  name: string;
  parentId: string;
  status?: string;
}

export interface CategoryGroup {
  category: { id: string; name: string; description: string };
  tasks: GanttTask[];
}

export type GroupByMode = 'category' | 'assignee' | 'gate';
