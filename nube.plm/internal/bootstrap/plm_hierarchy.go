package bootstrap

import (
	"context"
	"fmt"
	"time"

	pluginBootstrap "github.com/NubeIO/rubix-sdk/bootstrap"
)

// EnsurePLMHierarchy creates PLM service + collections (idempotent)
// Returns map of collection IDs: {"service": "...", "projects": "...", "productionRuns": "..."}
// pluginNodeID: ID of the plugin node (e.g., "plugin_nube.plm")
func EnsurePLMHierarchy(ctx context.Context, client *pluginBootstrap.Client, pluginNodeID string) (map[string]string, error) {
	spec := pluginBootstrap.HierarchySpec{
		PluginNodeID: pluginNodeID,
		ServiceNode: pluginBootstrap.NodeSpec{
			Type: "plm.service",
			Name: "Project Lifecycle Management",
			Settings: map[string]interface{}{
				"serviceName": "Project Lifecycle Management",
				"serviceType": "plm",
				"status":      "active",
				"version":     "2.0",
			},
		},
		Collections: []pluginBootstrap.NodeSpec{
			{
				Type: "plm.projects",
				Name: "Projects",
				Settings: map[string]interface{}{
					"description": "Project definitions",
				},
			},
			// TODO: Uncomment when ready to test other collections
			// {
			// 	Type: "plm.production-runs",
			// 	Name: "Production Runs",
			// 	Settings: map[string]interface{}{
			// 		"description": "Manufacturing runs",
			// 	},
			// },
			// {
			// 	Type: "plm.serialized-units",
			// 	Name: "Serialized Units",
			// 	Settings: map[string]interface{}{
			// 		"description": "Individual units with serial numbers",
			// 	},
			// },
			// {
			// 	Type: "plm.work-items",
			// 	Name: "Work Items",
			// 	Settings: map[string]interface{}{
			// 		"description": "RMA, bugs, feature requests",
			// 	},
			// },
			// {
			// 	Type: "plm.sites",
			// 	Name: "Sites",
			// 	Settings: map[string]interface{}{
			// 		"description": "Customer installation sites",
			// 	},
			// },
		},
	}

	result, err := pluginBootstrap.EnsureHierarchy(ctx, client, spec)
	if err != nil {
		return nil, err
	}

	// Return map for easy lookup
	return map[string]string{
		"service":  result.ServiceID,
		"projects": result.CollectionIDs["plm.projects"],
		// TODO: Uncomment when other collections are enabled
		// "productionRuns":  result.CollectionIDs["plm.production-runs"],
		// "serializedUnits": result.CollectionIDs["plm.serialized-units"],
		// "workItems":       result.CollectionIDs["plm.work-items"],
		// "sites":           result.CollectionIDs["plm.sites"],
	}, nil
}

// EnsurePLMHierarchyWithRetry creates PLM hierarchy with retry (waits for rubix core)
// pluginNodeID: ID of the plugin node (e.g., "plugin_nube.plm")
func EnsurePLMHierarchyWithRetry(ctx context.Context, client *pluginBootstrap.Client, pluginNodeID string, maxWait time.Duration, onRetry func(attempt int, nextDelay time.Duration)) (map[string]string, error) {
	spec := pluginBootstrap.HierarchySpec{
		PluginNodeID: pluginNodeID,
		ServiceNode: pluginBootstrap.NodeSpec{
			Type: "plm.service",
			Name: "Project Lifecycle Management",
			Settings: map[string]interface{}{
				"serviceName": "Project Lifecycle Management",
				"serviceType": "plm",
				"status":      "active",
				"version":     "2.0",
			},
		},
		Collections: []pluginBootstrap.NodeSpec{
			{
				Type: "plm.projects",
				Name: "Projects",
				Settings: map[string]interface{}{
					"description": "Project definitions",
				},
			},
		},
	}

	result, err := pluginBootstrap.EnsureHierarchyWithRetry(ctx, client, spec, maxWait, onRetry)
	if err != nil {
		return nil, err
	}

	// Extract IDs
	serviceID := result.ServiceID
	projectsID := result.CollectionIDs["plm.projects"]

	// Debug: log what we got
	if serviceID == "" {
		return nil, fmt.Errorf("bootstrap returned empty service ID")
	}
	if projectsID == "" {
		return nil, fmt.Errorf("bootstrap returned empty projects collection ID")
	}

	return map[string]string{
		"service":  serviceID,
		"projects": projectsID,
	}, nil
}
