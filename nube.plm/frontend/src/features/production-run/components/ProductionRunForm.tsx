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
  DEFAULT_MANUFACTURING_RUN_FORM_VALUES,
  MANUFACTURING_RUN_STATUSES,
  type ManufacturingRun,
  type ManufacturingRunFormValues,
  type ManufacturingRunSettings,
} from '../types';

interface ProductionRunFormProps {
  open: boolean;
  run?: ManufacturingRun | null;
  onClose: () => void;
  onSubmit: (input: { name: string; settings: ManufacturingRunSettings }) => Promise<void>;
}

export function ProductionRunForm({
  open,
  run,
  onClose,
  onSubmit,
}: ProductionRunFormProps) {
  const [values, setValues] = useState<ManufacturingRunFormValues>(DEFAULT_MANUFACTURING_RUN_FORM_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!run) {
      setValues(DEFAULT_MANUFACTURING_RUN_FORM_VALUES);
      return;
    }

    setValues({
      name: run.name || '',
      hardwareVersion: String(run.settings?.hardwareVersion || ''),
      targetQuantity: String(run.settings?.targetQuantity || ''),
      facilityLocation: String(run.settings?.facilityLocation || ''),
      status: run.settings?.status || 'planned',
      productionDate: String(run.settings?.productionDate || ''),
      productionFinishDate: String(run.settings?.productionFinishDate || ''),
      serialRangeStart: String(run.settings?.serialRangeStart || ''),
      serialRangeEnd: String(run.settings?.serialRangeEnd || ''),
      batchNotes: String(run.settings?.batchNotes || ''),
    });
  }, [run]);

  const updateField = <K extends keyof ManufacturingRunFormValues>(field: K, value: ManufacturingRunFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError('Run name is required');
      return;
    }

    if (!values.hardwareVersion.trim()) {
      setError('Hardware version is required');
      return;
    }

    const parsedTarget = Number(values.targetQuantity);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 1) {
      setError('Target quantity must be at least 1');
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        name: values.name.trim(),
        settings: {
          hardwareVersion: values.hardwareVersion.trim(),
          targetQuantity: parsedTarget,
          facilityLocation: values.facilityLocation.trim() || undefined,
          status: values.status,
          productionDate: values.productionDate || undefined,
          productionFinishDate: values.productionFinishDate || undefined,
          serialRangeStart: values.serialRangeStart.trim() || undefined,
          serialRangeEnd: values.serialRangeEnd.trim() || undefined,
          batchNotes: values.batchNotes.trim() || undefined,
        },
      });
      onClose();
    } catch (submitError) {
      console.error('[ProductionRunForm] Failed to save run:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Failed to save manufacturing run');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-3xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{run ? 'Edit Manufacturing Run' : 'Create Manufacturing Run'}</DialogTitle>
          <DialogDescription>
            Capture the production batch details and keep unit tracking tied to the product.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="run-name">Run Name</Label>
              <Input
                id="run-name"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Rev C Factory Run"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-hardware-version">Hardware Version</Label>
              <Input
                id="run-hardware-version"
                value={values.hardwareVersion}
                onChange={(event) => updateField('hardwareVersion', event.target.value)}
                placeholder="rev-c"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-target-quantity">Target Quantity</Label>
              <Input
                id="run-target-quantity"
                type="number"
                min={1}
                value={values.targetQuantity}
                onChange={(event) => updateField('targetQuantity', event.target.value)}
                placeholder="100"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-status">Status</Label>
              <select
                id="run-status"
                value={values.status}
                onChange={(event) => updateField('status', event.target.value as ManufacturingRunFormValues['status'])}
                disabled={isSaving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MANUFACTURING_RUN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-facility-location">Facility</Label>
              <Input
                id="run-facility-location"
                value={values.facilityLocation}
                onChange={(event) => updateField('facilityLocation', event.target.value)}
                placeholder="Factory A"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-production-date">Production Date</Label>
              <Input
                id="run-production-date"
                type="date"
                value={values.productionDate}
                onChange={(event) => updateField('productionDate', event.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-production-finish-date">Production Finish Date</Label>
              <Input
                id="run-production-finish-date"
                type="date"
                value={values.productionFinishDate}
                onChange={(event) => updateField('productionFinishDate', event.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-serial-start">Serial Range Start</Label>
              <Input
                id="run-serial-start"
                value={values.serialRangeStart}
                onChange={(event) => updateField('serialRangeStart', event.target.value)}
                placeholder="EC-C-1401"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-serial-end">Serial Range End</Label>
              <Input
                id="run-serial-end"
                value={values.serialRangeEnd}
                onChange={(event) => updateField('serialRangeEnd', event.target.value)}
                placeholder="EC-C-1500"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="run-batch-notes">Batch Notes</Label>
            <Textarea
              id="run-batch-notes"
              rows={4}
              value={values.batchNotes}
              onChange={(event) => updateField('batchNotes', event.target.value)}
              placeholder="Build notes, QA reminders, or facility instructions"
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
              {isSaving ? (run ? 'Saving...' : 'Creating...') : (run ? 'Save Changes' : 'Create Run')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
