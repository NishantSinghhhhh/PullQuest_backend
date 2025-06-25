"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintainerIssueById = exports.mergePullRequest = exports.createIssue = exports.getOrgsByUsername = void 0;
const express_1 = require("express");
const MaintainerController_1 = require("../controllers/MaintainerController");
const verifyToken_1 = require("../middleware/verifyToken");
const MaintainerController_2 = require("../controllers/MaintainerController");
const IssueIngestController_1 = require("../ingesters/IssueIngestController");
const PRIngesterController_1 = require("../ingesters/PRIngesterController");
const OrgApiIngester_1 = require("../ingesters/OrgApiIngester");
const MaintainerIssues_1 = __importDefault(require("../model/MaintainerIssues"));
const generateApiKey_1 = require("../utils/generateApiKey");
const router = (0, express_1.Router)();
router.use(verifyToken_1.verifyToken);
const getOrgsByUsername = async (req, res) => {
    try {
        console.log("---- Incoming request to /orgs-by-username ----");
        console.log("Query params:", req.query);
        console.log("-----------------------------------------------");
        const { githubUsername } = req.query;
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
        const orgs = await (0, MaintainerController_1.listOrgRepos)(githubUsername, token);
        res.status(200).json({ success: true, data: orgs });
    }
    catch (err) {
        console.error("Error fetching orgs:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getOrgsByUsername = getOrgsByUsername;
// NEW: GET /api/maintainer/repos-by-username?githubUsername=theuser&per_page=30&page=1
const getReposByUsername = async (req, res) => {
    try {
        console.log("---- Incoming request to /repos-by-username ----");
        console.log("Query params:", req.query);
        console.log("-----------------------------------------------");
        const { githubUsername, per_page = 30, page = 1 } = req.query;
        if (!githubUsername) {
            res.status(400).json({ success: false, message: "githubUsername is required" });
            return;
        }
        // Fetch repos using your new utility
        const repos = await (0, MaintainerController_1.listUserRepos)(githubUsername, Number(per_page), Number(page));
        res.status(200).json({ success: true, data: repos });
    }
    catch (err) {
        console.error("Error fetching repos:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
const getRepoIssues = async (req, res) => {
    try {
        const { owner, repo, state = "open", per_page = 30, page = 1 } = req.query;
        if (!owner || !repo) {
            res.status(400).json({ success: false, message: "owner and repo are required" });
            return;
        }
        const issues = await (0, MaintainerController_1.listRepoIssues)(owner, repo, state, Number(per_page), Number(page));
        res.status(200).json({ success: true, data: issues });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const createIssue = async (req, res) => {
    try {
        const { owner, repo, title, body, labels, assignees, milestone, } = req.body;
        // 1) Validate
        if (!owner || !repo || !title) {
            res
                .status(400)
                .json({ success: false, message: "owner, repo and title are required" });
            return;
        }
        // 2) Try user’s OAuth token
        let githubToken = req.user?.accessToken;
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
        const issue = await (0, MaintainerController_2.createRepoIssueAsUser)(githubToken, owner, repo, title, body, labels, assignees, milestone);
        // 5) Return it
        res.status(201).json({ success: true, data: issue });
        return;
    }
    catch (err) {
        console.error("Error in createIssue handler:", err);
        res.status(500).json({ success: false, message: err.message });
        return;
    }
};
exports.createIssue = createIssue;
const getRepoPullRequests = async (req, res) => {
    try {
        const { owner, repo, state = "open", per_page = "30", page = "1" } = req.query;
        if (!owner || !repo) {
            res.status(400).json({ success: false, message: "owner and repo are required" });
            return;
        }
        const pullRequests = await (0, MaintainerController_1.listRepoPullRequests)(owner, repo, state, Number(per_page), Number(page));
        res.status(200).json({ success: true, data: pullRequests });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
const mergePullRequest = async (req, res) => {
    try {
        console.log("🏷️  Payload for merge-pr:", req.body);
        // pull in either prNumber or pull_number
        const pull_number = typeof req.body.pull_number === "number"
            ? req.body.pull_number
            : req.body.prNumber;
        const { owner, repo, author, staking, xp } = req.body;
        if (!owner || !repo || typeof pull_number !== "number") {
            res
                .status(400)
                .json({ success: false, message: "owner, repo, and pull_number are required" });
            return;
        }
        // everything else unchanged…
        let githubToken = req.user?.accessToken;
        if (!githubToken)
            githubToken = process.env.GITHUB_ISSUE_CREATION;
        if (!githubToken) {
            res
                .status(403)
                .json({ success: false, message: "No GitHub token available to merge PR" });
            return;
        }
        const result = await (0, MaintainerController_1.mergePullRequestAsUser)(githubToken, owner, repo, pull_number);
        res.status(200).json({ success: true, data: result });
        return;
    }
    catch (err) {
        console.error("❌ Error merging PR:", err);
        res.status(500).json({ success: false, message: err.message });
        return;
    }
};
exports.mergePullRequest = mergePullRequest;
const getMaintainerIssueById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            res.status(400).json({
                success: false,
                message: "Query parameter `id` is required",
            });
            return;
        }
        const numericId = Number(id);
        if (Number.isNaN(numericId)) {
            res.status(400).json({
                success: false,
                message: "`id` must be a number",
            });
            return;
        }
        const issue = await MaintainerIssues_1.default.findOne({ id: numericId });
        if (!issue) {
            res.status(404).json({
                success: false,
                message: `No ingested issue found with GitHub id ${numericId}`,
            });
            return;
        }
        res.status(200).json({ success: true, data: issue });
        return;
    }
    catch (err) {
        console.error("Error fetching issue by id:", err);
        res.status(500).json({ success: false, message: err.message });
        return;
    }
};
exports.getMaintainerIssueById = getMaintainerIssueById;
router.patch("/users/update-stats", async (req, res, next) => {
    try {
        const { githubUsername, addedXp, addedCoins } = req.body;
        const result = await (0, MaintainerController_1.updateUserStatsAsUser)(githubUsername, addedXp, addedCoins);
        res.json({ success: true, ...result });
    }
    catch (err) {
        next(err);
    }
});
router.post("/api-key", 
// 0️⃣ Log everything the frontend sent
(req, res, next) => {
    console.log("📥 api-key request body:", req.body);
    next();
}, 
// 1️⃣ Validate & generate
(req, res, next) => {
    const { orgName } = req.body;
    if (!orgName) {
        console.log("❌ api-key: Missing orgName in request body");
        res.status(400).json({ success: false, message: "orgName required" });
        return;
    }
    const secretKey = (0, generateApiKey_1.generateApiKey)(orgName);
    console.log(`✅ api-key generated for org "${orgName}": ${secretKey}`);
    req.body.secretKey = secretKey;
    next(); // ← hand off to the next middleware
}, 
// 2️⃣ Ingest into MongoDB
OrgApiIngester_1.ingestApiKey);
router.get("/orgs-by-username", exports.getOrgsByUsername);
router.get("/repos-by-username", getReposByUsername); // <-- Register your new route
router.get("/repo-issues", getRepoIssues);
router.post("/create-issue", exports.createIssue);
router.post("/ingest-issue", IssueIngestController_1.ingestIssue);
router.get("/repo-pulls", getRepoPullRequests);
router.get("/issue-by-number", MaintainerController_1.getIssueByNumber);
router.post("/merge-pr", exports.mergePullRequest);
router.get("/issue-by-id", exports.getMaintainerIssueById);
router.post("/ingest-merged-pr", PRIngesterController_1.ingestMergedPR);
router.post("/ingest-apikey", OrgApiIngester_1.ingestApiKey);
router.get("/api-keys", MaintainerController_1.getOrgApiKeys);
exports.default = router;
//# sourceMappingURL=MaintainerRoutes.js.map