package githubapi

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const defaultBaseURL = "https://api.github.com"

type Client struct {
	baseURL    string
	httpClient *http.Client
	token      string
}

type Repository struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	Private     bool   `json:"private"`
	HTMLURL     string `json:"html_url"`
	Description string `json:"description"`
	Language    string `json:"language"`
	Visibility  string `json:"visibility"`
}

type Team struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	Privacy     string `json:"privacy"`
}

type User struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	HTMLURL   string `json:"html_url"`
	Type      string `json:"type"`
	SiteAdmin bool   `json:"site_admin"`
}

type Issue struct {
	ID        int64      `json:"id"`
	Number    int        `json:"number"`
	Title     string     `json:"title"`
	State     string     `json:"state"`
	HTMLURL   string     `json:"html_url"`
	UpdatedAt time.Time  `json:"updated_at"`
	User      *IssueUser `json:"user"`
}

type IssueUser struct {
	Login string `json:"login"`
}

func NewClient(baseURL, token string) *Client {
	if strings.TrimSpace(baseURL) == "" {
		baseURL = defaultBaseURL
	}

	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 20 * time.Second,
		},
		token: strings.TrimSpace(token),
	}
}

func (c *Client) ListOrgRepositories(ctx context.Context, org string) ([]Repository, error) {
	var repos []Repository
	if err := c.getJSON(ctx, fmt.Sprintf("/orgs/%s/repos?per_page=100&sort=updated", url.PathEscape(org)), &repos); err != nil {
		return nil, err
	}
	return repos, nil
}

func (c *Client) ListOrgTeams(ctx context.Context, org string) ([]Team, error) {
	var teams []Team
	if err := c.getJSON(ctx, fmt.Sprintf("/orgs/%s/teams?per_page=100", url.PathEscape(org)), &teams); err != nil {
		return nil, err
	}
	return teams, nil
}

func (c *Client) ListOrgUsers(ctx context.Context, org string) ([]User, error) {
	var users []User
	if err := c.getJSON(ctx, fmt.Sprintf("/orgs/%s/members?per_page=100", url.PathEscape(org)), &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (c *Client) ListIssues(ctx context.Context, owner, repo, state string) ([]Issue, error) {
	queryState := strings.TrimSpace(state)
	if queryState == "" {
		queryState = "open"
	}

	var issues []Issue
	path := fmt.Sprintf(
		"/repos/%s/%s/issues?per_page=100&state=%s",
		url.PathEscape(owner),
		url.PathEscape(repo),
		url.QueryEscape(queryState),
	)
	if err := c.getJSON(ctx, path, &issues); err != nil {
		return nil, err
	}
	return issues, nil
}

func (c *Client) getJSON(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("github api returned %s", res.Status)
	}

	if err := json.NewDecoder(res.Body).Decode(out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}

	return nil
}
