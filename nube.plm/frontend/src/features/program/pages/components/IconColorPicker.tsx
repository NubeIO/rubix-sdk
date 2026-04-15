import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

const ICON_LIST = [
  'Box', 'Cpu', 'CircuitBoard', 'Cog', 'Database', 'Folder',
  'HardDrive', 'Layers', 'Monitor', 'Package', 'Server', 'Settings',
  'Smartphone', 'Wifi', 'Zap', 'Activity', 'BarChart3', 'Briefcase',
  'Building', 'Calendar', 'CheckCircle', 'Cloud', 'Code', 'FileText',
  'Flag', 'Globe', 'Heart', 'Home', 'Key', 'Lightbulb',
  'Lock', 'Mail', 'Map', 'Megaphone', 'Mic', 'Music',
  'PenTool', 'Rocket', 'Shield', 'Star', 'Tag', 'Target',
  'Thermometer', 'Tool', 'Truck', 'Users', 'Video', 'Wrench',
];

function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = (LucideIcons as any)[name] || (LucideIcons as any).Box;
  return <Icon className={className} style={style} />;
}

interface IconColorPickerProps {
  icon?: string;
  iconColor?: string;
  onChangeIcon: (icon: string) => void;
  onChangeColor: (color: string) => void;
}

export function IconColorPicker({ icon, iconColor, onChangeIcon, onChangeColor }: IconColorPickerProps) {
  const [search, setSearch] = useState('');
  const currentIcon = icon || 'Box';
  const currentColor = iconColor || '#3b82f6';

  const filteredIcons = search
    ? ICON_LIST.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : ICON_LIST;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-muted-foreground/30 rounded-md p-0.5 transition">
          <DynamicIcon name={currentIcon} className="h-4 w-4" style={{ color: currentColor }} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="start">
        {/* Color presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Color</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => onChangeColor(c)}
                className={`w-5 h-5 rounded-full cursor-pointer transition hover:scale-110
                  ${c === currentColor ? 'ring-2 ring-offset-1 ring-foreground/50' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Icon grid */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Icon</span>
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="h-6 text-[11px]"
          />
          <div className="grid grid-cols-8 gap-1 max-h-[120px] overflow-y-auto pt-1">
            {filteredIcons.map(name => (
              <button
                key={name}
                onClick={() => onChangeIcon(name)}
                className={`w-6 h-6 flex items-center justify-center rounded cursor-pointer transition hover:bg-accent
                  ${name === currentIcon ? 'bg-accent ring-1 ring-primary' : ''}`}
                title={name}
              >
                <DynamicIcon name={name} className="h-3.5 w-3.5" style={{ color: name === currentIcon ? currentColor : undefined }} />
              </button>
            ))}
          </div>
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center text-[11px] text-muted-foreground py-2">No icons found</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { DynamicIcon };
