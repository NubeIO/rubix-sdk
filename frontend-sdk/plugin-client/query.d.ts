import type { Node } from '../ras/types';
import type { PluginClient, QueryNodesOptions } from './index';
export declare function queryNodes(client: PluginClient, options?: QueryNodesOptions): Promise<Node[]>;
