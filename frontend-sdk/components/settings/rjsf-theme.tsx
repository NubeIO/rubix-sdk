/**
 * Custom RJSF Theme for shadcn/ui
 * Provides custom widgets and templates for react-jsonschema-form
 * Adapted from Rubix frontend for use in SDK/plugins
 */

import type {
  ArrayFieldTemplateProps,
  DescriptionFieldProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RegistryWidgetsType,
  WidgetProps
} from '@rjsf/utils';
import { Info, Plus } from 'lucide-react';

import { Checkbox } from '../../common/ui/checkbox';
import { Input } from '../../common/ui/input';
import { Label } from '../../common/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../common/ui/popover';
import { Textarea } from '../../common/ui/textarea';

// Custom Text Input Widget
function TextWidget(props: WidgetProps) {
  const {
    id,
    required,
    readonly,
    disabled,
    type,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema
  } = props;

  const _onChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value }
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  // Prefer explicit inputType from RJSF, then widget type, then schema.format
  const formatType =
    schema && typeof (schema as any).format === 'string'
      ? (schema as any).format
      : undefined;
  const normalizedFormat =
    formatType === 'uri'
      ? 'url'
      : formatType === 'email'
        ? 'email'
        : formatType === 'password'
          ? 'password'
          : undefined;

  const inputType =
    (options as any)?.inputType ||
    type ||
    normalizedFormat ||
    (schema.type === 'string' ? 'text' : `${schema.type}`);

  return (
    <Input
      id={id}
      type={inputType}
      value={value || value === 0 ? value : ''}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

// Custom Textarea Widget
function TextareaWidget(props: WidgetProps) {
  const {
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus
  } = props;

  const _onChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({
    target: { value }
  }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value }
  }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <Textarea
      id={id}
      value={value || ''}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

// Custom Checkbox Widget
function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    value,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus
  } = props;

  const _onChange = (checked: boolean) => onChange(checked);
  const _onBlur = () => onBlur(id, value);
  const _onFocus = () => onFocus(id, value);

  return (
    <Checkbox
      id={id}
      checked={typeof value === 'undefined' ? false : value}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onCheckedChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

// Custom Description Field Template (fixes HTML nesting warning)
export function CustomDescriptionField(props: DescriptionFieldProps) {
  const { id, description } = props;
  if (!description) {
    return null;
  }
  return (
    <div id={id} className='text-muted-foreground mb-2 text-sm'>
      {description}
    </div>
  );
}

// Custom Field Template (Original - Vertical Layout)
export function CustomFieldTemplate(props: FieldTemplateProps) {
  const { id, label, required, description, errors, help, children, schema } =
    props;

  // Don't render label for boolean fields (checkbox handles its own label)
  const isCheckbox = schema.type === 'boolean';

  // Don't render label/description for array fields (array template handles it)
  const isArray = schema.type === 'array';

  return (
    <div className='mb-4'>
      {!isCheckbox && !isArray && label && (
        <Label htmlFor={id} className='mb-2 block'>
          {label}
          {required && <span className='text-destructive ml-1'>*</span>}
        </Label>
      )}
      {!isArray && description && (
        <div className='text-muted-foreground mb-2 text-sm'>{description}</div>
      )}
      {children}
      {errors && <div className='text-destructive mt-1 text-sm'>{errors}</div>}
      {help && <div className='text-muted-foreground mt-1 text-sm'>{help}</div>}
    </div>
  );
}

// Compact Field Template - Side-by-side layout with info button
export function CompactFieldTemplate(props: FieldTemplateProps) {
  const { id, label, required, description, errors, help, children, schema } =
    props;

  // Don't render label for boolean fields (checkbox handles its own label)
  const isCheckbox = schema.type === 'boolean';

  // Don't render label/description for array fields (array template handles it)
  const isArray = schema.type === 'array';

  // Object fields are handled by ObjectFieldTemplate - don't duplicate label
  const isObject = schema.type === 'object';

  if (isArray || isObject) {
    // Let ArrayFieldTemplate and ObjectFieldTemplate handle these
    return <>{children}</>;
  }

  // Compact side-by-side layout for simple fields
  return (
    <div className='py-2 border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors'>
      <div className='flex items-center gap-3 px-1'>
        {/* Label with Info Button */}
        <div className='flex items-center gap-1.5 min-w-[180px] flex-shrink-0'>
          {label && (
            <Label htmlFor={id} className='text-sm font-medium'>
              {label}
              {required && <span className='text-destructive ml-0.5'>*</span>}
            </Label>
          )}
          {description && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground transition-colors flex-shrink-0'
                  title='More information'
                >
                  <Info className='h-3.5 w-3.5' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-80 text-sm' side='right' align='start'>
                <div className='space-y-2'>
                  <div className='font-medium'>{label}</div>
                  <div className='text-muted-foreground text-xs leading-relaxed'>{description}</div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Input Column */}
        <div className='flex-1 min-w-0'>
          {children}
          {errors && <div className='text-destructive mt-1 text-xs'>{errors}</div>}
          {help && <div className='text-muted-foreground mt-1 text-xs'>{help}</div>}
        </div>
      </div>
    </div>
  );
}

// Compact Object Field Template - Clean section headers without repetition
export function CompactObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { title, description, properties, required, schema, idSchema } = props;

  // Check if this is the root object (no title means it's the root schema object)
  const isRootObject = !title || idSchema?.$id === 'root';

  if (isRootObject) {
    // Root object - just render properties without extra wrapper
    return (
      <div className='space-y-0'>
        {properties.map((prop) => (
          <div key={prop.name}>{prop.content}</div>
        ))}
      </div>
    );
  }

  // Nested object - render as a section with header
  return (
    <div className='mb-6 space-y-3'>
      {title && (
        <div className='border-b pb-2'>
          <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
            {title}
          </h3>
          {description && (
            <p className='text-muted-foreground text-xs mt-1'>{description}</p>
          )}
        </div>
      )}
      <div className='space-y-0 pl-0'>
        {properties.map((prop) => (
          <div key={prop.name}>{prop.content}</div>
        ))}
      </div>
    </div>
  );
}

// Custom Select Widget (for enums)
function SelectWidget(props: WidgetProps) {
  const {
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onBlur,
    onFocus
  } = props;

  const { enumOptions, enumDisabled } = options;

  const _onChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLSelectElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({
    target: { value }
  }: React.FocusEvent<HTMLSelectElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value }
  }: React.FocusEvent<HTMLSelectElement>) => onFocus(id, value);

  // Handle array values (e.g., supportedOS field in software products)
  // Convert array to string for display in select (arrays should use different widget)
  const displayValue = typeof value === 'undefined'
    ? ''
    : Array.isArray(value)
      ? value.join(', ')
      : value;

  return (
    <select
      id={id}
      className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
      value={displayValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    >
      {(enumOptions as any)?.map(({ value, label }: any, i: number) => {
        const disabled =
          enumDisabled && (enumDisabled as any).indexOf(value) !== -1;
        return (
          <option key={i} value={value} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

// Simple Array Field Template - minimal implementation that works
export function CustomArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { items, canAdd, onAddClick, title, schema } = props;


  return (
    <div className='mb-4'>
      {/* Title and description */}
      {title && <Label className='mb-2 block'>{title}</Label>}
      {schema.description && (
        <div className='text-muted-foreground mb-2 text-sm'>
          {schema.description}
        </div>
      )}

      {/* Array items - each item is a pre-rendered React element */}
      <div className='space-y-2'>
        {items.map((item: any, idx) => (
          <div key={idx}>{item.children}</div>
        ))}
      </div>

      {/* Add button */}
      {canAdd && (
        <button
          type='button'
          onClick={onAddClick}
          className='border-input bg-background hover:bg-accent hover:text-accent-foreground mt-2 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm'
        >
          <Plus className='h-4 w-4' />
          Add Item
        </button>
      )}
    </div>
  );
}

// Export custom widgets
export const customWidgets: RegistryWidgetsType = {
  TextWidget: TextWidget,
  // Map common format-specific widgets to our styled TextWidget
  EmailWidget: TextWidget,
  URLWidget: TextWidget,
  UriWidget: TextWidget,
  PasswordWidget: TextWidget,
  TextareaWidget: TextareaWidget,
  CheckboxWidget: CheckboxWidget,
  SelectWidget: SelectWidget
};
