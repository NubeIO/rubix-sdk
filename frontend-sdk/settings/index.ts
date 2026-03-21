/**
 * Settings SDK
 * Reusable settings components and hooks for Rubix plugins
 */

export { SchemaSelector, SchemaChanger } from './components/schema-selector';
export type {
  SchemaOption,
  SchemaSelectorProps,
  SchemaChangerProps,
} from './components/schema-selector';

export { useMultiSchema } from './hooks/use-multi-schema';
export type {
  SchemaInfo,
  MultiSchemaState,
  UseMultiSchemaOptions,
  UseMultiSchemaReturn,
} from './hooks/use-multi-schema';
