import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GATES } from '@shared/constants/gates';
import { IconColorPicker, DynamicIcon } from './IconColorPicker';

interface ProjectItemProps {
  product: any;
  isChecked: boolean;
  overallProgress: number;
  currentGate?: string;
  taskCount: number;
  onToggle: () => void;
  onRename: (name: string) => void;
  onChangeIcon: (icon: string) => void;
  onChangeColor: (color: string) => void;
}

export function ProjectItem({ product, isChecked, overallProgress, currentGate, taskCount, onToggle, onRename, onChangeIcon, onChangeColor }: ProjectItemProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(product.name || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const icon = product.settings?.icon || 'Box';
  const iconColor = product.settings?.iconColor || '#3b82f6';
  const curGate = currentGate ? GATES.find(g => g.id === currentGate) : null;

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== product.name) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div
      className={`w-full text-left px-3 py-2 transition
        ${isChecked ? 'bg-primary/8 border-l-3' : 'border-l-3 border-transparent hover:bg-muted/50 opacity-60'}`}
      style={isChecked ? { borderLeftColor: iconColor } : undefined}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0 cursor-pointer">
          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition`}
            style={isChecked ? { backgroundColor: iconColor, borderColor: iconColor } : undefined}
          >
            {isChecked && <span className="text-[8px] text-white leading-none">{'\u2713'}</span>}
          </div>
        </button>

        {/* Icon + color picker */}
        <IconColorPicker
          icon={icon}
          iconColor={iconColor}
          onChangeIcon={onChangeIcon}
          onChangeColor={onChangeColor}
        />

        {/* Name (editable on double-click) */}
        {editing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e: any) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e: any) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
            className="h-5 text-xs px-1 py-0 flex-1"
          />
        ) : (
          <button
            onDoubleClick={() => { setEditName(product.name || ''); setEditing(true); }}
            className="text-xs font-medium text-foreground truncate flex-1 text-left cursor-pointer"
            title="Double-click to rename"
          >
            {product.name || 'Unnamed'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 ml-5">
        <Progress value={overallProgress} className="flex-1 h-1" />
        <span className="text-[10px] text-muted-foreground">{overallProgress}%</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
        {curGate ? curGate.id.toUpperCase() : 'No gate'} &middot; {taskCount} task{taskCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
