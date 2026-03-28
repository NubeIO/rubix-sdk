/**
 * Comment helper functions
 *
 * Comments are stored in core.note child nodes using the note's commands.
 * Each task/ticket has a single core.note child node that stores all comments.
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
  updatedAt?: string;
}

export interface AddCommentInput {
  text: string;
  userId: string;
  userName?: string;
}

/**
 * Find or create the core.note child node for a task/ticket
 *
 * Each task/ticket has one core.note child that stores comments.
 * The note is named "_comments" and hidden from the tree.
 */
async function getOrCreateCommentsNode(
  client: PluginClient,
  parentNodeId: string
): Promise<string> {
  // Try to find existing comments node
  const result: { id: string }[] = await (client as any).queryNodes({
    filter: `parent.id is "${parentNodeId}" and type is "core.note" and name is "_comments"`,
  });

  if (result && result.length > 0) {
    return result[0].id;
  }

  // Create new comments node
  const node = await (client as any).createNode({
    type: 'core.note',
    name: '_comments',
    parentRef: parentNodeId,
    settings: {
      hidden: true,
      noteType: 'comments',
    },
  });

  return node.id;
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
  nodeId: string
): Promise<Comment[]> {
  try {
    const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
    const result = await executeGetCommand<{ comments: Comment[]; count: number }>(
      client,
      noteNodeId,
      'listComments'
    );
    return result?.comments || [];
  } catch (error) {
    console.error(`Failed to list comments for ${nodeId}:`, error);
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

    const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
    const result = await executePostCommand<{ id: string; text: string; createdAt: string }>(
      client,
      noteNodeId,
      'addComment',
      {
        text: input.text.trim(),
      }
    );

    // Return a properly formatted comment
    if (result.result) {
      return {
        id: result.result.id,
        text: result.result.text,
        userId: input.userId,
        userName: input.userName || input.userId,
        createdAt: result.result.createdAt,
      };
    }

    throw new Error('Failed to add comment: no result returned');
  } catch (error) {
    console.error(`Failed to add comment to ${nodeId}:`, error);
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

    const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
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
