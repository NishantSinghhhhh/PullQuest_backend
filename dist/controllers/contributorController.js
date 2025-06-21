"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContributorController = void 0;
const core_1 = require("@octokit/core");
const githubRepositories_1 = __importDefault(require("../model/githubRepositories"));
const githubIssues_1 = __importDefault(require("../model/githubIssues"));
const githubService_1 = require("../services/githubService");
const User_1 = __importDefault(require("../model/User"));
const stake_1 = __importDefault(require("../model/stake"));
class ContributorController {
    constructor() {
        /**
         * Analyze user's GitHub repositories using access token from authenticated user
         */
        this.analyzeUserRepositories = async (req, res) => {
            try {
                // Get user info from JWT token (set by auth middleware)
                const authUser = req.user;
                if (!authUser) {
                    res.status(401).json({
                        success: false,
                        message: "Authentication required",
                    });
                    return;
                }
                // Get user from database to get access token
                const user = await User_1.default.findById(authUser.id);
                if (!user || !user.accessToken) {
                    res.status(400).json({
                        success: false,
                        message: "GitHub access token not found. Please re-authenticate.",
                    });
                    return;
                }
                const userId = user._id;
                const githubUsername = user.githubUsername;
                if (!githubUsername) {
                    res.status(400).json({
                        success: false,
                        message: "GitHub username not found in user profile",
                    });
                    return;
                }
                // Check for recent analysis
                const existingAnalysis = await githubRepositories_1.default.findOne({
                    userId,
                    githubUsername,
                    lastAnalyzed: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                });
                if (existingAnalysis) {
                    res.status(200).json({
                        success: true,
                        message: "Repository analysis retrieved from cache",
                        fromCache: true,
                        data: {
                            repositories: existingAnalysis.repositories,
                            organizations: existingAnalysis.organizations,
                            topLanguages: existingAnalysis.topLanguages,
                            lastAnalyzed: existingAnalysis.lastAnalyzed,
                        },
                    });
                    return;
                }
                // Use user's access token for GitHub API calls
                const repositories = await this.listUserRepos(githubUsername, user.accessToken);
                if (repositories.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "No public repositories found",
                    });
                    return;
                }
                // Get user organizations
                const organizations = await this.listUserOrgs(githubUsername, user.accessToken);
                const orgNames = organizations.map(org => org.login);
                // Fetch language data for each repository
                const languagesData = {};
                const processedRepos = [];
                for (const repo of repositories.slice(0, 20)) { // Limit to avoid rate limits
                    try {
                        // Get languages for this repository
                        const languages = await this.getRepositoryLanguages(repo.owner.login, repo.name, user.accessToken);
                        languagesData[repo.full_name] = languages;
                        // Process repository data
                        processedRepos.push({
                            id: repo.id,
                            name: repo.name,
                            fullName: repo.full_name,
                            htmlUrl: repo.html_url,
                            description: repo.description,
                            language: repo.language,
                            stargazersCount: repo.stargazers_count,
                            forksCount: repo.forks_count,
                            size: repo.size,
                            createdAt: new Date(repo.created_at),
                            updatedAt: new Date(repo.updated_at),
                            topics: repo.topics || [],
                            visibility: repo.visibility,
                        });
                        // Small delay to avoid rate limiting
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                    catch (error) {
                        console.error(`Error processing repository ${repo.full_name}:`, error);
                        languagesData[repo.full_name] = {};
                    }
                }
                // Calculate language statistics
                const { languageStats, topLanguages } = this.calculateLanguageStats(processedRepos, languagesData);
                // Save analysis with organizations
                const analysis = await githubRepositories_1.default.findOneAndUpdate({ userId, githubUsername }, {
                    userId,
                    githubUsername,
                    repositories: processedRepos,
                    organizations: orgNames,
                    languageStats,
                    topLanguages,
                    lastAnalyzed: new Date(),
                }, { upsert: true, new: true });
                res.status(200).json({
                    success: true,
                    message: "Repository analysis completed",
                    data: {
                        repositories: analysis.repositories,
                        organizations: analysis.organizations,
                        topLanguages: analysis.topLanguages,
                        lastAnalyzed: analysis.lastAnalyzed,
                        totalRepositories: processedRepos.length,
                    },
                });
            }
            catch (error) {
                console.error("Repository analysis error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to analyze repositories",
                    error: error.message,
                });
            }
        };
        /**
         * Get suggested issues based on user's top languages and organizations
         */
        this.getSuggestedIssues = async (req, res) => {
            try {
                // Get user info from JWT token
                const authUser = req.user;
                if (!authUser) {
                    res.status(401).json({
                        success: false,
                        message: "Authentication required",
                    });
                    return;
                }
                // Get user from database
                const user = await User_1.default.findById(authUser.id);
                if (!user || !user.accessToken) {
                    res.status(400).json({
                        success: false,
                        message: "GitHub access token not found. Please re-authenticate.",
                    });
                    return;
                }
                const { page = 1, perPage = 20 } = req.query;
                const userId = user._id;
                const githubUsername = user.githubUsername;
                // Get user's language analysis
                const userAnalysis = await githubRepositories_1.default.findOne({
                    userId,
                    githubUsername,
                });
                if (!userAnalysis || userAnalysis.topLanguages.length === 0) {
                    res.status(404).json({
                        success: false,
                        message: "No language analysis found. Please analyze your repositories first.",
                    });
                    return;
                }
                console.log("Top Languages:", userAnalysis.topLanguages);
                console.log("Organizations:", userAnalysis.organizations);
                // Search for issues using GitHub API with user's access token
                const issues = await this.searchGitHubIssues(userAnalysis.topLanguages, userAnalysis.organizations, user.accessToken, {
                    page: Number(page),
                    perPage: Number(perPage),
                });
                // Enhance issues with bounty and XP data
                const enhancedIssues = issues.map(issue => ({
                    ...issue,
                    bounty: this.calculateBounty(issue),
                    xpReward: this.calculateXPReward(issue),
                    stakingRequired: Math.floor(this.calculateBounty(issue) * 0.3),
                }));
                res.status(200).json({
                    success: true,
                    message: "Suggested issues fetched",
                    data: {
                        issues: enhancedIssues,
                        totalIssues: enhancedIssues.length,
                        userTopLanguages: userAnalysis.topLanguages,
                        userOrganizations: userAnalysis.organizations,
                        page: Number(page),
                        perPage: Number(perPage),
                    },
                });
            }
            catch (error) {
                console.error("Get suggested issues error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch issues",
                    error: error.message,
                });
            }
        };
        /**
         * Get detailed information about a specific issue
         */
        this.getIssueDetails = async (req, res) => {
            try {
                const { issueId } = req.params;
                const { userId, githubUsername } = req.body;
                if (!issueId) {
                    res.status(400).json({ success: false, message: "Issue ID required" });
                    return;
                }
                // Try to find issue in cached data first
                const cachedIssues = await githubIssues_1.default.findOne({
                    userId,
                    githubUsername,
                });
                let issue = cachedIssues?.suggestedIssues.find((i) => i.id.toString() === issueId);
                if (issue) {
                    res.status(200).json({
                        success: true,
                        data: {
                            issue,
                            bounty: {
                                coins: this.calculateBounty(issue),
                                xp: this.calculateXPReward(issue),
                                stakingRequired: Math.floor(this.calculateBounty(issue) * 0.3),
                            },
                        },
                    });
                    return;
                }
                // If not in cache, try to fetch from GitHub directly
                // This is a fallback for when issues aren't cached
                res.status(404).json({
                    success: false,
                    message: "Issue not found. Please refresh the issues list and try again."
                });
            }
            catch (error) {
                console.error("Get issue details error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch issue details",
                    error: error.message,
                });
            }
        };
        this.getContributorProfile = async (req, res) => {
            try {
                const { userId } = req.params;
                const user = await User_1.default.findById(userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                    return;
                }
                // Parse GitHub info if it's stored as a string
                let githubInfo = {};
                if (user.githubInfo) {
                    try {
                        githubInfo = typeof user.githubInfo === 'string'
                            ? JSON.parse(user.githubInfo)
                            : user.githubInfo;
                    }
                    catch (e) {
                        console.error("Error parsing GitHub info:", e);
                    }
                }
                const stakes = await stake_1.default.find({ userId })
                    .sort({ createdAt: -1 })
                    .limit(5);
                res.status(200).json({
                    success: true,
                    data: {
                        profile: {
                            _id: user._id,
                            email: user.email,
                            githubUsername: user.githubUsername,
                            githubInfo,
                            profile: user.profile,
                            coins: user.coins,
                            xp: user.xp || 0,
                            rank: user.rank || "Code Novice",
                            createdAt: user.createdAt,
                            isActive: user.isActive,
                            lastLogin: user.lastLogin,
                        },
                        stats: {
                            coins: user.coins,
                            xp: user.xp || 0,
                            rank: user.rank || "Code Novice",
                        },
                        recentStakes: stakes,
                    },
                });
            }
            catch (error) {
                console.error("Get contributor profile error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to get profile",
                    error: error.message,
                });
            }
        };
        this.prepareStake = async (req, res) => {
            try {
                const { issueId } = req.body;
                const issue = await githubIssues_1.default.findOne({
                    "suggestedIssues.id": issueId,
                });
                if (!issue) {
                    res.status(404).json({ success: false, message: "Issue not found" });
                    return;
                }
                const issueDetails = issue.suggestedIssues.find((i) => i.id === issueId);
                const stakeAmount = issueDetails?.stakingRequired || 0;
                res.status(200).json({
                    success: true,
                    data: {
                        stakeAmount,
                        potentialReward: issueDetails?.bounty || 0,
                        xpReward: issueDetails?.xpReward || 0,
                    },
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to prepare stake",
                    error: error.message,
                });
            }
        };
        this.githubService = new githubService_1.GitHubService(process.env.GITHUB_TOKEN);
    }
    /**
     * List user repositories using GitHub API with access token
     */
    async listUserRepos(username, accessToken, perPage = 30, page = 1) {
        if (!username) {
            throw new Error("GitHub username is required");
        }
        const octokit = new core_1.Octokit({
            auth: accessToken,
            userAgent: "PullQuest-Backend v1.0.0",
        });
        try {
            const { data } = await octokit.request('GET /users/{username}/repos', {
                username,
                per_page: perPage,
                page,
                type: 'owner',
                sort: 'updated',
                direction: 'desc',
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            });
            return data;
        }
        catch (error) {
            console.error("GitHub API Error:", error);
            if (error.status === 401) {
                throw new Error("Invalid GitHub access token");
            }
            if (error.status === 403) {
                throw new Error("GitHub API rate limit exceeded or insufficient permissions");
            }
            if (error.status === 404) {
                throw new Error("User not found or repositories are private");
            }
            if (error.status === 422) {
                throw new Error("Invalid username");
            }
            if (error.status >= 500) {
                throw new Error("GitHub API server error. Please try again later");
            }
            throw new Error(`GitHub API error: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * List user organizations using GitHub API with access token
     */
    async listUserOrgs(username, accessToken, perPage = 30, page = 1) {
        const octokit = new core_1.Octokit({
            auth: accessToken,
            userAgent: "PullQuest-Backend v1.0.0",
        });
        try {
            const { data } = await octokit.request('GET /users/{username}/orgs', {
                username: username,
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                per_page: perPage,
                page,
            });
            return data;
        }
        catch (error) {
            console.error("GitHub API Error:", error);
            // Handle specific GitHub API errors
            if (error.status === 401) {
                throw new Error("Invalid GitHub access token");
            }
            if (error.status === 403) {
                throw new Error("GitHub API rate limit exceeded or insufficient permissions");
            }
            if (error.status === 404) {
                // Organizations might be private or user might not have any
                return [];
            }
            if (error.status === 422) {
                throw new Error("Invalid username");
            }
            if (error.status >= 500) {
                throw new Error("GitHub API server error. Please try again later");
            }
            throw new Error(`GitHub API error: ${error.message || 'Unknown error'}`);
        }
    }
    /**
     * Get repository languages using GitHub API with access token
     */
    async getRepositoryLanguages(owner, repo, accessToken) {
        const octokit = new core_1.Octokit({
            auth: accessToken,
            userAgent: "PullQuest-Backend v1.0.0",
        });
        try {
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/languages', {
                owner,
                repo,
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            });
            return data;
        }
        catch (error) {
            console.error(`Error fetching languages for ${owner}/${repo}:`, error);
            return {};
        }
    }
    /**
     * Calculate language statistics from repositories
     */
    calculateLanguageStats(repositories, languagesData) {
        const languageMap = new Map();
        // Process each repository's languages
        repositories.forEach((repo) => {
            const repoLanguages = languagesData[repo.fullName] || {};
            Object.entries(repoLanguages).forEach(([language, bytes]) => {
                if (languageMap.has(language)) {
                    const existing = languageMap.get(language);
                    existing.count += 1;
                    existing.totalBytes += bytes;
                }
                else {
                    languageMap.set(language, { count: 1, totalBytes: bytes });
                }
            });
        });
        // Calculate total bytes across all languages
        const totalBytes = Array.from(languageMap.values()).reduce((sum, lang) => sum + lang.totalBytes, 0);
        // Create language stats with percentages
        const languageStats = new Map();
        languageMap.forEach((data, language) => {
            languageStats.set(language, {
                count: data.count,
                percentage: totalBytes > 0 ? (data.totalBytes / totalBytes) * 100 : 0,
                totalBytes: data.totalBytes,
            });
        });
        // Get top languages (sorted by total bytes)
        const topLanguages = Array.from(languageStats.entries())
            .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
            .slice(0, 5)
            .map(([language]) => language);
        return { languageStats, topLanguages };
    }
    /**
     * Search GitHub issues using direct API calls with access token
     */
    async searchGitHubIssues(languages, organizations, accessToken, options = {}) {
        const { page = 1, perPage = 20 } = options;
        const octokit = new core_1.Octokit({
            auth: accessToken,
            userAgent: "PullQuest-Backend v1.0.0",
        });
        // Build search query
        let queryParts = ["state:open", "type:issue"];
        // Add language filters
        if (languages.length > 0) {
            const langQuery = languages
                .slice(0, 3) // Limit to 3 languages to avoid query length issues
                .map((lang) => `language:"${lang}"`)
                .join(" OR ");
            queryParts.push(`(${langQuery})`);
        }
        // Add organization filters
        if (organizations.length > 0) {
            const orgQuery = organizations
                .slice(0, 3) // Limit to 3 organizations
                .map((org) => `org:"${org}"`)
                .join(" OR ");
            queryParts.push(`(${orgQuery})`);
        }
        // Add good first issue labels
        queryParts.push(`label:"good first issue" OR label:"help wanted" OR label:"beginner-friendly"`);
        const query = queryParts.join(" ");
        console.log("GitHub Search Query:", query);
        try {
            const { data } = await octokit.request('GET /search/issues', {
                q: query,
                sort: "updated",
                order: "desc",
                page,
                per_page: perPage,
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            });
            return data.items.map((issue) => ({
                id: issue.id,
                number: issue.number,
                title: issue.title,
                body: issue.body,
                state: issue.state,
                htmlUrl: issue.html_url,
                user: {
                    id: issue.user.id,
                    login: issue.user.login,
                    avatarUrl: issue.user.avatar_url,
                    htmlUrl: issue.user.html_url,
                    type: issue.user.type,
                },
                labels: issue.labels?.map((label) => ({
                    id: label.id,
                    name: label.name,
                    color: label.color,
                    description: label.description,
                })) || [],
                assignee: issue.assignee ? {
                    id: issue.assignee.id,
                    login: issue.assignee.login,
                    avatarUrl: issue.assignee.avatar_url,
                    htmlUrl: issue.assignee.html_url,
                    type: issue.assignee.type,
                } : undefined,
                assignees: issue.assignees?.map((assignee) => ({
                    id: assignee.id,
                    login: assignee.login,
                    avatarUrl: assignee.avatar_url,
                    htmlUrl: assignee.html_url,
                    type: assignee.type,
                })) || [],
                milestone: issue.milestone ? {
                    id: issue.milestone.id,
                    title: issue.milestone.title,
                    description: issue.milestone.description,
                    state: issue.milestone.state,
                    dueOn: issue.milestone.due_on ? new Date(issue.milestone.due_on) : undefined,
                } : undefined,
                commentsCount: issue.comments,
                createdAt: new Date(issue.created_at),
                updatedAt: new Date(issue.updated_at),
                closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
                authorAssociation: issue.author_association,
                repository: {
                    id: parseInt(issue.repository_url.split("/").pop() || "0"),
                    name: issue.repository_url.split("/").pop() || "",
                    fullName: issue.repository_url.split("/").slice(-2).join("/"),
                    htmlUrl: issue.html_url.split("/issues/")[0],
                    language: undefined,
                    stargazersCount: 0,
                    forksCount: 0,
                    description: undefined,
                },
                difficulty: this.estimateDifficulty(issue),
                estimatedHours: this.estimateHours(issue),
            }));
        }
        catch (error) {
            console.error("GitHub search error:", error);
            throw new Error(`Failed to search GitHub issues: ${error.message}`);
        }
    }
    /**
     * Estimate issue difficulty based on labels and content
     */
    estimateDifficulty(issue) {
        const beginnerLabels = [
            "good first issue",
            "beginner",
            "easy",
            "starter",
            "beginner-friendly",
        ];
        const advancedLabels = ["complex", "advanced", "hard", "expert"];
        const labels = issue.labels?.map((label) => label.name.toLowerCase()) || [];
        if (labels.some((label) => beginnerLabels.some((bl) => label.includes(bl)))) {
            return "beginner";
        }
        if (labels.some((label) => advancedLabels.some((al) => label.includes(al)))) {
            return "advanced";
        }
        return "intermediate";
    }
    /**
     * Estimate hours needed based on issue complexity
     */
    estimateHours(issue) {
        const bodyLength = issue.body?.length || 0;
        const commentsCount = issue.comments || 0;
        if (bodyLength < 200 && commentsCount < 5) {
            return Math.random() * 3 + 1; // 1-4 hours
        }
        else if (bodyLength < 500 && commentsCount < 15) {
            return Math.random() * 8 + 4; // 4-12 hours
        }
        else {
            return Math.random() * 20 + 12; // 12-32 hours
        }
    }
    calculateBounty(issue) {
        const baseBounty = 10;
        const difficultyMultiplier = {
            beginner: 1,
            intermediate: 1.5,
            advanced: 2,
        };
        const difficulty = issue.difficulty || "intermediate";
        const multiplier = difficultyMultiplier[difficulty] || difficultyMultiplier.intermediate;
        return Math.round(baseBounty *
            multiplier *
            (1 + (issue.repository?.stargazersCount || 0) / 1000));
    }
    calculateXPReward(issue) {
        const difficulty = issue.difficulty || "intermediate";
        switch (difficulty) {
            case "beginner":
                return 50;
            case "intermediate":
                return 100;
            case "advanced":
                return 150;
            default:
                return 100;
        }
    }
}
exports.ContributorController = ContributorController;
