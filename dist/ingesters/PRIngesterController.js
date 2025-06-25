"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestMergedPR = void 0;
const User_1 = __importDefault(require("../model/User"));
const rest_1 = require("@octokit/rest");
const MergedPrs_1 = __importDefault(require("../model/MergedPrs")); // Import the MergedPR model
const ingestMergedPR = async (req, res) => {
    try {
        const { userId, githubUsername, repository, pr: ghPR, userAccessToken, 
        // Additional fields for bounty/rewards
        difficulty, estimatedHours, bounty, xpReward, stakingRequired, addedXp, coinsAdded, linkedIssues, expirationDate, 
        // Merge quality metrics
        conflictsResolved, ciPassed, reviewsApproved, reviewsChangesRequested, } = req.body;
        console.log("Ingest merged PR request body:", {
            hasUserId: !!userId,
            hasGithubUsername: !!githubUsername,
            hasRepository: !!repository,
            hasPR: !!ghPR,
            repository,
            githubUsername,
            prId: ghPR?.id,
            prNumber: ghPR?.number,
            merged: ghPR?.merged,
            addedXp,
            coinsAdded,
        });
        // Add validation
        if (!ghPR || !githubUsername || !repository) {
            console.error("Missing required fields:", {
                githubUsername: !!githubUsername,
                repository: !!repository,
                pr: !!ghPR
            });
            res.status(400).json({
                success: false,
                message: "Missing required fields: githubUsername, repository, or PR data"
            });
            return;
        }
        // Validate PR data
        if (!ghPR.id || !ghPR.number) {
            console.error("Invalid PR data: missing id or number");
            res.status(400).json({
                success: false,
                message: "Invalid PR data: missing id or number"
            });
            return;
        }
        // Validate that PR is actually merged
        if (!ghPR.merged || !ghPR.merged_at) {
            console.error("PR is not merged or missing merge data");
            res.status(400).json({
                success: false,
                message: "PR must be merged to be ingested"
            });
            return;
        }
        // 1) Find user by githubUsername
        console.log(`Looking up user with githubUsername: ${githubUsername}`);
        const user = await User_1.default.findOne({ githubUsername }).select("_id githubUsername email role");
        if (!user) {
            console.error(`User not found with githubUsername: ${githubUsername}`);
            res.status(404).json({
                success: false,
                message: `User not found with GitHub username: ${githubUsername}`
            });
            return;
        }
        const actualUserId = user._id.toString();
        console.log(`Found user: ${actualUserId} (${user.githubUsername})`);
        // 2) Check if merged PR already exists
        const existingPR = await MergedPrs_1.default.findOne({ id: ghPR.id });
        if (existingPR) {
            console.log(`Merged PR ${ghPR.id} already exists, updating...`);
            // Update existing merged PR with new data
            const updatedPR = await MergedPrs_1.default.findOneAndUpdate({ id: ghPR.id }, {
                // Update core fields that might change
                title: ghPR.title || existingPR.title,
                body: ghPR.body !== undefined ? ghPR.body : existingPR.body,
                state: ghPR.state || existingPR.state,
                updatedAt: ghPR.updated_at ? new Date(ghPR.updated_at) : new Date(),
                closedAt: ghPR.closed_at ? new Date(ghPR.closed_at) : existingPR.closedAt,
                // Update reward fields if provided
                ...(addedXp !== undefined && { addedXp }),
                ...(coinsAdded !== undefined && { coinsAdded }),
                ...(stakingRequired !== undefined && { stakingRequired }),
                ...(difficulty && { difficulty }),
                ...(estimatedHours !== undefined && { estimatedHours }),
                ...(bounty !== undefined && { bounty }),
                ...(xpReward !== undefined && { xpReward }),
                ...(linkedIssues && { linkedIssues }),
                ...(expirationDate && { expirationDate: new Date(expirationDate) }),
                // Update merge quality metrics
                ...(conflictsResolved !== undefined && { conflictsResolved }),
                ...(ciPassed !== undefined && { ciPassed }),
                ...(reviewsApproved !== undefined && { reviewsApproved }),
                ...(reviewsChangesRequested !== undefined && { reviewsChangesRequested }),
            }, { new: true, runValidators: true });
            res.status(200).json({
                success: true,
                prId: updatedPR.id,
                prNumber: updatedPR.number,
                repository: updatedPR.repository.fullName,
                addedXp: updatedPR.addedXp,
                coinsAdded: updatedPR.coinsAdded,
                message: "Merged PR updated successfully",
                updated: true
            });
            return;
        }
        // 3) Fetch additional PR data if needed (reviews, commits, etc.)
        let prReviews = [];
        let prCommits = [];
        if (userAccessToken) {
            try {
                console.log(`Fetching additional PR data for ${repository.owner}/${repository.repo}#${ghPR.number}`);
                const octokit = new rest_1.Octokit({ auth: userAccessToken });
                // Fetch reviews
                const { data: reviews } = await octokit.rest.pulls.listReviews({
                    owner: repository.owner,
                    repo: repository.repo,
                    pull_number: ghPR.number,
                });
                prReviews = reviews;
                // Fetch commits
                const { data: commits } = await octokit.rest.pulls.listCommits({
                    owner: repository.owner,
                    repo: repository.repo,
                    pull_number: ghPR.number,
                });
                prCommits = commits;
                console.log(`Fetched ${reviews.length} reviews and ${commits.length} commits`);
            }
            catch (fetchError) {
                console.warn("Could not fetch additional PR data:", fetchError.message);
            }
        }
        // 4) Get repository data
        let repositoryData = ghPR.head?.repo || ghPR.base?.repo;
        if (!repositoryData && userAccessToken) {
            try {
                console.log(`Fetching repository data for ${repository.owner}/${repository.repo}`);
                const octokit = new rest_1.Octokit({ auth: userAccessToken });
                const { data: repoData } = await octokit.rest.repos.get({
                    owner: repository.owner,
                    repo: repository.repo,
                });
                repositoryData = repoData;
                console.log("Repository data fetched successfully");
            }
            catch (repoError) {
                console.warn("Could not fetch repository data:", repoError.message);
            }
        }
        // 5) Create new MergedPR document
        const newMergedPR = new MergedPrs_1.default({
            // Core PR fields
            id: ghPR.id,
            number: ghPR.number,
            title: ghPR.title || "Untitled PR",
            body: ghPR.body || "",
            state: ghPR.state || "closed",
            htmlUrl: ghPR.html_url || "",
            // User fields
            user: ghPR.user ? {
                id: ghPR.user.id,
                login: ghPR.user.login,
                avatarUrl: ghPR.user.avatar_url || "",
                htmlUrl: ghPR.user.html_url || "",
                type: ghPR.user.type || "User",
            } : {
                id: 0,
                login: "unknown",
                avatarUrl: "",
                htmlUrl: "",
                type: "User",
            },
            // Assignee and assignees
            assignee: ghPR.assignee ? {
                id: ghPR.assignee.id,
                login: ghPR.assignee.login,
                avatarUrl: ghPR.assignee.avatar_url || "",
                htmlUrl: ghPR.assignee.html_url || "",
                type: ghPR.assignee.type || "User",
            } : undefined,
            assignees: (ghPR.assignees || []).map((u) => ({
                id: u.id,
                login: u.login,
                avatarUrl: u.avatar_url || "",
                htmlUrl: u.html_url || "",
                type: u.type || "User",
            })),
            // Labels
            labels: (ghPR.labels || []).map((lbl) => ({
                id: lbl?.id || 0,
                name: lbl?.name || "",
                color: lbl?.color || "000000",
                description: lbl?.description || "",
            })),
            // Milestone
            milestone: ghPR.milestone ? {
                id: ghPR.milestone.id,
                title: ghPR.milestone.title || "",
                description: ghPR.milestone.description || "",
                state: ghPR.milestone.state || "open",
                dueOn: ghPR.milestone.due_on ? new Date(ghPR.milestone.due_on) : undefined,
            } : undefined,
            // Repository data
            repository: repositoryData ? {
                id: repositoryData.id,
                name: repositoryData.name,
                fullName: repositoryData.full_name || `${repository.owner}/${repository.repo}`,
                htmlUrl: repositoryData.html_url || `https://github.com/${repository.owner}/${repository.repo}`,
                language: repositoryData.language || "",
                stargazersCount: repositoryData.stargazers_count || 0,
                forksCount: repositoryData.forks_count || 0,
                description: repositoryData.description || "",
            } : {
                id: 0,
                name: repository.repo,
                fullName: `${repository.owner}/${repository.repo}`,
                htmlUrl: `https://github.com/${repository.owner}/${repository.repo}`,
                language: "",
                stargazersCount: 0,
                forksCount: 0,
                description: "",
            },
            // PR specific fields
            head: {
                ref: ghPR.head?.ref || "unknown",
                sha: ghPR.head?.sha || "",
                repo: repositoryData ? {
                    id: repositoryData.id,
                    name: repositoryData.name,
                    fullName: repositoryData.full_name || `${repository.owner}/${repository.repo}`,
                    htmlUrl: repositoryData.html_url || `https://github.com/${repository.owner}/${repository.repo}`,
                    language: repositoryData.language || "",
                    stargazersCount: repositoryData.stargazers_count || 0,
                    forksCount: repositoryData.forks_count || 0,
                    description: repositoryData.description || "",
                } : {
                    id: 0,
                    name: repository.repo,
                    fullName: `${repository.owner}/${repository.repo}`,
                    htmlUrl: `https://github.com/${repository.owner}/${repository.repo}`,
                    language: "",
                    stargazersCount: 0,
                    forksCount: 0,
                    description: "",
                },
            },
            base: {
                ref: ghPR.base?.ref || "main",
                sha: ghPR.base?.sha || "",
                repo: repositoryData ? {
                    id: repositoryData.id,
                    name: repositoryData.name,
                    fullName: repositoryData.full_name || `${repository.owner}/${repository.repo}`,
                    htmlUrl: repositoryData.html_url || `https://github.com/${repository.owner}/${repository.repo}`,
                    language: repositoryData.language || "",
                    stargazersCount: repositoryData.stargazers_count || 0,
                    forksCount: repositoryData.forks_count || 0,
                    description: repositoryData.description || "",
                } : {
                    id: 0,
                    name: repository.repo,
                    fullName: `${repository.owner}/${repository.repo}`,
                    htmlUrl: `https://github.com/${repository.owner}/${repository.repo}`,
                    language: "",
                    stargazersCount: 0,
                    forksCount: 0,
                    description: "",
                },
            },
            // Merge information
            merged: ghPR.merged || true,
            mergedAt: new Date(ghPR.merged_at),
            mergedBy: ghPR.merged_by ? {
                id: ghPR.merged_by.id,
                login: ghPR.merged_by.login,
                avatarUrl: ghPR.merged_by.avatar_url || "",
                htmlUrl: ghPR.merged_by.html_url || "",
                type: ghPR.merged_by.type || "User",
            } : {
                id: 0,
                login: "unknown",
                avatarUrl: "",
                htmlUrl: "",
                type: "User",
            },
            mergeCommitSha: ghPR.merge_commit_sha || "",
            // PR statistics
            commits: ghPR.commits || 0,
            additions: ghPR.additions || 0,
            deletions: ghPR.deletions || 0,
            changedFiles: ghPR.changed_files || 0,
            commentsCount: ghPR.comments || 0,
            reviewCommentsCount: ghPR.review_comments || 0,
            // Review information
            reviewRequests: (ghPR.requested_reviewers || []).map((reviewer) => ({
                user: {
                    id: reviewer.id,
                    login: reviewer.login,
                    avatarUrl: reviewer.avatar_url || "",
                    htmlUrl: reviewer.html_url || "",
                    type: reviewer.type || "User",
                },
                requestedAt: new Date(), // GitHub doesn't provide this timestamp
            })),
            reviews: prReviews.map((review) => ({
                id: review.id,
                user: {
                    id: review.user.id,
                    login: review.user.login,
                    avatarUrl: review.user.avatar_url || "",
                    htmlUrl: review.user.html_url || "",
                    type: review.user.type || "User",
                },
                state: review.state,
                body: review.body || "",
                submittedAt: new Date(review.submitted_at),
                htmlUrl: review.html_url || "",
            })),
            // Commit information
            commitsList: prCommits.map((commit) => ({
                sha: commit.sha,
                message: commit.commit.message,
                author: {
                    name: commit.commit.author.name,
                    email: commit.commit.author.email,
                    date: new Date(commit.commit.author.date),
                },
                url: commit.html_url || "",
            })),
            // Timestamps
            createdAt: ghPR.created_at ? new Date(ghPR.created_at) : new Date(),
            updatedAt: ghPR.updated_at ? new Date(ghPR.updated_at) : new Date(),
            closedAt: ghPR.closed_at ? new Date(ghPR.closed_at) : new Date(),
            // GitHub specific
            authorAssociation: ghPR.author_association || "NONE",
            isDraft: ghPR.draft || false,
            // Bounty/Reward fields
            difficulty: difficulty,
            estimatedHours: estimatedHours,
            bounty: bounty,
            xpReward: xpReward,
            stakingRequired: stakingRequired || 0,
            // New reward fields for merged PRs
            addedXp: addedXp || 0,
            coinsAdded: coinsAdded || 0,
            // Additional tracking
            linkedIssues: linkedIssues || [],
            expirationDate: expirationDate ? new Date(expirationDate) : undefined,
            // Merge quality metrics
            conflictsResolved: conflictsResolved || false,
            ciPassed: ciPassed !== undefined ? ciPassed : true,
            reviewsApproved: reviewsApproved || prReviews.filter(r => r.state === "APPROVED").length,
            reviewsChangesRequested: reviewsChangesRequested || prReviews.filter(r => r.state === "CHANGES_REQUESTED").length,
        });
        // 6) Save the new MergedPR
        const savedPR = await newMergedPR.save();
        console.log("✅ New MergedPR created:", savedPR.id);
        console.log("✅ Merged PR ingested successfully:", {
            userId: actualUserId,
            prId: savedPR.id,
            prNumber: savedPR.number,
            prTitle: savedPR.title,
            repository: savedPR.repository.fullName,
            addedXp: savedPR.addedXp,
            coinsAdded: savedPR.coinsAdded,
            stakingRequired: savedPR.stakingRequired,
        });
        res.status(201).json({
            success: true,
            prId: savedPR.id,
            prNumber: savedPR.number,
            repository: savedPR.repository.fullName,
            addedXp: savedPR.addedXp,
            coinsAdded: savedPR.coinsAdded,
            stakingRequired: savedPR.stakingRequired,
            difficulty: savedPR.difficulty,
            bounty: savedPR.bounty,
            xpReward: savedPR.xpReward,
            linkedIssues: savedPR.linkedIssues,
            message: "Merged PR ingested successfully",
            created: true
        });
    }
    catch (err) {
        console.error("❌ Error ingesting merged PR:", err);
        // Handle mongoose validation errors
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map((e) => e.message);
            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
            return;
        }
        // Handle duplicate key errors
        if (err.code === 11000) {
            res.status(409).json({
                success: false,
                message: "Merged PR already exists with this ID"
            });
            return;
        }
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.ingestMergedPR = ingestMergedPR;
//# sourceMappingURL=PRIngesterController.js.map