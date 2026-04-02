import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ──────────────────────────────────────────────────────────────────

interface TaskRow {
  name: string;
  status: string;
  priority: string;
  actualHours: number | null;
  estimatedHours: number | null;
  dueDate: string;
}

interface TicketRow {
  name: string;
  ticketType: string;
  status: string;
  priority: string;
  actualHours: number | null;
  estimatedHours: number | null;
}

interface EntryRow {
  date: string;
  ticketName: string;
  category: string;
  description: string;
  hours: number;
}

interface UserReportRow {
  name: string;
  taskCount: number;
  ticketCount: number;
  entryCount: number;
  filteredHours: number;
  tasks: TaskRow[];
  tickets: TicketRow[];
  entries: EntryRow[];
}

interface PDFReportOptions {
  title: string;
  dateRangeLabel: string;
  users: UserReportRow[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalHours: number;
    totalEntries: number;
    totalTasks: number;
    totalTickets: number;
  };
}

// ── Colors ─────────────────────────────────────────────────────────────────

const C = {
  bg: [255, 255, 255] as RGB,         // white page background
  surface: [11, 15, 26] as RGB,       // #0B0F1A - dark header/banner
  card: [248, 250, 252] as RGB,       // light card bg
  primary: [0, 174, 239] as RGB,      // #00AEEF
  secondary: [0, 229, 212] as RGB,    // #00E5D4
  text: [11, 15, 26] as RGB,          // dark text on light bg
  textLight: [255, 255, 255] as RGB,  // white text on dark bg
  textMuted: [100, 116, 139] as RGB,  // slate-500
  border: [226, 232, 240] as RGB,     // slate-200
  altRow: [248, 250, 252] as RGB,     // slate-50
};
type RGB = [number, number, number];

// ── Main export ────────────────────────────────────────────────────────────

export function generateUsersReport(options: PDFReportOptions) {
  const { title, dateRangeLabel, users, stats } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 14;
  const cw = pw - m * 2;

  let y = 0;

  // ── Header (dark banner) ────────────────────────────────────────────
  doc.setFillColor(...C.surface);
  doc.rect(0, 0, pw, 32, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(0, 32, pw, 1, 'F');

  doc.setTextColor(...C.textLight);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, m, 16);
  doc.setTextColor(176, 184, 197);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(dateRangeLabel, m, 26);
  const nowStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated: ${nowStr}`, pw - m, 26, { align: 'right' });
  y = 42;

  // ── Summary cards ───────────────────────────────────────────────────
  const boxW = (cw - 12) / 4;
  const summaryBoxes = [
    { label: 'ACTIVE USERS', value: `${stats.activeUsers} / ${stats.totalUsers}`, accent: C.primary },
    { label: 'TOTAL HOURS', value: `${stats.totalHours.toFixed(1)}h`, accent: C.secondary },
    { label: 'TASKS', value: String(stats.totalTasks), accent: C.primary },
    { label: 'TICKETS', value: String(stats.totalTickets), accent: C.secondary },
  ];
  summaryBoxes.forEach((box, i) => {
    const bx = m + i * (boxW + 4);
    doc.setFillColor(...C.card);
    doc.roundedRect(bx, y, boxW, 20, 2, 2, 'F');
    doc.setFillColor(...box.accent);
    doc.rect(bx, y + 2, 1.5, 16, 'F');
    doc.setTextColor(...C.textMuted);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(box.label, bx + 6, y + 7);
    doc.setTextColor(...C.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, bx + 6, y + 16);
  });
  y += 28;

  // ── Users overview table ────────────────────────────────────────────
  sectionTitle(doc, 'Users Overview', m, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: m, right: m },
    head: [['User', 'Tasks', 'Tickets', 'Time Entries', 'Hours']],
    body: [
      ...users.map((u) => [
        u.name,
        String(u.taskCount),
        String(u.ticketCount),
        String(u.entryCount),
        u.filteredHours > 0 ? `${u.filteredHours.toFixed(1)}h` : '-',
      ]),
      [
        boldCell('TOTAL'), boldCell(String(stats.totalTasks)), boldCell(String(stats.totalTickets)),
        boldCell(String(stats.totalEntries)), boldCell(`${stats.totalHours.toFixed(1)}h`),
      ],
    ],
    ...lightTable(),
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 24 },
    },
  });
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 6;

  // ── Per-user detail pages ───────────────────────────────────────────
  for (const user of users) {
    const hasContent = user.tasks.length > 0 || user.tickets.length > 0 || user.entries.length > 0;
    if (!hasContent) continue;

    doc.addPage();
    y = m;

    // User header banner
    doc.setFillColor(...C.surface);
    doc.rect(0, 0, pw, 22 + m, 'F');
    doc.setFillColor(...C.primary);
    doc.rect(0, 22 + m, pw, 1, 'F');
    doc.setTextColor(...C.textLight);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(user.name, m, y + 1);
    doc.setTextColor(176, 184, 197);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const userSummary = [
      `${user.taskCount} tasks`,
      `${user.ticketCount} tickets`,
      `${user.filteredHours.toFixed(1)}h logged`,
    ].join('   |   ');
    doc.text(userSummary, m, y + 8);
    y += 18;

    // ── User's Tasks ────────────────────────────────────────────────
    if (user.tasks.length > 0) {
      sectionTitle(doc, `Assigned Tasks (${user.tasks.length})`, m, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Task', 'Status', 'Priority', 'Due Date', 'Hours']],
        body: user.tasks.map((t) => [
          t.name,
          t.status,
          t.priority,
          t.dueDate ? shortDate(t.dueDate) : '-',
          formatHoursFraction(t.actualHours, t.estimatedHours),
        ]),
        ...lightTable(),
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 24 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { halign: 'right', cellWidth: 24 },
        },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── User's Tickets ──────────────────────────────────────────────
    if (user.tickets.length > 0) {
      if (y > ph - 40) { doc.addPage(); y = m; }

      sectionTitle(doc, `Assigned Tickets (${user.tickets.length})`, m, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Ticket', 'Type', 'Status', 'Priority', 'Est.', 'Actual']],
        body: user.tickets.map((t) => [
          t.name,
          t.ticketType || '-',
          t.status,
          t.priority,
          t.estimatedHours != null ? `${t.estimatedHours}h` : '-',
          t.actualHours != null ? `${t.actualHours}h` : '-',
        ]),
        ...lightTable(),
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { halign: 'right', cellWidth: 16 },
          5: { halign: 'right', cellWidth: 16 },
        },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 6;
    }

    // ── User's Time Entries ─────────────────────────────────────────
    if (user.entries.length > 0) {
      if (y > ph - 40) { doc.addPage(); y = m; }

      sectionTitle(doc, `Time Entries (${user.entries.length} — ${user.filteredHours.toFixed(1)}h)`, m, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Date', 'Ticket', 'Category', 'Description', 'Hours']],
        body: [
          ...user.entries.map((e) => [
            e.date ? shortDate(e.date) : '-',
            e.ticketName,
            e.category || '-',
            truncate(e.description, 45),
            String(e.hours),
          ]),
          [
            { content: '', colSpan: 4, styles: {} },
            boldCell(`${user.filteredHours.toFixed(1)}h`),
          ],
        ],
        ...lightTableMuted(),
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 22 },
          3: { cellWidth: 50 },
          4: { halign: 'right', cellWidth: 16 },
        },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // ── Footer on every page ────────────────────────────────────────────
  addFooters(doc, m, pw);

  // ── Save ────────────────────────────────────────────────────────────
  doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setTextColor(...C.primary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(text, x, y);
  const tw = doc.getTextWidth(text);
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  doc.line(x, y + 1.5, x + tw, y + 1.5);
}

function lightTable() {
  return {
    headStyles: {
      fillColor: C.surface,
      textColor: C.textLight,
      fontSize: 7.5,
      fontStyle: 'bold' as const,
    },
    bodyStyles: {
      fillColor: C.bg,
      textColor: C.text,
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: C.altRow,
    },
    styles: {
      lineColor: C.border,
      lineWidth: 0.2,
    },
  };
}

function lightTableMuted() {
  return {
    headStyles: {
      fillColor: C.card,
      textColor: C.text,
      fontSize: 7,
      fontStyle: 'bold' as const,
    },
    bodyStyles: {
      fillColor: C.bg,
      textColor: C.text,
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: C.altRow,
    },
    styles: {
      lineColor: C.border,
      lineWidth: 0.2,
    },
  };
}

function boldCell(content: string) {
  return { content, styles: { fontStyle: 'bold' as const, textColor: C.primary } };
}

function addFooters(doc: jsPDF, m: number, pw: number) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(m, pageH - 12, pw - m, pageH - 12);
    doc.setTextColor(...C.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Nube iO — PLM Users Report', m, pageH - 7);
    doc.text(`Page ${i} of ${total}`, pw - m, pageH - 7, { align: 'right' });
  }
}

function shortDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(s: string, max: number): string {
  if (!s) return '-';
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

function formatHoursFraction(actual: number | null, estimated: number | null): string {
  const a = actual ?? 0;
  if (estimated && estimated > 0) return `${a} / ${estimated}h`;
  return a > 0 ? `${a}h` : '-';
}
