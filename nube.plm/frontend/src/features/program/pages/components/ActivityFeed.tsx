import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X } from 'lucide-react';

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

/** Decode a JWT payload without verification. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

function getCurrentUser(client: any): { id: string; name: string } {
  const config = client.getConfig?.() || {};
  const claims = config.token ? decodeJwtPayload(config.token) : {};
  const id = (claims.email as string) || (claims.sub as string) || 'unknown';
  const name = (claims.name as string) || id;
  return { id, name };
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const currentUser = getCurrentUser(client);

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

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const addNote = async () => {
    if (!newNote.trim() || saving) return;
    setSaving(true);
    try {
      await client.createNode(taskId, {
        type: 'core.note',
        name: newNote.trim().slice(0, 80),
        identity: ['note'],
        settings: { text: newNote.trim(), type: 'comment', author: currentUser.name },
      });
      setNewNote('');
      await loadEntries();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: ActivityEntry) => {
    setEditingId(entry.id);
    setEditText(entry.settings?.text || entry.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setSaving(true);
    try {
      await client.updateNode(editingId, { name: editText.trim().slice(0, 80) });
      await client.updateNodeSettings(editingId, { text: editText.trim() });
      setEditingId(null);
      setEditText('');
      await loadEntries();
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    setSaving(true);
    try {
      await client.deleteNode(id);
      await loadEntries();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-2 space-y-1.5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Activity</span>
        {entries.length > 0 && (
          <span className="text-[10px] text-muted-foreground/60">{entries.length}</span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : (
        <div className="rounded-md border border-border/50 overflow-hidden">
          {/* Notes list */}
          {entries.length > 0 && (
            <div className="max-h-[180px] overflow-y-auto divide-y divide-border/30">
              {entries.map(entry => {
                const author = entry.settings?.author || 'Unknown';
                const isEditing = editingId === entry.id;

                return (
                  <div key={entry.id} className="group/note px-3 py-2 hover:bg-muted/30 transition">
                    <div className="flex items-start gap-2.5">
                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-semibold text-muted-foreground">
                          {getInitials(author)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Author + timestamp row */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-medium text-foreground">{author}</span>
                          <span className="text-[10px] text-muted-foreground/50">{timeAgo(entry.createdAt)}</span>
                        </div>

                        {/* Note text or edit input */}
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              ref={editRef}
                              value={editText}
                              onChange={(e: any) => setEditText(e.target.value)}
                              onKeyDown={(e: any) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className="h-6 text-xs flex-1"
                            />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-emerald-500" onClick={saveEdit} disabled={saving} title="Save">
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={cancelEdit} title="Cancel">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/80">{entry.settings?.text || entry.name}</span>
                        )}
                      </div>

                      {/* Actions — only visible on hover, hidden during edit */}
                      {!isEditing && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/note:opacity-100 transition shrink-0 mt-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => startEdit(entry)}
                            title="Edit note"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNote(entry.id)}
                            title="Delete note"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add note input — inside the card as the bottom row */}
          <div className={`flex items-center gap-1.5 px-2 py-1.5 bg-muted/20 ${entries.length > 0 ? 'border-t border-border/40' : ''}`}>
            <Input
              value={newNote}
              onChange={(e: any) => setNewNote(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && addNote()}
              placeholder="Add a note..."
              className="h-7 text-xs flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-6 text-[11px] px-2.5"
              disabled={!newNote.trim() || saving}
              onClick={addNote}
            >
              {saving ? '...' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
