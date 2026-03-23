/**
 * Node Settings Form - Reusable Component
 * Extracted from NodeSettingsModal to be used in both modal and sidebar
 */


import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Palette } from 'lucide-react';
import * as React from 'react';
import { toast } from '@/lib/toast';

import { sidebarKeys } from '@/actions/sidebar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { IconPicker } from '@/features/node/components/views/graphics/graphics-builder/components/widget-config/icon-picker';
import { nodeKeys } from '@/features/node/hooks';
import { rasClient } from '@/lib/ras-client';
import {
  CompactFieldTemplate,
  CompactObjectFieldTemplate,
  CustomArrayFieldTemplate,
  CustomDescriptionField,
  customWidgets
} from '@/lib/rjsf-theme';

// No-op validator for RIOT nodes that bypasses validation
const noOpValidator = {
  validateFormData: () => ({ errors: [], errorSchema: {} }),
  toErrorList: () => [],
  isValid: () => true,
  rawValidation: () => ({ errors: [], validationError: null })
};

interface NodeSettingsFormProps {
  nodeId: string;
  parentId?: string;
  nodeType?: string;
  orgId: string;
  deviceId: string;
  onSuccess?: () => void;
  /** If true, renders compact version for sidebar */
  compact?: boolean;
}

// Schema selection step state
type ViewStep = 'selecting' | 'configuring';

interface SchemaInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
}

export function NodeSettingsForm({
  nodeId,
  nodeType,
  orgId,
  deviceId,
  parentId,
  onSuccess,
  compact = false
}: NodeSettingsFormProps) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [schema, setSchema] = React.useState<RJSFSchema | null>(null);
  const [uiSchema, setUiSchema] = React.useState<Record<string, any>>({});
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [icon, setIcon] = React.useState<string>('');
  const [iconColor, setIconColor] = React.useState<string>('');
  const queryClient = useQueryClient();

  // Multiple schemas support
  const [viewStep, setViewStep] = React.useState<ViewStep>('selecting');
  const [availableSchemas, setAvailableSchemas] = React.useState<SchemaInfo[]>([]);
  const [selectedSchemaName, setSelectedSchemaName] = React.useState<string>('');
  const [supportsMultiple, setSupportsMultiple] = React.useState(false);

  // Check if this is a RIOT flow node
  const isRiotFlowNode =
    nodeType?.startsWith('riot.') &&
    !nodeType?.startsWith('riot.network') &&
    !nodeType?.startsWith('riot.device');

  // Track if we've already fetched to prevent double calls in React Strict Mode
  const hasFetchedRef = React.useRef(false);
  const fetchKeyRef = React.useRef<string>('');

  // Detect which schema to use based on existing settings
  const detectSchemaFromSettings = async (
    schemas: SchemaInfo[]
  ): Promise<string> => {
    try {
      // Get current settings to detect schema type
      const response = await rasClient.nodes.settings({
        orgId,
        deviceId,
        id: nodeId
      });

      const data = response;
      const settings = (data.settings || {}) as Record<string, any>;

      // Detection logic for monitor.remote node types
      if (nodeType === 'monitor.remote') {
        // If has URL field, it's likely http/https
        if (settings.url) {
          return 'http';
        }
        // If has host but no URL, it's likely ping
        if (settings.host && !settings.url) {
          return 'ping';
        }
        // If has deviceId or rubix-specific fields, it's rubix-device
        if (settings.deviceId || settings.rubixDeviceUrl) {
          return 'rubix-device';
        }
      }

      // Default to the default schema
      const defaultSchema = schemas.find((s) => s.isDefault) || schemas[0];
      return defaultSchema?.name || 'default';
    } catch (err) {
      // If detection fails, use default
      const defaultSchema = schemas.find((s) => s.isDefault) || schemas[0];
      return defaultSchema?.name || 'default';
    }
  };

  // Fetch available schemas list first
  React.useEffect(() => {
    if (!nodeId) return;

    // Create a unique key for this fetch
    const fetchKey = `${orgId}-${deviceId}-${nodeId}`;

    // Skip if already fetched for this combination
    if (hasFetchedRef.current && fetchKeyRef.current === fetchKey) {
      return;
    }

    const fetchSchemasList = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Check if node supports multiple schemas
        const schemasListResponse = await rasClient.nodes.settingsSchemasList({
          orgId,
          deviceId,
          id: nodeId
        });

        const data = schemasListResponse;
        const schemas = data.schemas || [];
        const supportsMultipleSchemas = data.supportsMultiple || false;

        setSupportsMultiple(supportsMultipleSchemas);
        setAvailableSchemas(schemas as SchemaInfo[]);

        // If node supports multiple schemas and has more than one option
        if (supportsMultipleSchemas && schemas.length > 1) {
          // Try to detect which schema to use based on existing settings
          const detectedSchemaName = await detectSchemaFromSettings(schemas);

          // If we have a valid detected schema, load it directly (skip selection)
          // If settings are empty (new node), show selection dialog
          const hasExistingSettings = await rasClient.nodes
            .settings({
              orgId,
              deviceId,
              id: nodeId
            })
            .then((res) => {
              const data = res;
              const settings = (data.settings || {}) as Record<string, any>;
              return Object.keys(settings).length > 1; // More than just 'name'
            })
            .catch(() => false);

          if (hasExistingSettings) {
            // Has existing settings - auto-select detected schema
            await loadSchemaByName(detectedSchemaName);
          } else {
            // New node - show selection dialog
            setViewStep('selecting');
            setLoading(false);
          }

          // Mark as fetched
          hasFetchedRef.current = true;
          fetchKeyRef.current = fetchKey;
        } else {
          // Single schema or doesn't support multiple - load default schema directly
          const defaultSchema =
            schemas.find((s: SchemaInfo) => s.isDefault) || schemas[0];
          const schemaName = defaultSchema?.name || 'default';
          await loadSchemaByName(schemaName);

          // Mark as fetched
          hasFetchedRef.current = true;
          fetchKeyRef.current = fetchKey;
        }
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to load schemas';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
      }
    };

    fetchSchemasList();
  }, [nodeId, orgId, deviceId]);

  // Load a specific schema by name
  const loadSchemaByName = async (schemaName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await rasClient.nodes.settingsSchemaByName({
        orgId,
        deviceId,
        id: nodeId,
        schemaName
      });

      const data = response;
      const receivedSchema = data.schema || {};
      const currentSettings = data.settings || {};

      // Extract UI hints from schema and build uiSchema
      const extractedUiSchema: Record<string, any> = {};

      if (receivedSchema.uiSchema) {
        Object.assign(extractedUiSchema, receivedSchema.uiSchema);
      }

      if (receivedSchema.properties) {
        Object.keys(receivedSchema.properties).forEach((key) => {
          const prop = (receivedSchema.properties as any)[key];
          if (prop['ui:widget']) {
            if (!extractedUiSchema[key]) {
              extractedUiSchema[key] = {};
            }
            extractedUiSchema[key]['ui:widget'] = prop['ui:widget'];
          }
        });
      }

      // Remove uiSchema from the schema object
      const cleanedSchema = { ...receivedSchema };
      delete (cleanedSchema as any).uiSchema;

      setSchema(cleanedSchema as RJSFSchema);
      setUiSchema(extractedUiSchema);
      setFormData(currentSettings as Record<string, any>);
      setIcon((currentSettings as any)?.icon);
      setIconColor((currentSettings as any)?.iconColor || '');
      setSelectedSchemaName(schemaName);
      setViewStep('configuring');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to load schema';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { formData?: Record<string, any> }) => {
    const newSettings = data.formData || {};
    setSaving(true);
    setError(null);

    try {
      const settingsWithIconAndColor = {
        ...newSettings,
        icon: icon || undefined,
        iconColor: iconColor || undefined
      };

      await rasClient.nodes.settingsPatch({
        orgId,
        deviceId,
        id: nodeId,
        body: settingsWithIconAndColor
      });

      toast.success('Node settings updated successfully');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: sidebarKeys.list(orgId)
      });
      queryClient.invalidateQueries({
        queryKey: sidebarKeys.children(orgId)
      });
      queryClient.invalidateQueries({
        queryKey: nodeKeys.detailWithSettingsSchema(orgId, deviceId, nodeId)
      });
      queryClient.invalidateQueries({
        queryKey: nodeKeys.detail(orgId, deviceId, nodeId)
      });
      queryClient.invalidateQueries({
        queryKey: nodeKeys.detailSettings(orgId, deviceId, nodeId)
      });

      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: nodeKeys.children(orgId, deviceId, parentId)
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: nodeKeys.list(orgId, deviceId)
        });
      }
      queryClient.invalidateQueries({
        queryKey: sidebarKeys.breadcrumbs(orgId, deviceId, nodeId)
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save settings';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleError = (errors: any) => {
    const errorMessages = errors
      .map((err: any) => {
        const field = err.property || err.name || 'Unknown field';
        const message = err.message || 'Validation failed';
        return `${field}: ${message}`;
      })
      .join(', ');

    if (isRiotFlowNode) {
      toast.warning(
        'Schema validation failed, but saving anyway (RIOT external schema)'
      );
      handleSubmit({ formData });
    } else {
      toast.error(`Validation errors: ${errorMessages}`);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='text-muted-foreground mr-2 h-6 w-6 animate-spin' />
        <div className='text-muted-foreground text-sm'>Loading schema...</div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className='bg-destructive/15 text-destructive rounded-md p-3 text-sm'>
        {error}
      </div>
    );
  }

  // Step 1: Show schema selection if multiple schemas are available
  if (viewStep === 'selecting' && supportsMultiple && availableSchemas.length > 1) {
    return (
      <div className='space-y-4'>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>Select Configuration Type</h3>
          <p className='text-muted-foreground text-sm'>
            This node supports different configuration types. Choose the one that matches your use case.
          </p>
        </div>

        <div className='space-y-2'>
          {availableSchemas.map((schemaInfo) => (
            <button
              key={schemaInfo.name}
              onClick={() => loadSchemaByName(schemaInfo.name)}
              className='hover:border-primary hover:bg-accent w-full rounded-lg border-2 border-border p-4 text-left transition-colors'
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h4 className='font-semibold'>{schemaInfo.displayName}</h4>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {schemaInfo.description}
                  </p>
                </div>
                {schemaInfo.isDefault && (
                  <span className='bg-primary/10 text-primary ml-2 rounded-full px-2 py-1 text-xs font-medium'>
                    Default
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Show settings form for selected schema
  if (!schema) {
    return (
      <div className='text-muted-foreground py-8 text-center text-sm'>
        No settings available for this node
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Schema selector if applicable */}
      {supportsMultiple && availableSchemas.length > 1 && (
        <div className='flex items-center justify-between gap-3 pb-3 border-b'>
          <div className='flex-1'>
            <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Configuration Type
            </div>
            <div className='mt-0.5 font-semibold text-sm'>
              {availableSchemas.find((s) => s.name === selectedSchemaName)?.displayName || 'Default Settings'}
            </div>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setViewStep('selecting')}
            className='text-xs h-8'
          >
            Change Type
          </Button>
        </div>
      )}

      {/* Schema-based Settings Form */}
      <Form
        schema={schema}
        formData={formData}
        validator={isRiotFlowNode ? (noOpValidator as any) : validator}
        onChange={(e) => setFormData(e.formData || {})}
        onSubmit={handleSubmit}
        onError={handleError}
        liveValidate={false}
        showErrorList={isRiotFlowNode ? false : 'top'}
        noHtml5Validate={true}
        widgets={customWidgets}
        templates={{
          FieldTemplate: CompactFieldTemplate,
          ObjectFieldTemplate: CompactObjectFieldTemplate,
          DescriptionFieldTemplate: CustomDescriptionField,
          ArrayFieldTemplate: CustomArrayFieldTemplate
        }}
        uiSchema={{
          ...uiSchema,
          'ui:submitButtonOptions': {
            norender: true
          }
        }}
      >
        <div className='mt-4 flex justify-between items-center gap-2'>
          {/* Icon/Color Button */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type='button'
                className='group relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 hover:shadow-md'
                title='Customize icon and color'
              >
                {/* Icon Preview */}
                <div
                  className='flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 group-hover:scale-110 transition-transform duration-200'
                  style={{
                    backgroundColor: iconColor ? `${iconColor}15` : undefined,
                  }}
                >
                  {(() => {
                    if (!icon) {
                      return <Palette className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />;
                    }

                    const IconComponent = (LucideIcons as any)[icon];
                    if (IconComponent) {
                      return <IconComponent className='h-4 w-4' style={{ color: iconColor || 'currentColor' }} />;
                    }

                    return <Palette className='h-4 w-4 text-muted-foreground' />;
                  })()}
                </div>

                {/* Color Preview Dot */}
                {iconColor && (
                  <div
                    className='w-3 h-3 rounded-full border-2 border-background shadow-sm'
                    style={{ backgroundColor: iconColor }}
                  />
                )}

                {/* Expand Indicator */}
                <svg
                  className='w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-80 p-4' align='start' sideOffset={5}>
              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium mb-2 block'>Display Icon</label>
                  <p className='text-xs text-muted-foreground mb-3'>
                    Choose an icon for the sidebar and breadcrumbs
                  </p>
                  <IconPicker
                    value={icon}
                    onChange={setIcon}
                    placeholder='Select an icon...'
                  />
                </div>

                <div className='border-t pt-4'>
                  <label className='text-sm font-medium mb-2 block'>Icon Color</label>
                  <p className='text-xs text-muted-foreground mb-3'>
                    Select a preset or choose custom color
                  </p>

                  {/* Color Grid - 9 presets + color picker */}
                  <div className='grid grid-cols-5 gap-2 mb-3'>
                    {[
                      '#ef4444', // red
                      '#f97316', // orange
                      '#f59e0b', // amber
                      '#eab308', // yellow
                      '#84cc16', // lime
                      '#22c55e', // green
                      '#14b8a6', // teal
                      '#3b82f6', // blue
                      '#8b5cf6', // violet
                    ].map((color) => (
                      <button
                        key={color}
                        type='button'
                        onClick={() => setIconColor(color)}
                        className='w-full h-10 rounded-md border-2 transition-all hover:scale-110'
                        style={{
                          backgroundColor: color,
                          borderColor: iconColor === color ? '#fff' : 'transparent',
                          boxShadow: iconColor === color ? '0 0 0 2px currentColor' : 'none'
                        }}
                        title={color}
                      />
                    ))}

                    {/* 10th option: Full color picker */}
                    <label
                      htmlFor='icon-color-picker'
                      className='w-full h-10 rounded-md border-2 border-border cursor-pointer transition-all hover:scale-110 flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 relative overflow-hidden'
                      title='Custom color'
                    >
                      <div className='absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center'>
                        <svg className='w-5 h-5 text-foreground' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' />
                        </svg>
                      </div>
                      <input
                        type='color'
                        id='icon-color-picker'
                        value={iconColor || '#000000'}
                        onChange={(e) => setIconColor(e.target.value)}
                        className='sr-only'
                      />
                    </label>
                  </div>

                  {/* Hex Input and Clear */}
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      placeholder='#fb923c'
                      className='flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'
                    />
                    {iconColor && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setIconColor('')}
                        className='h-10 px-3'
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Save Button */}
          <Button type='submit' disabled={saving}>
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </Form>

      {error && (
        <div className='bg-destructive/15 text-destructive mt-2 rounded-md p-3 text-xs'>
          {error}
        </div>
      )}
    </div>
  );
}
