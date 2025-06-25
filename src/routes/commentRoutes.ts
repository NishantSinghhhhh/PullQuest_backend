// src/routes/commentRoutes.ts
import { Router } from "express";
import { commentOnIssues } from "../controllers/commentController";

const router = Router();

/* POST /api/comment/issues */
router.post("/issues", commentOnIssues);

export default router;