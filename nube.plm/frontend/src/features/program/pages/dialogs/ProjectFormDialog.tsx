import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../constants';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Generate a URL-safe code from a name */
function autoCode(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}

export function ProjectFormDialog({ editProject, saving, onSave, onClose }: {
  editProject?: any;
  saving: boolean;
  onSave: (name: string, settings: Record<string, any>) => void;
  onClose: () => void;
}) {
  const isEdit = !!editProject;
  const [name, setName] = useState(editProject?.name || '');
  const [productCode, setProductCode] = useState(editProject?.settings?.productCode || '');
  const [category, setCategory] = useState(editProject?.settings?.category || 'hardware');
  const [status, setStatus] = useState(editProject?.settings?.status || 'Design');

  const canSubmit = name.trim().length > 0 && productCode.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave(name.trim(), { productCode: productCode.trim(), category, status, currency: 'USD' });
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && (!productCode || productCode === autoCode(name))) {
      setProductCode(autoCode(val));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Project Name *">
            <Input
              value={name}
              onChange={(e: any) => handleNameChange(e.target.value)}
              placeholder="e.g. Zone Controller Gen-02"
              autoFocus
            />
          </Field>
          <Field label="Product Code * (min 3 chars, unique)">
            <Input
              value={productCode}
              onChange={(e: any) => setProductCode(e.target.value)}
              placeholder="e.g. zc-gen02"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
