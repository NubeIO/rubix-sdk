import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_UNIT_FORM_VALUES,
  UNIT_STATUSES,
  type ManufacturingRun,
  type ManufacturingUnit,
  type ManufacturingUnitSettings,
  type UnitFormValues,
} from '../types';

interface UnitFormProps {
  open: boolean;
  run: ManufacturingRun;
  unit?: ManufacturingUnit | null;
  onClose: () => void;
  onSubmit: (input: { name: string; settings: ManufacturingUnitSettings }) => Promise<void>;
}

export function UnitForm({ open, run, unit, onClose, onSubmit }: UnitFormProps) {
  const [values, setValues] = useState<UnitFormValues>(DEFAULT_UNIT_FORM_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!unit) {
      setValues({
        ...DEFAULT_UNIT_FORM_VALUES,
        manufactureDate: run.settings?.productionDate ? String(run.settings.productionDate) : '',
      });
      return;
    }

    setValues({
      serialNumber: String(unit.settings?.serialNumber || ''),
      assetType: String(unit.settings?.assetType || 'hardware-unit'),
      status: unit.settings?.status || 'produced',
      qaStatus: unit.settings?.qaStatus || 'pending',
      manufactureDate: String(unit.settings?.manufactureDate || run.settings?.productionDate || ''),
      notes: String(unit.settings?.notes || ''),
    });
  }, [run.settings?.productionDate, unit]);

  const updateField = <K extends keyof UnitFormValues>(field: K, value: UnitFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!values.serialNumber.trim()) {
      setError('Serial number is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        name: `Unit ${values.serialNumber.trim()}`,
        settings: {
          serialNumber: values.serialNumber.trim(),
          assetType: values.assetType.trim() || 'hardware-unit',
          hardwareRevision: String(run.settings?.hardwareVersion || ''),
          status: values.status,
          qaStatus: values.qaStatus,
          manufactureDate: values.manufactureDate || undefined,
          productionRunNumber: run.settings?.runNumber,
          notes: values.notes.trim() || undefined,
        },
      });
      onClose();
    } catch (submitError) {
      console.error('[UnitForm] Failed to save unit:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Failed to save unit');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
          <DialogDescription>
            Units are stored as `core.asset` nodes under the selected manufacturing run.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit-serial-number">Serial Number</Label>
              <Input
                id="unit-serial-number"
                value={values.serialNumber}
                onChange={(event) => updateField('serialNumber', event.target.value)}
                placeholder="EC-C-1402"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-asset-type">Asset Type</Label>
              <Input
                id="unit-asset-type"
                value={values.assetType}
                onChange={(event) => updateField('assetType', event.target.value)}
                placeholder="edge-controller"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-status">Unit Status</Label>
              <select
                id="unit-status"
                value={values.status}
                onChange={(event) => updateField('status', event.target.value as UnitFormValues['status'])}
                disabled={isSaving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {UNIT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-qa-status">QA Status</Label>
              <select
                id="unit-qa-status"
                value={values.qaStatus}
                onChange={(event) => updateField('qaStatus', event.target.value as UnitFormValues['qaStatus'])}
                disabled={isSaving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending">pending</option>
                <option value="pass">pass</option>
                <option value="fail">fail</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="unit-manufacture-date">Manufacture Date</Label>
              <Input
                id="unit-manufacture-date"
                type="date"
                value={values.manufactureDate}
                onChange={(event) => updateField('manufactureDate', event.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="font-medium">Run Context</div>
            <div className="mt-1 text-muted-foreground">
              {run.settings?.runNumber || 'Run number pending backend generation'} • Hardware {run.settings?.hardwareVersion || 'n/a'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-notes">Notes</Label>
            <Textarea
              id="unit-notes"
              rows={4}
              value={values.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="QA findings, assembly notes, or shipment comments"
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (unit ? 'Saving...' : 'Creating...') : (unit ? 'Save Changes' : 'Add Unit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
