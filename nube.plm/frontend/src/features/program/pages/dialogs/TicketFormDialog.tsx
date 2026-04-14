import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { STATUSES } from '../constants';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function TicketFormDialog({ taskName, saving, onSave, onClose }: {
  taskName: string;
  saving: boolean;
  onSave: (data: { name: string; settings: Record<string, any> }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [ticketType, setTicketType] = useState('task');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('Medium');

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>New Ticket</DialogTitle>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), settings: { ticketType, status, priority } }); }}
              disabled={!name.trim() || saving}
            >
              {saving ? 'Saving...' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
