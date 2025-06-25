import { Router } from "express";
import { generateContext } from "../controllers/LLMcontroller";
const router = Router();

router.post("/generate-context/", generateContext);

export default router;
