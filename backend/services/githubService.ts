import axios from 'axios';

export interface GitHubRepoData {
  owner: string;
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number; // This includes issues + PRs
  actual_open_issues_count: number; // This is issues only
  created_at: string;
  description?: string;
  language?: string;
  default_branch: string;
}

export class GitHubService {
  private readonly baseURL = 'https://api.github.com';
  private readonly headers: Record<string, string>;

  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-CRM-App',
    };

    // Add authorization header if GitHub token is provided
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      this.headers['Authorization'] = `token ${githubToken}`;
    }
  }

  async getRepositoryData(owner: string, repo: string): Promise<GitHubRepoData> {
    try {
      // Get repository data
      const repoResponse = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        { headers: this.headers }
      );

      const repoData = repoResponse.data;

      // Get open pull requests count to subtract from total open_issues_count
      const openPRsCount = await this.getOpenPullRequestsCount(owner, repo);
      const actualIssuesCount = Math.max(0, repoData.open_issues_count - openPRsCount);

      return {
        owner: repoData.owner.login,
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        open_issues_count: repoData.open_issues_count, // Issues + PRs
        actual_open_issues_count: actualIssuesCount, // Issues only
        created_at: repoData.created_at,
        description: repoData.description,
        language: repoData.language,
        default_branch: repoData.default_branch,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Repository ${owner}/${repo} not found`);
        }
        if (error.response?.status === 403) {
          throw new Error('GitHub API rate limit exceeded or access forbidden');
        }
        if (error.response?.status === 401) {
          throw new Error('GitHub API authentication failed');
        }
      }
      throw new Error(`Failed to fetch repository data: ${error}`);
    }
  }

  /**
   * Get the count of open pull requests
   */
  private async getOpenPullRequestsCount(owner: string, repo: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/pulls`,
        { 
          headers: this.headers,
          params: {
            state: 'open',
            per_page: 1 // We only need the count, not the actual PRs
          }
        }
      );

      // Parse the total count from the Link header
      const linkHeader = response.headers.link;
      if (linkHeader) {
        const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (lastPageMatch) {
          return parseInt(lastPageMatch[1]);
        }
      }

      // If no pagination, return the actual count
      return response.data.length;
    } catch (error) {
      console.warn(`⚠️ Failed to get PR count for ${owner}/${repo}, using 0`);
      return 0;
    }
  }

  /**
   * Parse repository path from various formats:
   * - "owner/repo"
   * - "https://github.com/owner/repo"
   * - "github.com/owner/repo"
   */
  parseRepositoryPath(repoPath: string): { owner: string; repo: string } {
    // Remove protocol and domain if present
    let cleanPath = repoPath
      .replace(/^https?:\/\//, '')
      .replace(/^github\.com\//, '')
      .replace(/\.git$/, '')
      .trim();

    // Remove trailing slash
    cleanPath = cleanPath.replace(/\/$/, '');

    // Split by slash
    const parts = cleanPath.split('/');

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(
        'Invalid repository path. Expected format: "owner/repo" or "https://github.com/owner/repo"'
      );
    }

    return {
      owner: parts[0],
      repo: parts[1],
    };
  }

  /**
   * Check if GitHub API rate limit allows for requests
   */
  async checkRateLimit(): Promise<{ remaining: number; reset: Date }> {
    try {
      const response = await axios.get(`${this.baseURL}/rate_limit`, {
        headers: this.headers,
      });

      return {
        remaining: response.data.rate.remaining,
        reset: new Date(response.data.rate.reset * 1000),
      };
    } catch (error) {
      throw new Error(`Failed to check GitHub API rate limit: ${error}`);
    }
  }
}
