import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD operations
router.post('/', projectController.addProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
