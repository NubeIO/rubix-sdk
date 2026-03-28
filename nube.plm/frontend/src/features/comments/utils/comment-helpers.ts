/**
 * Comment helper functions
 *
 * Comments are stored in a dedicated core.note child node.
 * The note is created alongside the task and bound via two refs:
 *   - parentRef: tree hierarchy (note is a child of the task)
 *   - taskRef:   semantic binding (uniquely identifies this note belongs to the task)
 *
 * To find the comments node for a task, query:
 *   type is "core.note" and taskRef is "<taskId>"
 */

// @ts-ignore - SDK types are resolved at build time
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import {
  executeGetCommand,
  executePostCommand,
  executeDeleteCommand,
} from '@rubix-sdk/frontend/plugin-client/commands';

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface AddCommentInput {
  text: string;
  userId: string;
  userName?: string;
}

export interface EditCommentInput {
  id: string;
  text: string;
}

/**
 * Create the core.note comments node for a task.
 *
 * Call this immediately after creating the task node.
 * Sets parentRef (tree hierarchy) and taskRef (semantic binding).
 *
 * @returns The ID of the created note node
 */
export async function createCommentsNode(
  client: PluginClient,
  taskId: string
): Promise<string> {
  const node = await (client as any).createNode({
    type: 'core.note',
    name: '_comments',
    parentId: taskId,
    settings: {
      hidden: true,
      noteType: 'comments',
    },
    refs: [
      { refName: 'parentRef', toNodeId: taskId },
      { refName: 'taskRef',   toNodeId: taskId },
    ],
  });
  return node.id;
}

/**
 * Find the core.note comments node for a task via taskRef.
 *
 * Uses the refs table — fast, no name matching needed.
 */
async function getCommentsNode(
  client: PluginClient,
  taskId: string
): Promise<string> {
  const results: { id: string }[] = await (client as any).queryNodes({
    filter: `type is "core.note" and taskRef is "${taskId}"`,
  });

  if (!results || results.length === 0) {
    throw new Error(`No comments node found for task ${taskId}`);
  }

  return results[0].id;
}

/**
 * List all comments on a task or ticket
 *
 * Finds the core.note child node and executes listComments command on it.
 *
 * @example
 * ```typescript
 * const comments = await listComments(client, taskId);
 * console.log(`Found ${comments.length} comments`);
 * ```
 */
export async function listComments(
  client: PluginClient,
  taskId: string
): Promise<Comment[]> {
  try {
    const noteNodeId = await getCommentsNode(client, taskId);
    const result = await executeGetCommand<{ data: { comments: Comment[]; count: number } }>(
      client,
      noteNodeId,
      'listComments'
    );
    return result?.data?.comments || [];
  } catch (error) {
    console.error(`Failed to list comments for ${taskId}:`, error);
    throw error;
  }
}

/**
 * Add a comment to a task or ticket
 *
 * Finds the core.note child node and executes addComment command on it.
 *
 * @example
 * ```typescript
 * const comment = await addComment(client, taskId, {
 *   text: 'This task is blocked by API issue',
 *   userId: 'user_123',
 *   userName: 'Alice Smith'
 * });
 * ```
 */
export async function addComment(
  client: PluginClient,
  nodeId: string,
  input: AddCommentInput
): Promise<Comment> {
  try {
    if (!input.text.trim()) {
      throw new Error('Comment text is required');
    }

    if (!input.userId) {
      throw new Error('userId is required');
    }

    const noteNodeId = await getCommentsNode(client, nodeId);
    const result = await executePostCommand<{ data: { id: string; text: string; createdAt: string } }>(
      client,
      noteNodeId,
      'addComment',
      {
        text: input.text.trim(),
      }
    );

    // Return a properly formatted comment
    if (result.result?.data) {
      return {
        id: result.result.data.id,
        text: result.result.data.text,
        userId: input.userId,
        userName: input.userName || input.userId,
        createdAt: result.result.data.createdAt,
        lastUpdated: '',
      };
    }

    throw new Error('Failed to add comment: no result returned');
  } catch (error) {
    console.error(`Failed to add comment to ${nodeId}:`, error);
    throw error;
  }
}

/**
 * Edit an existing comment on a task or ticket
 *
 * Finds the core.note child node and executes editComment command on it.
 * Sets lastUpdated to the current timestamp.
 *
 * @example
 * ```typescript
 * const updated = await editComment(client, taskId, { id: commentId, text: 'new text' });
 * ```
 */
export async function editComment(
  client: PluginClient,
  nodeId: string,
  input: EditCommentInput
): Promise<void> {
  try {
    if (!input.id) {
      throw new Error('comment ID is required');
    }
    if (!input.text.trim()) {
      throw new Error('comment text is required');
    }

    const noteNodeId = await getCommentsNode(client, nodeId);
    await executePostCommand(
      client,
      noteNodeId,
      'editComment',
      {
        id: input.id,
        text: input.text.trim(),
      }
    );
  } catch (error) {
    console.error(`Failed to edit comment ${input.id}:`, error);
    throw error;
  }
}

/**
 * Delete a comment from a task or ticket
 *
 * Finds the core.note child node and executes deleteComment command on it.
 *
 * @example
 * ```typescript
 * await deleteComment(client, taskId, commentId);
 * ```
 */
export async function deleteComment(
  client: PluginClient,
  nodeId: string,
  commentId: string
): Promise<void> {
  try {
    if (!commentId) {
      throw new Error('commentId is required');
    }

    const noteNodeId = await getCommentsNode(client, nodeId);
    await executeDeleteCommand(client, noteNodeId, 'deleteComment', {
      id: commentId,
    });
  } catch (error) {
    console.error(`Failed to delete comment ${commentId} from ${nodeId}:`, error);
    throw error;
  }
}

/**
 * Get comment count for a node (without fetching all comments)
 *
 * @example
 * ```typescript
 * const count = await getCommentCount(client, taskId);
 * console.log(`${count} comments`);
 * ```
 */
export async function getCommentCount(
  client: PluginClient,
  nodeId: string
): Promise<number> {
  try {
    const comments = await listComments(client, nodeId);
    return comments.length;
  } catch (error) {
    console.error(`Failed to get comment count for ${nodeId}:`, error);
    return 0;
  }
}
