import { GATES, type GateId } from '@shared/constants/gates';

/** Extract the gate ID from a task's tags string */
export function getTaskGate(tags?: string): GateId | null {
  if (!tags) return null;
  const match = tags.split(',').map(t => t.trim()).find(t => t.startsWith('gate:'));
  if (!match) return null;
  const id = match.replace('gate:', '');
  return GATES.some(g => g.id === id) ? id as GateId : null;
}

/** Set or replace the gate tag in a tags string */
export function setTaskGate(tags: string | undefined, gateId: GateId): string {
  const existing = (tags || '').split(',').map(t => t.trim()).filter(t => t && !t.startsWith('gate:'));
  return [...existing, `gate:${gateId}`].join(', ');
}

interface GateProgress {
  gateId: GateId;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
  status: 'done' | 'active' | 'upcoming';
}

interface TaskLike {
  settings?: {
    tags?: string;
    status?: string;
    progress?: number;
  };
}

/** Auto-derive which gate is currently active for a product.
 *  Logic: the earliest gate (by G1-G8 order) that has tasks and is not 100% complete.
 *  Falls back to manual override if set. */
export function deriveCurrentGate(tasks: TaskLike[], manualOverride?: GateId): GateId | null {
  if (manualOverride) return manualOverride;
  for (const gate of GATES) {
    const gateTasks = tasks.filter(t => getTaskGate(t.settings?.tags) === gate.id);
    if (gateTasks.length === 0) continue;
    const allComplete = gateTasks.every(t => t.settings?.status === 'completed');
    if (!allComplete) return gate.id;
  }
  return null;
}

/** Compute gate progress for a product */
export function computeGateProgress(tasks: TaskLike[], manualOverride?: GateId): GateProgress[] {
  const currentGateId = deriveCurrentGate(tasks, manualOverride);

  return GATES.map(gate => {
    const gateTasks = tasks.filter(t => getTaskGate(t.settings?.tags) === gate.id);
    const totalTasks = gateTasks.length;
    const completedTasks = gateTasks.filter(t => t.settings?.status === 'completed').length;
    const averageProgress = totalTasks > 0
      ? Math.round(gateTasks.reduce((sum, t) => sum + (t.settings?.progress || 0), 0) / totalTasks)
      : 0;

    let status: 'done' | 'active' | 'upcoming' = 'upcoming';
    if (totalTasks > 0 && completedTasks === totalTasks) status = 'done';
    else if (gate.id === currentGateId) status = 'active';

    return { gateId: gate.id, totalTasks, completedTasks, averageProgress, status };
  });
}
