/**
 * Schema Selector Component
 * Generic, reusable component for selecting from multiple settings schemas
 * Used by plugins to implement multi-schema settings support
 */

import * as React from 'react';
import { Button } from '../../common/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../common/ui/card';

export interface SchemaOption {
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
}

export interface SchemaSelectorProps {
  schemas: SchemaOption[];
  selectedSchema?: string;
  onSelect: (schemaName: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function SchemaSelector({
  schemas,
  selectedSchema,
  onSelect,
  title = 'Select Configuration Type',
  description = 'Choose the type that matches your use case.',
  className,
}: SchemaSelectorProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="space-y-3">
          {schemas.map((schema) => (
            <Card
              key={schema.name}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedSchema === schema.name
                  ? 'border-primary bg-muted/30'
                  : ''
              }`}
              onClick={() => onSelect(schema.name)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {schema.displayName}
                  {schema.isDefault && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Default)
                    </span>
                  )}
                </CardTitle>
                {schema.description && (
                  <CardDescription className="text-sm">
                    {schema.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface SchemaChangerProps {
  currentSchema: SchemaOption;
  onChangeRequest: () => void;
  label?: string;
  className?: string;
}

export function SchemaChanger({
  currentSchema,
  onChangeRequest,
  label = 'Configuration Type',
  className,
}: SchemaChangerProps) {
  return (
    <div
      className={`flex items-center justify-between border-b pb-3 ${className}`}
    >
      <div>
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="font-semibold">{currentSchema.displayName}</div>
      </div>
      <Button variant="outline" size="sm" onClick={onChangeRequest}>
        Change Type
      </Button>
    </div>
  );
}
