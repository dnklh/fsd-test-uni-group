import { Response } from 'express';
import { ProjectService } from '../services/projectService';
import { AuthRequest } from '../middleware/auth';

const projectService = new ProjectService();

export class ProjectController {
  async addProject(req: AuthRequest, res: Response) {
    try {
      const { repoPath } = req.body;
      const userId = req.userId!;

      // Validation
      if (!repoPath) {
        return res.status(400).json({
          error: 'Repository path is required (e.g., "facebook/react")',
        });
      }

      if (typeof repoPath !== 'string') {
        return res.status(400).json({
          error: 'Repository path must be a string',
        });
      }

      const project = await projectService.addProject(userId, repoPath.trim());

      res.status(201).json({
        message: 'Repository added successfully. GitHub data will be fetched in the background.',
        project: {
          id: project.id,
          owner: project.owner,
          name: project.name,
          url: project.url,
          stars: project.stars,
          forks: project.forks,
          openIssues: project.openIssues,
          githubCreatedAt: project.githubCreatedAt,
          createdAt: project.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Add project error:', error);

      // Handle specific errors
      if (error.message.includes('Invalid repository path')) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message.includes('already added')) {
        return res.status(409).json({ error: error.message });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Redis') || error.message.includes('MaxRetriesPerRequestError')) {
        return res.status(503).json({ 
          error: 'Background job service temporarily unavailable. Project added but GitHub data will be fetched later.' 
        });
      }

      res.status(500).json({
        error: 'Internal server error while adding project',
      });
    }
  }

  async getProjects(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const projects = await projectService.getUserProjects(userId);

      res.json({
        projects: projects.map(project => ({
          id: project.id,
          owner: project.owner,
          name: project.name,
          url: project.url,
          stars: project.stars,
          forks: project.forks,
          openIssues: project.openIssues,
          githubCreatedAt: project.githubCreatedAt,
          lastUpdatedFromGithub: project.lastUpdatedFromGithub,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('Get projects error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching projects',
      });
    }
  }

  async updateProject(req: AuthRequest, res: Response) {
    try {
      console.log(`🔄 [UPDATE] Starting project update - ProjectID: ${req.params.id}, UserID: ${req.userId}`);
      
      const projectId = parseInt(req.params.id);
      const userId = req.userId!;

      if (isNaN(projectId)) {
        console.log(`❌ [UPDATE] Invalid project ID: ${req.params.id}`);
        return res.status(400).json({
          error: 'Invalid project ID',
        });
      }

      console.log(`🔍 [UPDATE] Calling projectService.updateProject(${userId}, ${projectId})`);
      const project = await projectService.updateProject(userId, projectId);
      console.log(`✅ [UPDATE] Project service returned:`, {
        id: project.id,
        owner: project.owner,
        name: project.name,
        stars: project.stars,
        forks: project.forks,
        openIssues: project.openIssues
      });

      res.json({
        message: 'Project update queued. GitHub data will be refreshed in the background.',
        project: {
          id: project.id,
          owner: project.owner,
          name: project.name,
          url: project.url,
          stars: project.stars,
          forks: project.forks,
          openIssues: project.openIssues,
          githubCreatedAt: project.githubCreatedAt,
          lastUpdatedFromGithub: project.lastUpdatedFromGithub,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
      
      console.log(`📤 [UPDATE] Response sent for project ${projectId}`);
    } catch (error: any) {
      console.error('❌ [UPDATE] Update project error:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      if (error.message.includes('Redis') || error.message.includes('MaxRetriesPerRequestError')) {
        return res.status(503).json({ 
          error: 'Background job service temporarily unavailable. Please try again later.' 
        });
      }

      res.status(500).json({
        error: 'Internal server error while updating project',
      });
    }
  }

  async deleteProject(req: AuthRequest, res: Response) {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.userId!;

      if (isNaN(projectId)) {
        return res.status(400).json({
          error: 'Invalid project ID',
        });
      }

      await projectService.deleteProject(userId, projectId);

      res.json({
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete project error:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Internal server error while deleting project',
      });
    }
  }

  async getProject(req: AuthRequest, res: Response) {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.userId!;

      if (isNaN(projectId)) {
        return res.status(400).json({
          error: 'Invalid project ID',
        });
      }

      const project = await projectService.getProjectById(projectId, userId);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
        });
      }

      res.json({
        project: {
          id: project.id,
          owner: project.owner,
          name: project.name,
          url: project.url,
          stars: project.stars,
          forks: project.forks,
          openIssues: project.openIssues,
          githubCreatedAt: project.githubCreatedAt,
          githubData: project.githubData,
          lastUpdatedFromGithub: project.lastUpdatedFromGithub,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Get project error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching project',
      });
    }
  }
}
