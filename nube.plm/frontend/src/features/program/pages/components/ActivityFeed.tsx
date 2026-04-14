import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ActivityEntry {
  id: string;
  name: string;
  settings?: {
    text?: string;
    type?: string;
    author?: string;
    [key: string]: any;
  };
  createdAt?: string;
}

interface ActivityFeedProps {
  taskId: string;
  client: any;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}

export function ActivityFeed({ taskId, client }: ActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const result = await client.queryNodes({
        filter: `type is "core.note" and parent.id is "${taskId}"`,
      });
      const nodes = Array.isArray(result) ? result : (result as any).nodes || [];
      setEntries(nodes.sort((a: any, b: any) => {
        const ta = new Date(b.createdAt || 0).getTime();
        const tb = new Date(a.createdAt || 0).getTime();
        return ta - tb;
      }));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [client, taskId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const addNote = async () => {
    if (!newNote.trim() || saving) return;
    setSaving(true);
    try {
      await client.createNode(taskId, {
        type: 'core.note',
        name: newNote.trim().slice(0, 80),
        identity: ['note'],
        settings: { text: newNote.trim(), type: 'comment' },
      });
      setNewNote('');
      await loadEntries();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-14 py-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Activity</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-sm">{entries.length}</Badge>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  <span className="text-foreground/80 flex-1">{entry.settings?.text || entry.name}</span>
                  <span className="text-muted-foreground/50 text-[11px] shrink-0">{timeAgo(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Input
              value={newNote}
              onChange={(e: any) => setNewNote(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && addNote()}
              placeholder="Add a note..."
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs px-3"
              disabled={!newNote.trim() || saving}
              onClick={addNote}
            >
              {saving ? '...' : 'Add'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
