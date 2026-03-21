/**
 * useMultiSchema Hook
 * Generic hook for managing multi-schema settings state
 * Plugins can use this to implement schema selection logic
 */

import { useState, useCallback } from 'react';

export interface SchemaInfo {
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
}

export interface MultiSchemaState {
  schemas: SchemaInfo[];
  selectedSchema: string | null;
  supportsMultiple: boolean;
  isSelecting: boolean;
}

export interface UseMultiSchemaOptions {
  schemas: SchemaInfo[];
  defaultSchema?: string;
  onSchemaChange?: (schemaName: string) => void;
}

export interface UseMultiSchemaReturn {
  // State
  selectedSchema: string | null;
  isSelecting: boolean;
  availableSchemas: SchemaInfo[];
  supportsMultiple: boolean;
  currentSchemaInfo: SchemaInfo | undefined;

  // Actions
  selectSchema: (name: string) => void;
  startSelection: () => void;
  cancelSelection: () => void;
  resetToDefault: () => void;
}

export function useMultiSchema({
  schemas,
  defaultSchema,
  onSchemaChange,
}: UseMultiSchemaOptions): UseMultiSchemaReturn {
  const supportsMultiple = schemas.length > 1;
  const defaultSchemaName =
    defaultSchema || schemas.find((s) => s.isDefault)?.name || schemas[0]?.name;

  const [selectedSchema, setSelectedSchema] = useState<string | null>(
    defaultSchemaName || null
  );
  const [isSelecting, setIsSelecting] = useState(!selectedSchema);

  const selectSchema = useCallback(
    (name: string) => {
      setSelectedSchema(name);
      setIsSelecting(false);
      onSchemaChange?.(name);
    },
    [onSchemaChange]
  );

  const startSelection = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const cancelSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const resetToDefault = useCallback(() => {
    if (defaultSchemaName) {
      selectSchema(defaultSchemaName);
    }
  }, [defaultSchemaName, selectSchema]);

  const currentSchemaInfo = schemas.find((s) => s.name === selectedSchema);

  return {
    selectedSchema,
    isSelecting,
    availableSchemas: schemas,
    supportsMultiple,
    currentSchemaInfo,
    selectSchema,
    startSelection,
    cancelSelection,
    resetToDefault,
  };
}
