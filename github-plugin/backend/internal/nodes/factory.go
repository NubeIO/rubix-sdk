package nodes

import "github.com/NubeIO/rubix-sdk/pluginnode"

func Factory(nodeType string) pluginnode.PluginNode {
	switch nodeType {
	case "github.account":
		return &AccountNode{}
	default:
		return nil
	}
}
