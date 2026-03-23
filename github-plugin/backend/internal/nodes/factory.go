package nodes

import "github.com/NubeIO/rubix-sdk/pluginnode"

func Factory(nodeType string) pluginnode.PluginNode {
	switch nodeType {
	case "github.workspace":
		return &WorkspaceNode{}
	case "github.account":
		return &AccountNode{}
	case "github.report":
		return &ReportNode{}
	default:
		return nil
	}
}
