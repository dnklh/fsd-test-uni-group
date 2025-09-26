import { AppDataSource } from '../config/database';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { GitHubService } from './githubService';
import { githubQueue } from '../config/redis';

export class ProjectService {
  private projectRepository = AppDataSource.getRepository(Project);
  private githubService = new GitHubService();

  async addProject(userId: number, repoPath: string): Promise<Project> {
    try {
      // Parse repository path
      const { owner, repo } = this.githubService.parseRepositoryPath(repoPath);

      // Check if project already exists for this user
      const existingProject = await this.projectRepository.findOne({
        where: { userId, owner, name: repo },
      });

      if (existingProject) {
        throw new Error('This repository is already added to your projects');
      }

      // Validate repository exists on GitHub BEFORE saving to database
      console.log(`🔍 [ADD] Validating repository exists: ${owner}/${repo}`);
      let githubData;
      try {
        githubData = await this.githubService.getRepositoryData(owner, repo);
        console.log(`✅ [ADD] Repository ${owner}/${repo} exists on GitHub`);
      } catch (error) {
        console.error(`❌ [ADD] Repository ${owner}/${repo} validation failed:`, error);
        throw error; // Re-throw the error to prevent saving invalid repos
      }

      // Create project record with real GitHub data
      const project = this.projectRepository.create({
        userId,
        owner,
        name: repo,
        url: `https://github.com/${owner}/${repo}`,
        stars: githubData.stargazers_count,
        forks: githubData.forks_count,
        openIssues: githubData.actual_open_issues_count,
        githubCreatedAt: Math.floor(new Date(githubData.created_at).getTime() / 1000),
        githubData: githubData as any,
        lastUpdatedFromGithub: new Date(),
      });

      const savedProject = await this.projectRepository.save(project);

      // Add background job to fetch GitHub data
      try {
        await githubQueue.add('fetch-github-data', {
          projectId: savedProject.id,
          owner,
          repo,
        });
        console.log(`📋 Added project ${owner}/${repo} for user ${userId} with real GitHub data, queued for background refresh`);
      } catch (queueError) {
        console.error('❌ Failed to queue GitHub data fetch job:', queueError);
        // Don't throw error - project is still created, just without background processing
        console.log(`📋 Added project ${owner}/${repo} for user ${userId} with real GitHub data (background refresh failed to queue)`);
      }

      return savedProject;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateProject(userId: number, projectId: number): Promise<Project> {
    console.log(`🔍 [SERVICE] Looking for project - ID: ${projectId}, UserID: ${userId}`);
    
    const project = await this.projectRepository.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      console.log(`❌ [SERVICE] Project not found - ID: ${projectId}, UserID: ${userId}`);
      throw new Error('Project not found');
    }

    console.log(`✅ [SERVICE] Found project: ${project.owner}/${project.name} (ID: ${project.id})`);
    console.log(`📊 [SERVICE] Current stats - Stars: ${project.stars}, Forks: ${project.forks}, Issues: ${project.openIssues}`);

    // Add background job to refresh GitHub data
    try {
      console.log(`🎯 [SERVICE] Adding job to queue for ${project.owner}/${project.name}`);
      await githubQueue.add('fetch-github-data', {
        projectId: project.id,
        owner: project.owner,
        repo: project.name,
      });
      console.log(`✅ [SERVICE] Successfully queued refresh for project ${project.owner}/${project.name}`);
    } catch (queueError) {
      console.error(`❌ [SERVICE] Failed to queue refresh job:`, queueError);
      // Don't throw error - just log it, project update should still work
    }

    return project;
  }

  async deleteProject(userId: number, projectId: number): Promise<void> {
    const result = await this.projectRepository.delete({
      id: projectId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Project not found');
    }

    console.log(`🗑️ Deleted project ${projectId} for user ${userId}`);
  }

  async getProjectById(projectId: number, userId?: number): Promise<Project | null> {
    const where: any = { id: projectId };
    if (userId) {
      where.userId = userId;
    }

    return this.projectRepository.findOne({ where });
  }

  /**
   * Update project with GitHub data (called by background job)
   */
  async updateProjectWithGitHubData(projectId: number): Promise<void> {
    try {
      console.log(`🔍 [GITHUB] Looking up project ${projectId} for GitHub data update`);
      
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        console.error(`❌ [GITHUB] Project ${projectId} not found for GitHub data update`);
        return;
      }

      console.log(`✅ [GITHUB] Found project: ${project.owner}/${project.name} (ID: ${projectId})`);
      console.log(`📊 [GITHUB] Current data - Stars: ${project.stars}, Forks: ${project.forks}, Issues: ${project.openIssues}`);
      console.log(`🌐 [GITHUB] Fetching fresh data from GitHub API for ${project.owner}/${project.name}`);

      // Fetch data from GitHub API
      const githubData = await this.githubService.getRepositoryData(
        project.owner,
        project.name
      );

      console.log(`📥 [GITHUB] Received data from GitHub:`, {
        stars: githubData.stargazers_count,
        forks: githubData.forks_count,
        total_issues_and_prs: githubData.open_issues_count,
        actual_issues_only: githubData.actual_open_issues_count,
        created: githubData.created_at
      });

      // Convert GitHub created_at to Unix timestamp
      const githubCreatedAt = Math.floor(new Date(githubData.created_at).getTime() / 1000);
      console.log(`📅 [GITHUB] Converted created_at: ${githubData.created_at} → ${githubCreatedAt}`);

      // Update project with GitHub data
      console.log(`💾 [GITHUB] Updating database for project ${projectId}`);
      await this.projectRepository.update(projectId, {
        stars: githubData.stargazers_count,
        forks: githubData.forks_count,
        openIssues: githubData.actual_open_issues_count, // Use actual issues count (not including PRs)
        githubCreatedAt,
        githubData: githubData as any, // Store full GitHub response
        lastUpdatedFromGithub: new Date(),
      });

      console.log(`✅ [GITHUB] Successfully updated project ${project.owner}/${project.name} with fresh GitHub data`);
      console.log(`📊 [GITHUB] New stats - Stars: ${githubData.stargazers_count}, Forks: ${githubData.forks_count}, Issues: ${githubData.actual_open_issues_count}`);
    } catch (error: any) {
      console.error(`❌ [GITHUB] Failed to update project ${projectId} with GitHub data:`, error);
      if (error?.response) {
        console.error(`❌ [GITHUB] API Response:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
    }
  }
}
