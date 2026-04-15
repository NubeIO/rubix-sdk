import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// @ts-ignore
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import { STATUSES } from '../constants';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function TicketFormDialog({ taskName, editTicket, client, saving, onSave, onClose }: {
  taskName: string;
  editTicket?: any;
  client: any;
  saving: boolean;
  onSave: (data: { name: string; settings: Record<string, any>; assignees: SelectedUser[] }) => void;
  onClose: () => void;
}) {
  const isEdit = !!editTicket;
  const [name, setName] = useState(editTicket?.name || '');
  const [ticketType, setTicketType] = useState(editTicket?.settings?.ticketType || 'task');
  const [status, setStatus] = useState(editTicket?.settings?.status || 'pending');
  const [priority, setPriority] = useState(editTicket?.settings?.priority || 'Medium');
  const [assignees, setAssignees] = useState<SelectedUser[]>([]);

  // Load existing assignees when editing
  useEffect(() => {
    if (editTicket?.id && client) {
      client.getAssignedUsers(editTicket.id).then((refs: any[]) => {
        if (refs?.length) {
          setAssignees(refs.map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })));
        }
      }).catch(() => {});
    }
  }, [editTicket?.id, client]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ticket' : 'New Ticket'}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Under: {taskName}</p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Ticket Name *">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Review IO spacing" autoFocus />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['task', 'bug', 'feature', 'chore'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Assignee(s)">
            <UserPicker client={client} value={assignees} onChange={setAssignees} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), settings: { ticketType, status, priority }, assignees }); }}
              disabled={!name.trim() || saving}
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
