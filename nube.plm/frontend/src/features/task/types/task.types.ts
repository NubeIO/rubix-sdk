/**
 * Task type definitions
 */

export interface TaskSettings {
  title?: string;
  description?: string;
  status?: string; // pending, in-progress, completed, cancelled
  priority?: string; // low, medium, high, critical
  progress?: number; // 0-100
  completed?: boolean;
  assignee?: string;
  reporter?: string;
  category?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  blocked?: boolean;
  blockedReason?: string;
  tags?: string;
  labels?: string;
  notes?: string;
}

export interface Task {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  settings?: TaskSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskInput {
  name: string;
  parentId: string; // Product ID
  settings?: Partial<TaskSettings>;
}

export interface UpdateTaskInput {
  name?: string;
  settings?: Partial<TaskSettings>;
}
