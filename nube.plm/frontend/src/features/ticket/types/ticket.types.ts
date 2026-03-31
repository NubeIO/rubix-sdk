/**
 * Ticket type definitions
 */

export interface TicketSettings {
  ticketType?: 'task' | 'bug' | 'feature' | 'chore';
  ticketNumber?: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'blocked' | 'review' | 'completed' | 'cancelled';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee?: string;
  reporter?: string;
  reporterEmail?: string;
  createdDate?: string;
  dueDate?: string;
  completedDate?: string;
  resolution?: string;
  category?: string;
  tags?: string;
  estimatedHours?: number;
  actualHours?: number;
  blocked?: boolean;
  blockedReason?: string;
}

export interface Ticket {
  id: string;
  name: string;
  type: 'plm.ticket';
  parentId?: string;
  identity?: string[];
  settings?: TicketSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketInput {
  name: string;
  parentId: string; // Task ID or Project ID
  ticketType?: 'task' | 'bug' | 'feature' | 'chore';
  projectRef?: string; // Optional: Add projectRef for single-query access
  settings?: Partial<TicketSettings>;
}

export interface UpdateTicketInput {
  name?: string;
  settings?: Partial<TicketSettings>;
}
