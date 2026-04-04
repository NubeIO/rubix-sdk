package rubixclient

import (
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/apps"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/access"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/admin"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/apikeys"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/association"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/audit"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/auth"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/backup"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/datastore"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/db_tables"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/devices"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/diagnostics"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/doc_assets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_access"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_assets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_collections"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_search"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_system"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/docs_versions"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/edges"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/email_queue"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/flows"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/hierarchy"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/histories"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/host"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/identity"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/insights"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/jobs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/journal"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/logs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/meta"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nav"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/network_devices"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/node_profiles"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_assets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_hierarchy"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_pages"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_pages_attach"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_relationships"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/nodes_validate_relationships"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/org_admin"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/org_assets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/org_locale"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/org_settings"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/orgs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_querymap"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_structure"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_templates_attach"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_usage"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_validate"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pages_widgets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/pallet"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/ping"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/plugindata"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/plugins"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/port_mappings"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/ports"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/preferences"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/public_device"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/query"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/ras"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/refs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/riot_assets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/runtime"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/rxai"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/schemas"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/secrets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/tabs_templates_attach"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/tabs_widgets_attach"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/tag_definitions"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/tag_vocabulary"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/tags"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/teams"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/templates"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/templates_usage"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/templates_validate"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/templates_widgets_attach"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/users"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/validate_all_refs"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/websocket"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/widgets"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/widgets_usage"
	"github.com/NubeIO/rubix-sdk/pkg/rubixclient/client/widgets_validate"
)

// RubixClient is the single entry point for all Rubix API interactions.
// It exposes both auto-generated resource clients and manually extended clients.
type RubixClient struct {
	// Raw is the underlying HTTP client for advanced usage.
	Raw *client.Client

	// --- Auto-generated resource clients ---
	Access                     *access.AccessClient
	Admin                      *admin.AdminClient
	ApiKeys                    *apikeys.ApikeysClient
	Association                *association.AssociationClient
	Audit                      *audit.AuditClient
	Auth                       *auth.AuthClient
	Backup                     *backup.BackupClient
	Datastore                  *datastore.DatastoreClient
	DbTables                   *db_tables.DbTablesClient
	Devices                    *devices.DevicesClient
	Diagnostics                *diagnostics.DiagnosticsClient
	DocAssets                  *doc_assets.DocAssetsClient
	Docs                       *docs.DocsClient
	DocsAccess                 *docs_access.DocsAccessClient
	DocsAssets                 *docs_assets.DocsAssetsClient
	DocsCollections            *docs_collections.DocsCollectionsClient
	DocsSearch                 *docs_search.DocsSearchClient
	DocsSystem                 *docs_system.DocsSystemClient
	DocsVersions               *docs_versions.DocsVersionsClient
	Edges                      *edges.EdgesClient
	EmailQueue                 *email_queue.EmailQueueClient
	Flows                      *flows.FlowsClient
	Hierarchy                  *hierarchy.HierarchyClient
	Histories                  *histories.HistoriesClient
	Host                       *host.HostClient
	Identity                   *identity.IdentityClient
	Insights                   *insights.InsightsClient
	Jobs                       *jobs.JobsClient
	Journal                    *journal.JournalClient
	Logs                       *logs.LogsClient
	Meta                       *meta.MetaClient
	Nav                        *nav.NavClient
	NetworkDevices             *network_devices.NetworkDevicesClient
	NodeProfiles               *node_profiles.NodeProfilesClient
	Nodes                      *nodes.NodesClient
	NodesAssets                *nodes_assets.NodesAssetsClient
	NodesHierarchy             *nodes_hierarchy.NodesHierarchyClient
	NodesPages                 *nodes_pages.NodesPagesClient
	NodesPagesAttach           *nodes_pages_attach.NodesPagesAttachClient
	NodesRelationships         *nodes_relationships.NodesRelationshipsClient
	NodesValidateRelationships *nodes_validate_relationships.NodesValidateRelationshipsClient
	OrgAdmin                   *org_admin.OrgAdminClient
	OrgAssets                  *org_assets.OrgAssetsClient
	OrgLocale                  *org_locale.OrgLocaleClient
	OrgSettings                *org_settings.OrgSettingsClient
	Orgs                       *orgs.OrgsClient
	Pages                      *pages.PagesClient
	PagesQuerymap              *pages_querymap.PagesQueryMapClient
	PagesStructure             *pages_structure.PagesStructureClient
	PagesTemplatesAttach       *pages_templates_attach.PagesTemplatesAttachClient
	PagesUsage                 *pages_usage.PagesUsageClient
	PagesValidate              *pages_validate.PagesValidateClient
	PagesWidgets               *pages_widgets.PagesWidgetsClient
	Pallet                     *pallet.PalletClient
	Ping                       *ping.PingClient
	PluginData                 *plugindata.PlugindataClient
	Plugins                    *plugins.PluginsClient
	PortMappings               *port_mappings.PortMappingsClient
	Ports                      *ports.PortsClient
	Preferences                *preferences.PreferencesClient
	PublicDevice               *public_device.PublicDeviceClient
	Query                      *query.QueryClient
	Ras                        *ras.RasClient
	Refs                       *refs.RefsClient
	RiotAssets                 *riot_assets.RiotAssetsClient
	Runtime                    *runtime.RuntimeClient
	Rxai                       *rxai.RxaiClient
	Schemas                    *schemas.SchemasClient
	Secrets                    *secrets.SecretsClient
	TabsTemplatesAttach        *tabs_templates_attach.TabsTemplatesAttachClient
	TabsWidgetsAttach          *tabs_widgets_attach.TabsWidgetsAttachClient
	TagDefinitions             *tag_definitions.TagDefinitionsClient
	TagVocabulary              *tag_vocabulary.TagVocabularyClient
	Tags                       *tags.TagsClient
	Teams                      *teams.TeamsClient
	Templates                  *templates.TemplatesClient
	TemplatesUsage             *templates_usage.TemplatesUsageClient
	TemplatesValidate          *templates_validate.TemplatesValidateClient
	TemplatesWidgetsAttach     *templates_widgets_attach.TemplatesWidgetsAttachClient
	Users                      *users.UsersClient
	ValidateAllRefs            *validate_all_refs.ValidateAllRefsClient
	Websocket                  *websocket.WebsocketClient
	Widgets                    *widgets.WidgetsClient
	WidgetsUsage               *widgets_usage.WidgetsUsageClient
	WidgetsValidate            *widgets_validate.WidgetsValidateClient

	// --- Extended clients (manually maintained) ---
	ExtendedApps *apps.AppsClient
}

// New creates a new RubixClient with all sub-clients wired up.
func New(baseURL string) *RubixClient {
	c := client.NewClient(baseURL)
	return &RubixClient{
		Raw: c,

		// Auto-generated
		Access:                     access.NewAccessClient(c),
		Admin:                      admin.NewAdminClient(c),
		ApiKeys:                    apikeys.NewApikeysClient(c),
		Association:                association.NewAssociationClient(c),
		Audit:                      audit.NewAuditClient(c),
		Auth:                       auth.NewAuthClient(c),
		Backup:                     backup.NewBackupClient(c),
		Datastore:                  datastore.NewDatastoreClient(c),
		DbTables:                   db_tables.NewDbTablesClient(c),
		Devices:                    devices.NewDevicesClient(c),
		Diagnostics:                diagnostics.NewDiagnosticsClient(c),
		DocAssets:                   doc_assets.NewDocAssetsClient(c),
		Docs:                       docs.NewDocsClient(c),
		DocsAccess:                 docs_access.NewDocsAccessClient(c),
		DocsAssets:                 docs_assets.NewDocsAssetsClient(c),
		DocsCollections:            docs_collections.NewDocsCollectionsClient(c),
		DocsSearch:                 docs_search.NewDocsSearchClient(c),
		DocsSystem:                 docs_system.NewDocsSystemClient(c),
		DocsVersions:               docs_versions.NewDocsVersionsClient(c),
		Edges:                      edges.NewEdgesClient(c),
		EmailQueue:                 email_queue.NewEmailQueueClient(c),
		Flows:                      flows.NewFlowsClient(c),
		Hierarchy:                  hierarchy.NewHierarchyClient(c),
		Histories:                  histories.NewHistoriesClient(c),
		Host:                       host.NewHostClient(c),
		Identity:                   identity.NewIdentityClient(c),
		Insights:                   insights.NewInsightsClient(c),
		Jobs:                       jobs.NewJobsClient(c),
		Journal:                    journal.NewJournalClient(c),
		Logs:                       logs.NewLogsClient(c),
		Meta:                       meta.NewMetaClient(c),
		Nav:                        nav.NewNavClient(c),
		NetworkDevices:             network_devices.NewNetworkDevicesClient(c),
		NodeProfiles:               node_profiles.NewNodeProfilesClient(c),
		Nodes:                      nodes.NewNodesClient(c),
		NodesAssets:                nodes_assets.NewNodesAssetsClient(c),
		NodesHierarchy:             nodes_hierarchy.NewNodesHierarchyClient(c),
		NodesPages:                 nodes_pages.NewNodesPagesClient(c),
		NodesPagesAttach:           nodes_pages_attach.NewNodesPagesAttachClient(c),
		NodesRelationships:         nodes_relationships.NewNodesRelationshipsClient(c),
		NodesValidateRelationships: nodes_validate_relationships.NewNodesValidateRelationshipsClient(c),
		OrgAdmin:                   org_admin.NewOrgAdminClient(c),
		OrgAssets:                  org_assets.NewOrgAssetsClient(c),
		OrgLocale:                  org_locale.NewOrgLocaleClient(c),
		OrgSettings:                org_settings.NewOrgSettingsClient(c),
		Orgs:                       orgs.NewOrgsClient(c),
		Pages:                      pages.NewPagesClient(c),
		PagesQuerymap:              pages_querymap.NewPagesQueryMapClient(c),
		PagesStructure:             pages_structure.NewPagesStructureClient(c),
		PagesTemplatesAttach:       pages_templates_attach.NewPagesTemplatesAttachClient(c),
		PagesUsage:                 pages_usage.NewPagesUsageClient(c),
		PagesValidate:              pages_validate.NewPagesValidateClient(c),
		PagesWidgets:               pages_widgets.NewPagesWidgetsClient(c),
		Pallet:                     pallet.NewPalletClient(c),
		Ping:                       ping.NewPingClient(c),
		PluginData:                 plugindata.NewPlugindataClient(c),
		Plugins:                    plugins.NewPluginsClient(c),
		PortMappings:               port_mappings.NewPortMappingsClient(c),
		Ports:                      ports.NewPortsClient(c),
		Preferences:                preferences.NewPreferencesClient(c),
		PublicDevice:               public_device.NewPublicDeviceClient(c),
		Query:                      query.NewQueryClient(c),
		Ras:                        ras.NewRasClient(c),
		Refs:                       refs.NewRefsClient(c),
		RiotAssets:                 riot_assets.NewRiotAssetsClient(c),
		Runtime:                    runtime.NewRuntimeClient(c),
		Rxai:                       rxai.NewRxaiClient(c),
		Schemas:                    schemas.NewSchemasClient(c),
		Secrets:                    secrets.NewSecretsClient(c),
		TabsTemplatesAttach:        tabs_templates_attach.NewTabsTemplatesAttachClient(c),
		TabsWidgetsAttach:          tabs_widgets_attach.NewTabsWidgetsAttachClient(c),
		TagDefinitions:             tag_definitions.NewTagDefinitionsClient(c),
		TagVocabulary:              tag_vocabulary.NewTagVocabularyClient(c),
		Tags:                       tags.NewTagsClient(c),
		Teams:                      teams.NewTeamsClient(c),
		Templates:                  templates.NewTemplatesClient(c),
		TemplatesUsage:             templates_usage.NewTemplatesUsageClient(c),
		TemplatesValidate:          templates_validate.NewTemplatesValidateClient(c),
		TemplatesWidgetsAttach:     templates_widgets_attach.NewTemplatesWidgetsAttachClient(c),
		Users:                      users.NewUsersClient(c),
		ValidateAllRefs:            validate_all_refs.NewValidateAllRefsClient(c),
		Websocket:                  websocket.NewWebsocketClient(c),
		Widgets:                    widgets.NewWidgetsClient(c),
		WidgetsUsage:               widgets_usage.NewWidgetsUsageClient(c),
		WidgetsValidate:            widgets_validate.NewWidgetsValidateClient(c),

		// Extended
		ExtendedApps: apps.NewAppsClient(c),
	}
}

// SetToken sets the bearer auth token for all subsequent requests.
func (rc *RubixClient) SetToken(token string) {
	rc.Raw.R.SetAuthToken(token)
}
