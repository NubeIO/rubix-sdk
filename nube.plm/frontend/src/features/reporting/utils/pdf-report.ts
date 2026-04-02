import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Task } from '@features/task/types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { TimeEntry } from '@features/time/types/time-entry.types';
import type { Product } from '@features/product/types/product.types';
import type { ManufacturingRun, ManufacturingUnit } from '@features/production-run/types/production-run.types';
import type { ReportingStats } from '../hooks/useReportingData';

interface ReportingPDFOptions {
  dateRangeLabel: string;
  products: Product[];
  tasks: Task[];
  tickets: Ticket[];
  timeEntries: (TimeEntry & { productName: string; ticketName: string })[];
  manufacturingRuns: (ManufacturingRun & { productName: string })[];
  units: ManufacturingUnit[];
  stats: ReportingStats;
}

type RGB = [number, number, number];

const C = {
  bg: [255, 255, 255] as RGB,
  surface: [11, 15, 26] as RGB,       // #0B0F1A - header/banner
  card: [248, 250, 252] as RGB,        // light card bg
  primary: [0, 174, 239] as RGB,       // #00AEEF
  secondary: [0, 229, 212] as RGB,     // #00E5D4
  text: [11, 15, 26] as RGB,           // dark text on light bg
  textLight: [255, 255, 255] as RGB,   // white text on dark bg
  textMuted: [100, 116, 139] as RGB,   // slate-500
  border: [226, 232, 240] as RGB,      // slate-200
  altRow: [248, 250, 252] as RGB,      // slate-50
};

export function generateReportingPDF(options: ReportingPDFOptions) {
  const { dateRangeLabel, products, tasks, tickets, timeEntries, manufacturingRuns, units, stats } = options;
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
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporting Dashboard', m, 14);
  doc.setTextColor(176, 184, 197); // #B0B8C5
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const productNames = products.map((p) => p.name).join(', ');
  doc.text(truncate(productNames, 60), m, 22);
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`${dateRangeLabel}  |  ${now}`, pw - m, 22, { align: 'right' });
  y = 42;

  // ── Summary cards ───────────────────────────────────────────────────
  const boxW = (cw - 12) / 4;
  const boxes = [
    { label: 'PRODUCTS', value: String(stats.totalProducts), accent: C.primary },
    { label: 'TASKS', value: `${stats.totalTasks} (${stats.tasksCompleted} done)`, accent: C.secondary },
    { label: 'TICKETS', value: `${stats.ticketsOpen} open / ${stats.ticketsClosed} closed`, accent: C.primary },
    { label: 'HOURS LOGGED', value: `${stats.totalHours.toFixed(1)}h`, accent: C.secondary },
  ];

  boxes.forEach((box, i) => {
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
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, bx + 6, y + 16);
  });
  y += 28;

  // ── Tasks table ─────────────────────────────────────────────────────
  if (tasks.length > 0) {
    y = sectionHeading(doc, 'Tasks', m, cw, y);
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    autoTable(doc, {
      startY: y,
      margin: { left: m, right: m },
      head: [['Product', 'Task', 'Status', 'Priority', 'Assignee', 'Hours']],
      body: tasks.map((t) => [
        productMap.get(t.parentId || '') || '-',
        t.name,
        t.settings?.status || 'pending',
        t.settings?.priority || '-',
        t.settings?.assignee || '-',
        t.settings?.actualHours != null ? `${t.settings.actualHours}h` : '-',
      ]),
      ...lightTable(),
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Tickets table ───────────────────────────────────────────────────
  if (tickets.length > 0) {
    if (y > ph - 50) { doc.addPage(); y = m; }
    y = sectionHeading(doc, 'Tickets', m, cw, y);

    const statusCounts = countBy(tickets, (t) => t.settings?.status || 'pending');
    const typeCounts = countBy(tickets, (t) => t.settings?.ticketType || 'task');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    const summaryParts = [
      ...Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`),
      '  |  ',
      ...Object.entries(typeCounts).map(([k, v]) => `${k}: ${v}`),
    ];
    doc.text(summaryParts.join('   '), m, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: m, right: m },
      head: [['Ticket', 'Type', 'Status', 'Priority', 'Est. Hours', 'Actual Hours']],
      body: tickets.map((t) => [
        t.name,
        t.settings?.ticketType || '-',
        t.settings?.status || 'pending',
        t.settings?.priority || '-',
        t.settings?.estimatedHours != null ? String(t.settings.estimatedHours) : '-',
        t.settings?.actualHours != null ? String(t.settings.actualHours) : '-',
      ]),
      ...lightTable(),
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Manufacturing Runs ──────────────────────────────────────────────
  if (manufacturingRuns.length > 0) {
    if (y > ph - 50) { doc.addPage(); y = m; }
    y = sectionHeading(doc, 'Manufacturing Runs', m, cw, y);

    // Group units by run
    const unitsByRun = new Map<string, ManufacturingUnit[]>();
    for (const unit of units) {
      const runId = unit.parentId || '';
      if (!unitsByRun.has(runId)) unitsByRun.set(runId, []);
      unitsByRun.get(runId)!.push(unit);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: m, right: m },
      head: [['Product', 'Run', 'Status', 'Target', 'Produced', 'QA Fail', 'Progress']],
      body: manufacturingRuns.map((run) => {
        const runUnits = unitsByRun.get(run.id) || [];
        const produced = runUnits.filter((u) =>
          u.settings?.status && u.settings.status !== 'rma'
        ).length;
        const qaFail = runUnits.filter((u) =>
          u.settings?.qaStatus === 'fail' || u.settings?.status === 'qa-fail'
        ).length;
        const target = Number(run.settings?.targetQuantity || 0);
        const pct = target > 0 ? Math.round((produced / target) * 100) : 0;
        return [
          run.productName,
          run.settings?.runNumber || run.name,
          run.settings?.status || 'planned',
          String(target),
          String(produced),
          String(qaFail),
          `${pct}%`,
        ];
      }),
      ...lightTable(),
      columnStyles: {
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'right', cellWidth: 18 },
      },
    });
    // @ts-ignore
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Time entries ────────────────────────────────────────────────────
  if (timeEntries.length > 0) {
    if (y > ph - 50) { doc.addPage(); y = m; }
    y = sectionHeading(doc, 'Time Entries', m, cw, y);

    const byUser = new Map<string, typeof timeEntries>();
    for (const e of timeEntries) {
      const user = e.settings?.userName || e.settings?.userId || 'Unknown';
      if (!byUser.has(user)) byUser.set(user, []);
      byUser.get(user)!.push(e);
    }

    for (const [userName, entries] of byUser) {
      if (y > ph - 40) { doc.addPage(); y = m; }
      const userHours = entries.reduce((s, e) => s + (e.settings?.hours || 0), 0);

      // User sub-heading
      doc.setFillColor(...C.card);
      doc.rect(m, y, cw, 6, 'F');
      doc.setFillColor(...C.primary);
      doc.rect(m, y, 2, 6, 'F');
      doc.setTextColor(...C.text);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${userName}  —  ${userHours.toFixed(1)}h (${entries.length} entries)`, m + 5, y + 4);
      y += 8;

      autoTable(doc, {
        startY: y,
        margin: { left: m, right: m },
        head: [['Date', 'Product', 'Ticket', 'Category', 'Hours']],
        body: entries
          .sort((a, b) => (b.settings?.date || '').localeCompare(a.settings?.date || ''))
          .map((e) => [
            e.settings?.date ? shortDate(e.settings.date) : '-',
            e.productName,
            e.ticketName,
            e.settings?.category || '-',
            String(e.settings?.hours || 0),
          ]),
        ...lightTableMuted(),
        columnStyles: {
          0: { cellWidth: 22 },
          4: { halign: 'right', cellWidth: 16 },
        },
      });
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 4;
    }

    const totalH = timeEntries.reduce((s, e) => s + (e.settings?.hours || 0), 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(
      `Total: ${totalH.toFixed(1)}h across ${timeEntries.length} entries`,
      pw - m, y + 2,
      { align: 'right' },
    );
  }

  // ── Footers ─────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(m, ph - 12, pw - m, ph - 12);
    doc.setTextColor(...C.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Nube iO — Reporting Dashboard', m, ph - 7);
    doc.text(`Page ${i} of ${totalPages}`, pw - m, ph - 7, { align: 'right' });
  }

  doc.save(`reporting-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────────────────────

function sectionHeading(doc: jsPDF, title: string, m: number, cw: number, y: number): number {
  doc.setFillColor(...C.surface);
  doc.rect(m, y, cw, 7, 'F');
  doc.setFillColor(...C.primary);
  doc.rect(m, y, 2, 7, 'F');
  doc.setTextColor(...C.textLight);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, m + 5, y + 5);
  return y + 10;
}

function lightTable() {
  return {
    headStyles: {
      fillColor: C.surface,
      textColor: C.textLight,
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

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    result[k] = (result[k] || 0) + 1;
  }
  return result;
}

function shortDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}
