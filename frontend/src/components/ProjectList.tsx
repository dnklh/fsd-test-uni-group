import React, { useState, useEffect } from 'react';
import { projectService, Project } from '../services/projectService';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [updatingProjects, setUpdatingProjects] = useState<Set<number>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-refresh projects every 5 seconds for incomplete data
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if we have projects with incomplete data
      const hasIncompleteProjects = projects.some(p => p.stars === 0 && p.forks === 0 && p.openIssues === 0);
      if (hasIncompleteProjects) {
        loadProjects(true); // Silent refresh - don't show loading spinner
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [projects]);

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.projects);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoPath.trim()) return;

    try {
      setAddingProject(true);
      setError('');
      setSuccess('');

      const response = await projectService.addProject(repoPath.trim());
      setSuccess(response.message);
      setRepoPath('');
      
      // Refresh projects list
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add project');
    } finally {
      setAddingProject(false);
    }
  };

  const handleUpdateProject = async (projectId: number) => {
    try {
      // Add project to updating set
      setUpdatingProjects(prev => new Set(prev).add(projectId));
      setError('');
      setSuccess('');

      const response = await projectService.updateProject(projectId);
      setSuccess(response.message);
      
      // Refresh projects list
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update project');
    } finally {
      // Remove project from updating set
      setUpdatingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${projectName}?`)) {
      return;
    }

    try {
      const response = await projectService.deleteProject(projectId);
      setSuccess(response.message);
      
      // Refresh projects list
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleSelectProject = (projectId: number, checked: boolean) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(projectId);
      } else {
        newSet.delete(projectId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProjects.size === 0) return;

    try {
      setBulkUpdating(true);
      setError('');
      setSuccess('');

      const updatePromises = Array.from(selectedProjects).map(projectId =>
        projectService.updateProject(projectId)
      );

      await Promise.all(updatePromises);
      setSuccess(`Successfully updated ${selectedProjects.size} projects`);
      
      // Refresh projects list
      await loadProjects();
      setSelectedProjects(new Set()); // Clear selection
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update projects');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;

    const selectedNames = projects
      .filter(p => selectedProjects.has(p.id))
      .map(p => `${p.owner}/${p.name}`)
      .join(', ');

    if (!window.confirm(`Are you sure you want to delete ${selectedProjects.size} projects?\n\n${selectedNames}`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      setError('');
      setSuccess('');

      const deletePromises = Array.from(selectedProjects).map(projectId =>
        projectService.deleteProject(projectId)
      );

      await Promise.all(deletePromises);
      setSuccess(`Successfully deleted ${selectedProjects.size} projects`);
      
      // Refresh projects list
      await loadProjects();
      setSelectedProjects(new Set()); // Clear selection
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete projects');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading && projects.length === 0) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div>
      <div className="projects-header">
        <h2>My GitHub Projects</h2>
        {selectedProjects.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              {selectedProjects.size} selected
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleBulkUpdate}
              disabled={bulkUpdating}
              title="Update selected projects"
            >
              {bulkUpdating ? '🔄 Updating...' : '🔄 Update All'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              title="Delete selected projects"
            >
              {bulkDeleting ? '🗑️ Deleting...' : '🗑️ Delete All'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setSelectedProjects(new Set())}
              title="Clear selection"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="success" style={{ marginBottom: '20px' }}>{success}</div>}

      {/* Add Project Form */}
      <div className="add-project-form">
        <h3>Add New Repository</h3>
        <form onSubmit={handleAddProject}>
          <div className="add-project-input">
            <div className="form-group">
              <label htmlFor="repoPath" className="form-label">
                Repository Path
              </label>
              <input
                type="text"
                id="repoPath"
                className="form-input"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="e.g., facebook/react or https://github.com/facebook/react"
                disabled={addingProject}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addingProject || !repoPath.trim()}
            >
              {addingProject ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          Enter the repository path in format "owner/repo" or paste the GitHub URL. 
          GitHub data will be fetched in the background.
        </p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="no-projects">
          <h3>No projects yet</h3>
          <p>Add your first GitHub repository above to get started!</p>
        </div>
      ) : (
        <>
          <div className="projects-controls">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectedProjects.size === projects.length && projects.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span>Select All ({projects.length})</span>
            </label>
          </div>
          <div className="projects-list">
          {projects.map((project) => (
            <div key={project.id} className={`project-card ${project.stars === 0 && project.forks === 0 && project.openIssues === 0 ? 'updating' : ''} ${selectedProjects.has(project.id) ? 'selected' : ''}`}>
              <div className="project-header">
                <div className="project-title-section">
                  <label className="project-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={(e) => handleSelectProject(project.id, e.target.checked)}
                    />
                  </label>
                  <h3 className="project-title">
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    {project.owner}/{project.name}
                  </a>
                    {project.stars === 0 && project.forks === 0 && project.openIssues === 0 && (
                      <span className="status-indicator" title="Fetching GitHub data...">
                        🔄 Loading...
                      </span>
                    )}
                  </h3>
                </div>
                <div className="project-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleUpdateProject(project.id)}
                    disabled={updatingProjects.has(project.id)}
                    title="Refresh GitHub data"
                  >
                    {updatingProjects.has(project.id) ? '🔄 Updating...' : 'Update'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteProject(project.id, `${project.owner}/${project.name}`)}
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="project-stats">
                <div className="stat">
                  <span className="stat-value">⭐ {project.stars.toLocaleString()}</span>
                  <span className="stat-label">Stars</span>
                </div>
                <div className="stat">
                  <span className="stat-value">🍴 {project.forks.toLocaleString()}</span>
                  <span className="stat-label">Forks</span>
                </div>
                <div className="stat">
                  <span className="stat-value">❗ {project.openIssues.toLocaleString()}</span>
                  <span className="stat-label">Issues</span>
                </div>
                <div className="stat">
                  <span className="stat-value">📅 {projectService.formatGitHubDate(project.githubCreatedAt)}</span>
                  <span className="stat-label">Created</span>
                </div>
              </div>

              <div className="project-meta">
                <p>
                  <strong>Added:</strong> {new Date(project.createdAt).toLocaleDateString()}
                  {project.lastUpdatedFromGithub && (
                    <>
                      {' | '}
                      <strong>Last updated:</strong> {projectService.formatLastUpdated(project.lastUpdatedFromGithub)}
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectList;
