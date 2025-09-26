import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Project {
  id: number;
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  githubCreatedAt: number; // Unix timestamp
  lastUpdatedFromGithub?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface AddProjectResponse {
  message: string;
  project: Project;
}

export interface UpdateProjectResponse {
  message: string;
  project: Project;
}

export interface DeleteProjectResponse {
  message: string;
}

export const projectService = {
  async getProjects(): Promise<ProjectsResponse> {
    const response = await api.get('/projects');
    return response.data;
  },

  async addProject(repoPath: string): Promise<AddProjectResponse> {
    const response = await api.post('/projects', { repoPath });
    return response.data;
  },

  async updateProject(projectId: number): Promise<UpdateProjectResponse> {
    const response = await api.put(`/projects/${projectId}`);
    return response.data;
  },

  async deleteProject(projectId: number): Promise<DeleteProjectResponse> {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  async getProject(projectId: number): Promise<{ project: Project }> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Helper function to format GitHub created date
  formatGitHubDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  },

  // Helper function to format last updated date
  formatLastUpdated(dateString?: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }
};
