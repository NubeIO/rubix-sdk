/**
 * Time Entry type definitions
 */

export interface TimeEntrySettings {
  date: string;
  hours: number;
  userId: string;
  userName?: string;
  description?: string;
  category?: string;
}

export interface TimeEntry {
  id: string;
  name: string;
  type: 'core.entry';
  parentId: string; // Required - ticket ID
  identity?: string[];
  settings?: TimeEntrySettings;
  createdAt?: string;
}

export interface CreateTimeEntryInput {
  name: string;
  parentId: string; // Ticket ID
  date: string;
  hours: number;
  userId: string;
  userName?: string;
  description?: string;
  category?: string;
}

export interface UpdateTimeEntryInput {
  name?: string;
  settings?: Partial<TimeEntrySettings>;
}
