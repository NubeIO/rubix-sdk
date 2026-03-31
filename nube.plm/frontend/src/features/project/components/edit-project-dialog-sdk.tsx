/**
 * Edit Project Dialog (SDK Version)
 *
 * Uses MultiSettingsDialog from @rubix-sdk/frontend for schema-driven forms
 */

import { useMemo } from 'react';

// @ts-ignore - SDK types are resolved at build time
import { MultiSettingsDialog } from '@rubix-sdk/frontend/components/settings';

import { useProjectSchemas } from '@features/project/hooks/use-project-schemas';
import { Project } from '@features/project/types/project.types';
import type { UpdateProjectInput } from '@features/project/api/project-api';

export interface EditProjectDialogProps {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  project: Project; // Project being edited
  open: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, input: UpdateProjectInput) => Promise<void>;
}

export function EditProjectDialogSDK({
  orgId,
  deviceId,
  baseUrl,
  token,
  project,
  open,
  onClose,
  onSubmit,
}: EditProjectDialogProps) {
  // Fetch schemas from backend
  const { schemas, loading, error } = useProjectSchemas({
    orgId,
    deviceId,
    nodeId: project.id, // Use existing project ID
    baseUrl,
    token,
    enabled: open,
  });

  // Debug logging
  console.log('[EditProjectDialogSDK] State:', {
    open,
    projectId: project.id,
    projectName: project.name,
    projectType: project.settings?.projectType,
    loading,
    error,
    schemasCount: schemas.length,
    schemaNames: schemas.map(s => s.name),
    currentSettings: project.settings,
  });

  const handleSubmit = async (settings: Record<string, any>, schemaName: string) => {
    console.log('[EditProjectDialogSDK] Form submitted:', { settings, schemaName, projectId: project.id });

    try {
      // MultiSettingsDialog returns flat settings like { projectCode: "...", category: "..." }
      // UpdateProjectInput.settings expects the same flat structure
      // DO NOT wrap in another settings key - that causes infinite nesting!
      const input: UpdateProjectInput = {
        settings: {
          ...settings,
          projectType: schemaName,
        },
      };

      console.log('[EditProjectDialogSDK] Calling onSubmit with:', input);
      await onSubmit(project.id, input);

      console.log('[EditProjectDialogSDK] Submit successful, closing dialog');
      onClose();
    } catch (err) {
      console.error('[EditProjectDialogSDK] Submit FAILED:', err);
      // Don't throw - parent will handle the error and show alert
      // Just log it here for debugging
    }
  };

  // Memoize settings to prevent infinite re-renders in MultiSettingsDialog
  const { currentSchema, cleanSettings } = useMemo(() => {
    const schema = project.settings?.projectType || 'hardware';

    // Extract current settings, handling corrupted nested data from previous bugs
    let settings = project.settings || {};

    // If settings contains a nested "settings" key (from previous bug), unwrap it
    if (settings.settings && typeof settings.settings === 'object') {
      console.warn('[EditProjectDialogSDK] Detected nested settings, unwrapping...', settings);
      settings = settings.settings;
    }

    // Remove the "name" field if it exists (it's not a setting, it's the node name)
    const { name: _unused, ...clean } = settings;

    return {
      currentSchema: schema,
      cleanSettings: clean,
    };
  }, [project.settings]);

  // IMPORTANT: Never return null when open=true! This prevents mount/unmount crashes.
  // Only return null when dialog is actually closed
  if (!open) {
    return null;
  }

  // When open, ALWAYS render something - even during loading or error
  // This keeps the component mounted and prevents white screen crashes

  console.log('[EditProjectDialogSDK] Rendering:', {
    loading,
    error: error?.message,
    schemasCount: schemas.length,
    open,
  });

  // If we don't have schemas yet, show dialog anyway (it might handle it gracefully)
  // or the loading state will be visible
  return (
    <MultiSettingsDialog
      open={open}
      onOpenChange={onClose}
      title="Edit Project"
      description={`Editing: ${project.name}`}
      schemas={schemas}
      defaultSchema={currentSchema}
      currentSettings={cleanSettings}
      onSubmit={handleSubmit}
    />
  );
}
