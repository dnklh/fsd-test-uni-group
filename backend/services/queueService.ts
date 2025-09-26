import { githubQueue } from '../config/redis';
import { ProjectService } from './projectService';

const projectService = new ProjectService();

// Process GitHub data fetching jobs
githubQueue.process('fetch-github-data', async (job) => {
  const { projectId, owner, repo } = job.data;
  
  console.log(`🚀 [QUEUE] Starting job ${job.id} - Processing GitHub data fetch for project ${projectId} (${owner}/${repo})`);

  try {
    console.log(`🔍 [QUEUE] Calling updateProjectWithGitHubData for project ${projectId}`);
    await projectService.updateProjectWithGitHubData(projectId);
    console.log(`✅ [QUEUE] Successfully processed GitHub data for project ${projectId} (${owner}/${repo})`);
  } catch (error: any) {
    console.error(`❌ [QUEUE] Failed to process GitHub data for project ${projectId} (${owner}/${repo}):`, error);
    console.error(`❌ [QUEUE] Error details:`, {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack trace
    });
    throw error; // This will mark the job as failed and potentially retry it
  }
});

// Job event handlers
githubQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

githubQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

githubQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled and will be retried`);
});

// Export queue for monitoring/admin purposes
export { githubQueue };

console.log('🚀 Queue service initialized and processing jobs');
