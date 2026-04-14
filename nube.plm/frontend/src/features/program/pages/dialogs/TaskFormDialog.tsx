import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// @ts-ignore
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import { GATES, type GateId } from '@shared/constants/gates';
import { CATEGORIES } from '@shared/constants/categories';
import { getTaskGate, setTaskGate } from '@shared/utils/gate-helpers';
import { STATUSES } from '../constants';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function TaskFormDialog({ defaultGate, editTask, client, saving, projects, defaultProductId, onSave, onClose }: {
  defaultGate?: GateId;
  editTask?: any;
  client: any;
  saving: boolean;
  projects?: { id: string; name: string }[];
  defaultProductId?: string;
  onSave: (data: { name: string; settings: Record<string, any>; assignees: SelectedUser[]; productId?: string }) => void;
  onClose: () => void;
}) {
  const isEdit = !!editTask;
  const [name, setName] = useState(editTask?.name || '');
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId || '');
  const [category, setCategory] = useState<string>(editTask?.settings?.category || '');
  const [gate, setGate] = useState<string>(editTask ? (getTaskGate(editTask.settings?.tags) || '') : (defaultGate || ''));
  const [status, setStatus] = useState(editTask?.settings?.status || 'pending');
  const [priority, setPriority] = useState(editTask?.settings?.priority || 'Medium');
  const [assignees, setAssignees] = useState<SelectedUser[]>([]);
  const [startDate, setStartDate] = useState(editTask?.settings?.startDate || '');
  const [dueDate, setDueDate] = useState(editTask?.settings?.dueDate || '');
  const [progress, setProgress] = useState(String(editTask?.settings?.progress || 0));
  const [autoProgress, setAutoProgress] = useState<boolean>(editTask?.settings?.autoProgress ?? false);

  useEffect(() => {
    if (editTask?.id) {
      client.getAssignedUsers(editTask.id).then((refs: any[]) => {
        if (refs?.length) {
          setAssignees(refs.map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })));
        }
      }).catch(() => {});
    }
  }, [editTask?.id, client]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (!isEdit && projects && projects.length > 1 && !selectedProductId) return;
    const tags = gate ? setTaskGate(editTask?.settings?.tags, gate as GateId) : (editTask?.settings?.tags || '');
    onSave({
      name: name.trim(),
      settings: { category, tags, status, priority, startDate, dueDate, progress: Number(progress) || 0, autoProgress },
      assignees,
      productId: selectedProductId || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {!isEdit && projects && projects.length > 1 && (
            <Field label="Project *">
              <Select value={selectedProductId || undefined} onValueChange={setSelectedProductId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Task Name *">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Finalise PCB layout" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gate">
              <Select value={gate || undefined} onValueChange={setGate}>
                <SelectTrigger><SelectValue placeholder="Select gate" /></SelectTrigger>
                <SelectContent>{GATES.map(g => <SelectItem key={g.id} value={g.id}>{g.id.toUpperCase()} &mdash; {g.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
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
            <Field label="Assignee(s)">
              <UserPicker client={client} value={assignees} onChange={setAssignees} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start Date"><Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} /></Field>
            <Field label="Due Date"><Input type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} /></Field>
            <Field label="Progress (%)">
              {autoProgress ? (
                <div className="h-9 flex items-center text-xs text-muted-foreground italic">Auto from tickets</div>
              ) : (
                <Input type="number" min="0" max="100" value={progress} onChange={(e: any) => setProgress(e.target.value)} />
              )}
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={autoProgress} onCheckedChange={setAutoProgress} />
            <div>
              <Label className="text-xs">Auto-calculate progress</Label>
              <p className="text-[10px] text-muted-foreground">Derive progress from completed tickets</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || saving || (!isEdit && !!projects && projects.length > 1 && !selectedProductId)}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
