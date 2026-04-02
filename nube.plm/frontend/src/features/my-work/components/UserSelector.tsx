// @ts-ignore - SDK types
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rubix-sdk/frontend/common/ui';
import type { CurrentUser } from '../hooks/useCurrentUser';

interface UserSelectorProps {
  users: CurrentUser[];
  currentUser: CurrentUser | null;
  loading: boolean;
  onSelect: (user: CurrentUser) => void;
}

export function UserSelector({ users, currentUser, loading, onSelect }: UserSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Logged in as:</span>
      <Select
        value={currentUser?.id || ''}
        onValueChange={(id) => {
          const user = users.find((u) => u.id === id);
          if (user) onSelect(user);
        }}
      >
        <SelectTrigger className="w-48 h-8 text-sm">
          <SelectValue placeholder="Select user..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
