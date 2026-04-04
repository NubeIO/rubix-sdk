package apps

import (
	"encoding/json"
	"fmt"

	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client"
)

// AppsClient provides high-level methods for querying and downloading
// apps and plugins from the Rubix app store (docs.asset system).
type AppsClient struct {
	c *client.Client
}

// NewAppsClient creates a new AppsClient.
func NewAppsClient(c *client.Client) *AppsClient {
	return &AppsClient{c: c}
}

// AppAsset represents a downloadable asset from the app store.
type AppAsset struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Type     string            `json:"type"`
	Settings AppAssetSettings  `json:"settings"`
	Parent   *AppAssetParent   `json:"parent,omitempty"`
}

// AppAssetSettings holds the settings fields for a docs.asset node.
type AppAssetSettings struct {
	Platform   string `json:"platform,omitempty"`
	Version    string `json:"version,omitempty"`
	AssetType  string `json:"assetType,omitempty"`
	FileFormat string `json:"fileFormat,omitempty"`
}

// AppAssetParent holds parent node info returned by the query.
type AppAssetParent struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	Type string `json:"type,omitempty"`
}

// queryBody is the POST body for the query endpoint.
type queryBody struct {
	Filter string `json:"filter"`
}

// queryResponse is the expected shape of a query result.
type queryResponse struct {
	Data []AppAsset `json:"data"`
}

// ListApps queries for all bios-app assets. If platform is non-empty it filters by platform.
func (a *AppsClient) ListApps(orgId, deviceId, platform string) ([]AppAsset, error) {
	filter := "type is 'docs.asset' and settings.assetType is 'bios-app'"
	if platform != "" {
		filter += fmt.Sprintf(" and settings.platform is '%s'", platform)
	}
	return a.queryAssets(orgId, deviceId, filter)
}

// ListPlugins queries for all plugin assets. If platform is non-empty it filters by platform.
func (a *AppsClient) ListPlugins(orgId, deviceId, platform string) ([]AppAsset, error) {
	filter := "type is 'docs.asset' and settings.assetType is 'plugin'"
	if platform != "" {
		filter += fmt.Sprintf(" and settings.platform is '%s'", platform)
	}
	return a.queryAssets(orgId, deviceId, filter)
}

// GetApp queries for a specific app by name and platform.
func (a *AppsClient) GetApp(orgId, deviceId, appName, platform string) ([]AppAsset, error) {
	filter := fmt.Sprintf("type is 'docs.asset' and settings.assetType is 'bios-app' and parent.name is '%s'", appName)
	if platform != "" {
		filter += fmt.Sprintf(" and settings.platform is '%s'", platform)
	}
	return a.queryAssets(orgId, deviceId, filter)
}

// GetPlugin queries for a specific plugin by name and platform.
func (a *AppsClient) GetPlugin(orgId, deviceId, pluginName, platform string) ([]AppAsset, error) {
	filter := fmt.Sprintf("type is 'docs.asset' and settings.assetType is 'plugin' and parent.name is '%s'", pluginName)
	if platform != "" {
		filter += fmt.Sprintf(" and settings.platform is '%s'", platform)
	}
	return a.queryAssets(orgId, deviceId, filter)
}

// DownloadApp downloads a docs.asset file by nodeId. Returns the raw response bytes.
func (a *AppsClient) DownloadApp(orgId, deviceId, nodeId string) ([]byte, error) {
	resp, err := a.c.R.R().
		SetPathParams(map[string]string{
			"orgId":    orgId,
			"deviceId": deviceId,
			"nodeId":   nodeId,
		}).
		Get(a.c.Prefix + "/orgs/{orgId}/devices/{deviceId}/doc-assets/{nodeId}/download")
	if err != nil {
		return nil, err
	}
	return resp.Body(), nil
}

// queryAssets runs a query filter and parses the results into AppAsset slice.
func (a *AppsClient) queryAssets(orgId, deviceId, filter string) ([]AppAsset, error) {
	body := queryBody{Filter: filter}
	resp, err := a.c.R.R().
		SetPathParams(map[string]string{
			"orgId":    orgId,
			"deviceId": deviceId,
		}).
		SetBody(body).
		Post(a.c.Prefix + "/orgs/{orgId}/devices/{deviceId}/query")
	if err != nil {
		return nil, err
	}

	var result queryResponse
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("parse query response: %w", err)
	}
	return result.Data, nil
}
