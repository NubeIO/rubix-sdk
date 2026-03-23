package nodes

import "github.com/NubeIO/rubix-sdk/nodedeps"

type AccountNode struct {
	passiveNode
}

func (n *AccountNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		MaxOneNode:          false,
		DeletionProhibited:  false,
		AllowCascadeDelete:  false,
		MustLiveUnderParent: true,
		AllowedParents:      []string{"github.workspace"},
	}
}

func (n *AccountNode) SettingsSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"required": []string{
			"orgLogin",
			"token",
		},
		"properties": map[string]interface{}{
			"displayName": map[string]interface{}{
				"type":        "string",
				"title":       "Display Name",
				"description": "Optional display label. Falls back to the organization login.",
			},
			"baseUrl": map[string]interface{}{
				"type":        "string",
				"title":       "GitHub API Base URL",
				"description": "Use the public API or a GitHub Enterprise API endpoint.",
				"default":     "https://api.github.com",
			},
			"orgLogin": map[string]interface{}{
				"type":        "string",
				"title":       "Organization Login",
				"description": "GitHub organization or owner login to manage.",
				"minLength":   1,
			},
			"token": map[string]interface{}{
				"type":        "string",
				"title":       "Personal Access Token",
				"description": "Stored in node settings for now. Move this to a proper secret store later.",
				"minLength":   1,
			},
			"defaultRepository": map[string]interface{}{
				"type":        "string",
				"title":       "Default Repository",
				"description": "Optional default repository for task and issue views.",
			},
			"defaultIssueState": map[string]interface{}{
				"type":    "string",
				"title":   "Default Issue State",
				"enum":    []string{"open", "closed", "all"},
				"default": "open",
			},
		},
	}
}
