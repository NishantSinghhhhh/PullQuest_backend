import { Router, RequestHandler, NextFunction } from "express";
import User from "../model/User";
import { listOrgRepos, listUserRepos, listRepoIssues, getIssueByNumber, listRepoPullRequests, mergePullRequestAsUser, updateUserStatsAsUser, getOrgApiKeys,} from "../controllers/MaintainerController";
import { verifyToken } from "../middleware/verifyToken";
import { createRepoIssueAsUser } from "../controllers/MaintainerController";
import { ingestIssue } from "../ingesters/IssueIngestController";
import { ingestMergedPR } from "../ingesters/PRIngesterController";
import { ingestApiKey } from "../ingesters/OrgApiIngester";
import MaintainerIssue from "../model/MaintainerIssues";
import  {Request, Response } from 'express';    // ← import the types
import { generateApiKey } from '../utils/generateApiKey';

const router = Router();
router.use(verifyToken);

export const getOrgsByUsername: RequestHandler = async (req, res) => {
  try {
    console.log("---- Incoming request to /orgs-by-username ----");
    console.log("Query params:", req.query);
    console.log("-----------------------------------------------");

    const { githubUsername } = req.query as { githubUsername?: string };
    if (!githubUsername) {
      res.status(400).json({ success: false, message: "githubUsername is required" });
      return;
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error("🚨 GITHUB_TOKEN not set in env");
      res.status(500).json({ success: false, message: "Server misconfiguration" });
      return;
    }

    // listUserOrgs should accept a token parameter now
    const orgs = await listOrgRepos(githubUsername, token);

    res.status(200).json({ success: true, data: orgs });
  } catch (err: any) {
    console.error("Error fetching orgs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// NEW: GET /api/maintainer/repos-by-username?githubUsername=theuser&per_page=30&page=1
const getReposByUsername: RequestHandler = async (req, res) => {
  try {
    console.log("---- Incoming request to /repos-by-username ----");
    console.log("Query params:", req.query);
    console.log("-----------------------------------------------");

    const { githubUsername, per_page = 30, page = 1 } = req.query as {
      githubUsername?: string;
      per_page?: string;
      page?: string;
    };
    if (!githubUsername) {
      res.status(400).json({ success: false, message: "githubUsername is required" });
      return;
    }

    // Fetch repos using your new utility
    const repos = await listUserRepos(githubUsername, Number(per_page), Number(page));
    res.status(200).json({ success: true, data: repos });
  } catch (err: any) {
    console.error("Error fetching repos:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRepoIssues: RequestHandler = async (req, res) => {
    try {
      const { owner, repo, state = "open", per_page = 30, page = 1 } = req.query as {
        owner?: string;
        repo?: string;
        state?: "open" | "closed" | "all";
        per_page?: string;
        page?: string;
      };
      if (!owner || !repo) {
        res.status(400).json({ success: false, message: "owner and repo are required" });
        return;
      }
      const issues = await listRepoIssues(owner, repo, state, Number(per_page), Number(page));
      res.status(200).json({ success: true, data: issues });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  export const createIssue: RequestHandler = async (req, res) => {
    try {
      const {
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
        milestone,
      } = req.body as {
        owner: string;
        repo: string;
        title: string;
        body?: string;
        labels?: string[];
        assignees?: string[];
        milestone?: string | number;
      };
  
      // 1) Validate
      if (!owner || !repo || !title) {
        res
          .status(400)
          .json({ success: false, message: "owner, repo and title are required" });
        return;
      }
  
      // 2) Try user’s OAuth token
      let githubToken = (req.user as any)?.accessToken as string | undefined;
  
      // 3) Fallback to your service PAT from .env
      if (!githubToken) {
        githubToken = process.env.GITHUB_ISSUE_CREATION;
      }
  
      if (!githubToken) {
        res
          .status(403)
          .json({ success: false, message: "No GitHub token available to create issue" });
        return;
      }
  
      // 4) Create the issue
      const issue = await createRepoIssueAsUser(
        githubToken,
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
        milestone
      );
  
      // 5) Return it
      res.status(201).json({ success: true, data: issue });
      return;
    } catch (err: any) {
      console.error("Error in createIssue handler:", err);
      res.status(500).json({ success: false, message: err.message });
      return;
    }
  };

  const getRepoPullRequests: RequestHandler = async (req, res) => {
    try {
      const { owner, repo, state = "open", per_page = "30", page = "1" } = req.query as {
        owner?: string;
        repo?: string;
        state?: "open" | "closed" | "all";
        per_page?: string;
        page?: string;
      };
  
      if (!owner || !repo) {
        res.status(400).json({ success: false, message: "owner and repo are required" });
        return;
      }
  
      const pullRequests = await listRepoPullRequests(
        owner,
        repo,
        state,
        Number(per_page),
        Number(page)
      );
  
      res.status(200).json({ success: true, data: pullRequests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  export const mergePullRequest: RequestHandler = async (req, res) => {
    try {
      console.log("🏷️  Payload for merge-pr:", req.body);
  
      // pull in either prNumber or pull_number
      const pull_number =
        typeof req.body.pull_number === "number"
          ? req.body.pull_number
          : req.body.prNumber;
      const { owner, repo, author, staking, xp } = req.body as any;
  
      if (!owner || !repo || typeof pull_number !== "number") {
        res
          .status(400)
          .json({ success: false, message: "owner, repo, and pull_number are required" });
        return;
      }
  
      // everything else unchanged…
      let githubToken = (req.user as any)?.accessToken as string | undefined;
      if (!githubToken) githubToken = process.env.GITHUB_ISSUE_CREATION;
      if (!githubToken) {
        res
          .status(403)
          .json({ success: false, message: "No GitHub token available to merge PR" });
        return;
      }
  
      const result = await mergePullRequestAsUser(
        githubToken,
        owner,
        repo,
        pull_number,
        /* etc */
      );
  
      res.status(200).json({ success: true, data: result });
      return;
    } catch (err: any) {
      console.error("❌ Error merging PR:", err);
      res.status(500).json({ success: false, message: err.message });
      return;
    }
  };
  
  export const getMaintainerIssueById: RequestHandler = async (req, res) => {
    try {
      const { id } = req.query as { id?: string }
      if (!id) {
        res.status(400).json({
          success: false,
          message: "Query parameter `id` is required",
        })
        return
      }
  
      const numericId = Number(id)
      if (Number.isNaN(numericId)) {
        res.status(400).json({
          success: false,
          message: "`id` must be a number",
        })
        return
      }
  
      const issue = await MaintainerIssue.findOne({ id: numericId })
      if (!issue) {
        res.status(404).json({
          success: false,
          message: `No ingested issue found with GitHub id ${numericId}`,
        })
        return
      }
  
      res.status(200).json({ success: true, data: issue })
      return
    } catch (err: any) {
      console.error("Error fetching issue by id:", err)
      res.status(500).json({ success: false, message: err.message })
      return
    }
  }

  router.patch("/users/update-stats", async (req, res, next) => {
    try {
      const { githubUsername, addedXp, addedCoins } = req.body;
      const result = await updateUserStatsAsUser(githubUsername, addedXp, addedCoins);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    "/api-key",
  
    // 0️⃣ Log everything the frontend sent
    (req: Request, res: Response, next: NextFunction): void => {
      console.log("📥 api-key request body:", req.body);
      next();
    },
  
    // 1️⃣ Validate & generate
    (req: Request, res: Response, next: NextFunction): void => {
      const { orgName } = req.body;
      if (!orgName) {
        console.log("❌ api-key: Missing orgName in request body");
        res.status(400).json({ success: false, message: "orgName required" });
        return; 
      }
  
      const secretKey = generateApiKey(orgName);
      console.log(`✅ api-key generated for org "${orgName}": ${secretKey}`);
      req.body.secretKey = secretKey;
  
      next();  // ← hand off to the next middleware
    },
  
    // 2️⃣ Ingest into MongoDB
    ingestApiKey
  );
  

router.get("/orgs-by-username", getOrgsByUsername);
router.get("/repos-by-username", getReposByUsername); // <-- Register your new route
router.get("/repo-issues", getRepoIssues);
router.post("/create-issue", createIssue);
router.post("/ingest-issue", ingestIssue);
router.get("/repo-pulls", getRepoPullRequests);
router.get("/issue-by-number", getIssueByNumber);
router.post("/merge-pr", mergePullRequest);
router.get("/issue-by-id", getMaintainerIssueById)
router.post("/ingest-merged-pr", ingestMergedPR)
router.post("/ingest-apikey", ingestApiKey)
router.get("/api-keys", getOrgApiKeys);

export default router;

