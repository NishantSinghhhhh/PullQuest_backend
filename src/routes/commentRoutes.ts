import { Router } from 'express';
import { commentOnIssues } from '../controllers/commentController';

const router = Router();

router.get('/issues', commentOnIssues);

export default router;
