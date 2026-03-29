import type { Node } from '../ras/types';
import type { CreateNodeInput, NodeRef, PluginClient, UpdateNodeInput } from './index';
export declare function getNode(client: PluginClient, nodeId: string): Promise<Node>;
export declare function createNode(client: PluginClient, parentId: string | undefined, input: Omit<CreateNodeInput, 'parentId' | 'refs'> & {
    refs?: NodeRef[];
}): Promise<Node>;
export declare function updateNode(client: PluginClient, nodeId: string, input: UpdateNodeInput): Promise<Node>;
export declare function updateNodeSettings(client: PluginClient, nodeId: string, settings: Record<string, unknown>): Promise<Node>;
export declare function deleteNode(client: PluginClient, nodeId: string): Promise<void>;
export declare function listNodes(client: PluginClient): Promise<Node[]>;
