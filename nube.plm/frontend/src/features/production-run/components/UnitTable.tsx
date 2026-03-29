import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ManufacturingUnit } from '../types';

interface UnitTableProps {
  units: ManufacturingUnit[];
  onEdit: (unit: ManufacturingUnit) => void;
  onDelete: (unit: ManufacturingUnit) => void;
}

function formatDate(value?: string) {
  if (!value) {
    return 'Not set';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

export function UnitTable({ units, onEdit, onDelete }: UnitTableProps) {
  if (units.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h3 className="text-lg font-semibold">No units yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the first serialized unit to start tracking output, QA, and shipment readiness.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Serial</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>QA</TableHead>
          <TableHead>Hardware</TableHead>
          <TableHead>Manufactured</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {units.map((unit) => (
          <TableRow key={unit.id}>
            <TableCell>
              <div className="font-medium">{unit.settings?.serialNumber || unit.name}</div>
              <div className="text-xs text-muted-foreground">{unit.settings?.assetType || 'hardware-unit'}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {unit.settings?.status || 'produced'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">
                {unit.settings?.qaStatus || 'pending'}
              </Badge>
            </TableCell>
            <TableCell>{unit.settings?.hardwareRevision || 'n/a'}</TableCell>
            <TableCell>{formatDate(unit.settings?.manufactureDate)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(unit)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(unit)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
