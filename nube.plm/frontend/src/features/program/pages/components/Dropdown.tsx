import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Dropdown({ value, placeholder, options, onChange, width }: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  width: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={`${width} h-7 text-xs border-input bg-transparent px-2 shrink-0`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value} className="text-xs capitalize">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
