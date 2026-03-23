/**
 * Custom Enum Builder Component
 * Allows users to create and manage custom enum definitions for the organization
 */


import { Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSupervisorDeviceId } from '@/contexts/supervisor-device-context';
import { useOptionalDeviceRouting } from '@/lib/device-routing';
import { rasClient } from '@/lib/ras-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnumState {
  value: number;
  key: string;
  label: string;
  description?: string;
}

interface CustomEnum {
  id: string;
  name: string;
  description?: string;
  states: EnumState[];
}

interface CustomEnumBuilderProps {
  orgId: string;
  deviceId: string;
  customEnums: CustomEnum[];
  onSave: (enums: CustomEnum[]) => Promise<void>;
  isSaving?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomEnumBuilder({
  orgId,
  deviceId,
  customEnums,
  onSave,
  isSaving = false
}: CustomEnumBuilderProps) {
  const [enums, setEnums] = useState<CustomEnum[]>(customEnums);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const routing = useOptionalDeviceRouting();
  const { supervisorDeviceId } = useSupervisorDeviceId();
  const forOrgSettings = routing?.forOrgSettings || supervisorDeviceId;

  // Draft state for new/edited enum
  const [draftEnum, setDraftEnum] = useState<CustomEnum>({
    id: `${orgId}.`,
    name: '',
    description: '',
    states: [{ value: 0, key: '', label: '', description: '' }]
  });

  const handleAddEnum = () => {
    setDraftEnum({
      id: `${orgId}.`,
      name: '',
      description: '',
      states: [{ value: 0, key: '', label: '', description: '' }]
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEditEnum = (enumDef: CustomEnum) => {
    setDraftEnum({ ...enumDef });
    setEditingId(enumDef.id);
    setIsAdding(false);
  };

  const handleSaveEnum = () => {
    // Validation
    if (!draftEnum.id.startsWith(`${orgId}.`)) {
      toast.error(`Enum ID must start with "${orgId}."`);
      return;
    }
    if (!draftEnum.name.trim()) {
      toast.error('Enum name is required');
      return;
    }
    if (draftEnum.states.length === 0) {
      toast.error('At least one state is required');
      return;
    }
    for (const state of draftEnum.states) {
      if (!state.key.trim() || !state.label.trim()) {
        toast.error('All states must have a key and label');
        return;
      }
    }

    if (isAdding) {
      // Check for duplicate ID
      if (enums.some((e) => e.id === draftEnum.id)) {
        toast.error('An enum with this ID already exists');
        return;
      }
      setEnums([...enums, draftEnum]);
    } else if (editingId) {
      setEnums(enums.map((e) => (e.id === editingId ? draftEnum : e)));
    }

    setIsAdding(false);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDeleteEnum = (enumId: string) => {
    if (confirm(`Delete enum "${enumId}"?`)) {
      setEnums(enums.filter((e) => e.id !== enumId));
    }
  };

  const handleAddState = () => {
    const maxValue = Math.max(...draftEnum.states.map((s) => s.value), -1);
    setDraftEnum({
      ...draftEnum,
      states: [
        ...draftEnum.states,
        { value: maxValue + 1, key: '', label: '', description: '' }
      ]
    });
  };

  const handleRemoveState = (index: number) => {
    if (draftEnum.states.length === 1) {
      toast.error('Cannot remove the last state');
      return;
    }
    setDraftEnum({
      ...draftEnum,
      states: draftEnum.states.filter((_, i) => i !== index)
    });
  };

  const handleUpdateState = (index: number, field: keyof EnumState, value: any) => {
    const newStates = [...draftEnum.states];
    newStates[index] = { ...newStates[index], [field]: value };
    setDraftEnum({ ...draftEnum, states: newStates });
  };

  const handleSaveAll = async () => {
    try {
      await onSave(enums);
      toast.success('Custom enums saved');
    } catch (error) {
      console.error('Failed to save custom enums:', error);
      toast.error('Failed to save custom enums');
    }
  };

  const handleRefresh = async () => {
    try {
      const data = await rasClient.orgSettings.get({ orgId, deviceId: forOrgSettings });
      toast.success(`Loaded ${data.customEnums?.length || 0} custom enums`);
    } catch (error) {
      console.error('[DEBUG] Failed to refresh:', error);
      toast.error('Failed to refresh: ' + String(error));
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header with Add button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Custom Enums</h2>
          <p className='text-sm text-muted-foreground'>
            Create custom enumeration types that can be reused across the organization
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleRefresh}>
            Refresh
          </Button>
          <Button onClick={handleAddEnum} disabled={isAdding || editingId !== null}>
            <Plus className='mr-2 h-4 w-4' />
            Add Enum
          </Button>
        </div>
      </div>

      {/* Enum List */}
      {enums.map((enumDef) => (
        <Card key={enumDef.id}>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle className='text-base'>{enumDef.name}</CardTitle>
                <CardDescription className='text-xs'>{enumDef.id}</CardDescription>
                {enumDef.description && (
                  <p className='text-sm text-muted-foreground mt-1'>{enumDef.description}</p>
                )}
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => handleEditEnum(enumDef)}
                  disabled={isAdding || editingId !== null}
                >
                  <Edit2 className='h-4 w-4' />
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => handleDeleteEnum(enumDef.id)}
                  disabled={isAdding || editingId !== null}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-muted-foreground'>States:</p>
              {enumDef.states.map((state) => (
                <div key={state.value} className='flex items-center gap-3 text-sm'>
                  <span className='font-mono text-xs w-8'>{state.value}</span>
                  <span className='text-muted-foreground w-20'>{state.key}</span>
                  <span>{state.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className='border-primary'>
          <CardHeader>
            <CardTitle>{isAdding ? 'Add' : 'Edit'} Custom Enum</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Enum ID and Name */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='enum-id'>
                  ID <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='enum-id'
                  value={draftEnum.id}
                  onChange={(e) => setDraftEnum({ ...draftEnum, id: e.target.value })}
                  placeholder={`${orgId}.pumpMode`}
                />
                <p className='text-xs text-muted-foreground'>Must start with "{orgId}."</p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='enum-name'>
                  Name <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='enum-name'
                  value={draftEnum.name}
                  onChange={(e) => setDraftEnum({ ...draftEnum, name: e.target.value })}
                  placeholder='Pump Mode'
                />
              </div>
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='enum-description'>Description</Label>
              <Input
                id='enum-description'
                value={draftEnum.description || ''}
                onChange={(e) => setDraftEnum({ ...draftEnum, description: e.target.value })}
                placeholder='Custom pump operating modes'
              />
            </div>

            <Separator />

            {/* States */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label>States</Label>
                <Button type='button' size='sm' variant='outline' onClick={handleAddState}>
                  <Plus className='mr-1 h-3 w-3' />
                  Add State
                </Button>
              </div>

              {draftEnum.states.map((state, index) => (
                <div key={index} className='grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-start'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Value</Label>
                    <Input
                      type='number'
                      value={state.value}
                      onChange={(e) =>
                        handleUpdateState(index, 'value', parseInt(e.target.value) || 0)
                      }
                      className='h-9'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Key *</Label>
                    <Input
                      value={state.key}
                      onChange={(e) => handleUpdateState(index, 'key', e.target.value)}
                      placeholder='off'
                      className='h-9'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>Label *</Label>
                    <Input
                      value={state.label}
                      onChange={(e) => handleUpdateState(index, 'label', e.target.value)}
                      placeholder='Off'
                      className='h-9'
                    />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveState(index)}
                    className='mt-6'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-2 pt-4'>
              <Button variant='outline' onClick={handleCancelEdit}>
                <X className='mr-2 h-4 w-4' />
                Cancel
              </Button>
              <Button onClick={handleSaveEnum}>
                <Save className='mr-2 h-4 w-4' />
                {isAdding ? 'Add Enum' : 'Update Enum'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save All Button */}
      {enums.length > 0 && !isAdding && !editingId && (
        <>
          <Separator />
          <div className='flex justify-end'>
            <Button onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save All Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
