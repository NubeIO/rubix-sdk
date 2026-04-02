"use client"

import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Checkbox } from "./checkbox"
import { cn } from "../utils/utils"

interface UserPickerUser {
  id: string;
  name: string;
}

export interface SelectedUser {
  userId: string;
  userName: string;
}

export interface UserPickerProps {
  client: any;
  value: SelectedUser[];
  onChange: (users: SelectedUser[]) => void;
  disabled?: boolean;
}

export function UserPicker({
  client,
  value,
  onChange,
  disabled,
}: UserPickerProps) {
  const [users, setUsers] = useState<UserPickerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .listUsers()
      .then((result: any[]) => {
        if (cancelled) return;
        setUsers(
          result.map((u: any) => ({
            id: u.id,
            name: u.name || u.settings?.email || u.id,
          }))
        );
      })
      .catch((err: any) => {
        console.error("[UserPicker] Failed to fetch users:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [client]);

  const selectedIds = new Set(value.map((u) => u.userId));

  const toggle = (user: UserPickerUser) => {
    if (selectedIds.has(user.id)) {
      onChange(value.filter((u) => u.userId !== user.id));
    } else {
      onChange([...value, { userId: user.id, userName: user.name }]);
    }
  };

  const displayText = value.length === 0
    ? "Unassigned"
    : value.map((u) => u.userName).join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || loading}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            value.length === 0 && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {loading ? "Loading users..." : displayText}
          </span>
          <svg className="h-4 w-4 opacity-50 shrink-0 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        {users.length === 0 && !loading ? (
          <div className="text-sm text-muted-foreground text-center py-2">No users found</div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-auto">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={selectedIds.has(user.id)}
                  onCheckedChange={() => toggle(user)}
                />
                {user.name}
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
