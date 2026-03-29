import type { Node } from '../../../../../frontend-sdk/ras/types';

export type ManufacturingRunStatus =
  | 'planned'
  | 'in-progress'
  | 'qa'
  | 'completed'
  | 'cancelled';

export interface ManufacturingRunSettings {
  runNumber?: string;
  hardwareVersion?: string;
  targetQuantity?: number;
  producedCount?: number;
  qaFailures?: number;
  facilityLocation?: string;
  status?: ManufacturingRunStatus;
  serialRangeStart?: string;
  serialRangeEnd?: string;
  productionDate?: string;
  batchNotes?: string;
  [key: string]: unknown;
}

export type ManufacturingRun = Node & {
  id: string;
  name: string;
  type: 'plm.manufacturing-run';
  settings?: ManufacturingRunSettings;
};

export type UnitStatus =
  | 'produced'
  | 'qa-pass'
  | 'qa-fail'
  | 'shipped'
  | 'installed'
  | 'rma';

export interface ManufacturingUnitSettings {
  serialNumber?: string;
  assetType?: string;
  hardwareRevision?: string;
  status?: UnitStatus;
  productionRunNumber?: string;
  manufactureDate?: string;
  qaDate?: string;
  qaStatus?: 'pass' | 'fail' | 'pending';
  firmwareVersion?: string;
  installDate?: string;
  warrantyUntil?: string;
  location?: string;
  notes?: string;
  [key: string]: unknown;
}

export type ManufacturingUnit = Node & {
  id: string;
  name: string;
  type: 'core.asset';
  settings?: ManufacturingUnitSettings;
};

export interface ManufacturingRunFormValues {
  name: string;
  hardwareVersion: string;
  targetQuantity: string;
  facilityLocation: string;
  status: ManufacturingRunStatus;
  productionDate: string;
  serialRangeStart: string;
  serialRangeEnd: string;
  batchNotes: string;
}

export interface UnitFormValues {
  serialNumber: string;
  assetType: string;
  status: UnitStatus;
  qaStatus: 'pass' | 'fail' | 'pending';
  manufactureDate: string;
  notes: string;
}

export const MANUFACTURING_RUN_STATUSES: ManufacturingRunStatus[] = [
  'planned',
  'in-progress',
  'qa',
  'completed',
  'cancelled',
];

export const UNIT_STATUSES: UnitStatus[] = [
  'produced',
  'qa-pass',
  'qa-fail',
  'shipped',
  'installed',
  'rma',
];

export const DEFAULT_MANUFACTURING_RUN_FORM_VALUES: ManufacturingRunFormValues = {
  name: '',
  hardwareVersion: '',
  targetQuantity: '',
  facilityLocation: '',
  status: 'planned',
  productionDate: '',
  serialRangeStart: '',
  serialRangeEnd: '',
  batchNotes: '',
};

export const DEFAULT_UNIT_FORM_VALUES: UnitFormValues = {
  serialNumber: '',
  assetType: 'hardware-unit',
  status: 'produced',
  qaStatus: 'pending',
  manufactureDate: '',
  notes: '',
};
