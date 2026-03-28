/**
 * Comments Section - Display and manage comments on tasks/tickets
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Trash2, Send, Pencil, Check, X } from 'lucide-react';
import { listComments, addComment, editComment, deleteComment, type Comment } from '../utils/comment-helpers';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

interface CommentsSectionProps {
  nodeId: string;
  nodeType: 'task' | 'ticket';
  client: PluginClient;
  currentUserId: string;
  currentUserName?: string;
}

export function CommentsSection({
  nodeId,
  nodeType,
  client,
  currentUserId,
  currentUserName,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    void fetchComments();
  }, [nodeId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const result = await listComments(client, nodeId);
      setComments(result);
    } catch (error) {
      console.error('[CommentsSection] Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      await addComment(client, nodeId, {
        text: newComment,
        userId: currentUserId,
        userName: currentUserName || currentUserId,
      });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('[CommentsSection] Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await editComment(client, nodeId, { id: commentId, text: editText });
      setEditingId(null);
      setEditText('');
      await fetchComments();
    } catch (error) {
      console.error('[CommentsSection] Failed to edit comment:', error);
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(client, nodeId, commentId);
      await fetchComments();
    } catch (error) {
      console.error('[CommentsSection] Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        <div className="flex gap-2">
          <Textarea
            placeholder={`Add a comment to this ${nodeType}...`}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => {
              const isOwner = comment.userId === currentUserId;
              const isEditing = editingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {comment.userName || comment.userId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.lastUpdated && (
                        <span className="text-xs text-muted-foreground italic">
                          (edited)
                        </span>
                      )}
                    </div>
                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(comment)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Body: inline edit or text */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[70px] text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editText.trim() || editText === comment.text}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
