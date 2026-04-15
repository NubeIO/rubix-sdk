/** Compute the week index for a date relative to a start date */
export function dateToWeekIndex(date: Date, rangeStart: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - rangeStart.getTime()) / msPerWeek);
}

/** Parse a date string (YYYY-MM-DD) into a Date at noon to avoid timezone issues */
export function parseDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }
  return new Date(dateStr);
}

/** Compute the span [startCol, endCol] for a task bar in the grid */
export function computeBarSpan(
  startDate: string | undefined,
  dueDate: string | undefined,
  rangeStart: Date,
  totalWeeks: number,
): [number, number] | null {
  if (!startDate && !dueDate) return null;

  const start = startDate ? dateToWeekIndex(parseDate(startDate), rangeStart) : 0;
  const end = dueDate ? dateToWeekIndex(parseDate(dueDate), rangeStart) : start;

  const clampedStart = Math.max(0, Math.min(start, totalWeeks - 1));
  const clampedEnd = Math.max(clampedStart, Math.min(end, totalWeeks - 1));

  return [clampedStart, clampedEnd];
}

/** Generate week labels (W1, W2, ...) for a date range */
export function generateWeekLabels(totalWeeks: number): string[] {
  return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
}

/** Generate month labels with their column span for the timeline header */
export function generateMonthLabels(rangeStart: Date, totalWeeks: number): { label: string; span: number }[] {
  const labels: { label: string; span: number }[] = [];
  const formatter = new Intl.DateTimeFormat('en-AU', { month: 'short', year: 'numeric' });

  let currentMonth = -1;
  let currentYear = -1;

  for (let w = 0; w < totalWeeks; w++) {
    const weekDate = new Date(rangeStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    const month = weekDate.getMonth();
    const year = weekDate.getFullYear();

    if (month !== currentMonth || year !== currentYear) {
      labels.push({ label: formatter.format(weekDate), span: 1 });
      currentMonth = month;
      currentYear = year;
    } else {
      labels[labels.length - 1].span++;
    }
  }

  return labels;
}

/** Compute the visible date range from tasks, with a default fallback */
export function computeDateRange(tasks: { startDate?: string; dueDate?: string }[]): {
  rangeStart: Date;
  totalWeeks: number;
} {
  const MAX_WEEKS = 24;
  const MIN_WEEKS = 12;

  const dates: Date[] = [];
  for (const t of tasks) {
    if (t.startDate) dates.push(parseDate(t.startDate));
    if (t.dueDate) dates.push(parseDate(t.dueDate));
  }

  if (dates.length === 0) {
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
    return { rangeStart, totalWeeks: MIN_WEEKS };
  }

  const min = new Date(Math.min(...dates.map(d => d.getTime())));
  const max = new Date(Math.max(...dates.map(d => d.getTime())));

  // Align to Monday
  const rangeStart = new Date(min.getFullYear(), min.getMonth(), min.getDate() - min.getDay() + 1);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const rawWeeks = Math.ceil((max.getTime() - rangeStart.getTime()) / msPerWeek) + 1;
  const totalWeeks = Math.max(MIN_WEEKS, Math.min(rawWeeks, MAX_WEEKS));

  return { rangeStart, totalWeeks };
}
