package nodes

import "github.com/NubeIO/rubix-sdk/nodedeps"

type ReportNode struct {
	passiveNode
}

func (n *ReportNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		MaxOneNode:          false,
		DeletionProhibited:  false,
		AllowCascadeDelete:  false,
		MustLiveUnderParent: true,
		AllowedParents:      []string{"github.workspace"},
		RefConstraints: []nodedeps.RefConstraint{
			accountRefConstraint(),
		},
	}
}

func (n *ReportNode) SettingsSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"defaultGrouping": map[string]interface{}{
				"type":    "string",
				"title":   "Default Grouping",
				"enum":    []string{"repository", "assignee", "state"},
				"default": "repository",
			},
			"includeClosed": map[string]interface{}{
				"type":    "boolean",
				"title":   "Include Closed Issues",
				"default": true,
			},
			"notes": map[string]interface{}{
				"type":        "string",
				"title":       "Notes",
				"description": "Optional notes for report configuration and audience.",
			},
		},
	}
}
