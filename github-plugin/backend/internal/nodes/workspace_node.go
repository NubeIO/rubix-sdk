package nodes

import "github.com/NubeIO/rubix-sdk/nodedeps"

type WorkspaceNode struct {
	passiveNode
}

func (n *WorkspaceNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		MaxOneNode:          false,
		DeletionProhibited:  false,
		AllowCascadeDelete:  true,
		MustLiveUnderParent: true,
		AllowedParents:      []string{"rubix.device"},
	}
}

func (n *WorkspaceNode) SettingsSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"required": []string{
			"name",
		},
		"properties": map[string]interface{}{
			"name": map[string]interface{}{
				"type":        "string",
				"title":       "Workspace Name",
				"description": "Human-friendly label for this GitHub workspace in Rubix.",
				"minLength":   1,
			},
			"description": map[string]interface{}{
				"type":        "string",
				"title":       "Description",
				"description": "Optional notes about the team, portfolio, or reporting scope.",
			},
			"defaultIssueState": map[string]interface{}{
				"type":        "string",
				"title":       "Default Issue State",
				"description": "Which issue state the UI should show first.",
				"enum":        []string{"open", "closed", "all"},
				"default":     "open",
			},
		},
	}
}
