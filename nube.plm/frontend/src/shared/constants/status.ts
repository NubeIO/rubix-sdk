/** Single source of truth for task status display names.
 *  Used by: DashboardHeader stat cards, ProjectCard pills, GanttTaskRow badges, GanttLegend. */
export const STATUS_DISPLAY: Record<string, { label: string; barClass: string; badgeClass: string }> = {
  'completed': {
    label: 'Done',
    barClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  'in-progress': {
    label: 'In Progress',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-sky-50 text-sky-700',
  },
  'blocked': {
    label: 'At Risk',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  'pending': {
    label: 'Planned',
    barClass: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-600',
  },
  'review': {
    label: 'In Review',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  'cancelled': {
    label: 'Cancelled',
    barClass: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-500',
  },
};

/** Dashboard project card status (portfolio-level health).
 *  These are derived values, NOT the same as task status. */
export const PROJECT_STATUS_DISPLAY: Record<string, string> = {
  'On Track': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'At Risk': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Review': 'bg-slate-100 text-slate-700 border-slate-200',
};
