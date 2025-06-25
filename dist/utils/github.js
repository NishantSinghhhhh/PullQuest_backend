"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserOrgs = listUserOrgs;
exports.getUserProfile = getUserProfile;
const core_1 = require("@octokit/core");
async function listUserOrgs(userAccessToken, perPage = 30, page = 1) {
    if (!userAccessToken) {
        throw new Error("User access token is required");
    }
    const octokit = new core_1.Octokit({
        auth: userAccessToken,
        userAgent: "PullQuest-Backend v1.0.0",
    });
    try {
        const { data } = await octokit.request("GET /user/orgs", {
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
        if (error.status === 401) {
            throw new Error("Invalid or expired GitHub access token");
        }
        if (error.status === 403) {
            throw new Error("Insufficient permissions. Required scopes: user or read:org");
        }
        throw new Error(`GitHub API error: ${error.message}`);
    }
}
async function getUserProfile(userAccessToken) {
    if (!userAccessToken) {
        throw new Error("User access token is required");
    }
    const octokit = new core_1.Octokit({
        auth: userAccessToken,
        userAgent: "PullQuest-Backend v1.0.0",
    });
    try {
        const { data } = await octokit.request("GET /user", {
            headers: {
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        return data;
    }
    catch (error) {
        if (error.status === 401) {
            throw new Error("Invalid or expired GitHub access token");
        }
        throw new Error(`GitHub API error: ${error.message}`);
    }
}
//# sourceMappingURL=github.js.map