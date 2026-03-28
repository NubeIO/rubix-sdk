function parseTaskDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }

  return new Date(dateStr);
}

function formatAustraliaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
    day: parts.find((part) => part.type === 'day')?.value ?? '',
  };
}

export function getDefaultTaskDueDate(referenceDate = new Date()): string {
  const targetDate = new Date(referenceDate);
  targetDate.setDate(targetDate.getDate() + 7);

  const { year, month, day } = formatAustraliaDateParts(targetDate);
  return `${year}-${month}-${day}`;
}

export function formatTaskDate(dateStr?: string): string {
  if (!dateStr) {
    return 'No due date';
  }

  const date = parseTaskDate(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
