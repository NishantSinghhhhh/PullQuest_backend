"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestIssueData = ingestIssueData;
// src/services/issueIngestService.ts
const githubIssues_1 = __importDefault(require("../model/githubIssues"));
async function ingestIssueData(params) {
    const { userId, githubUsername, repository, issue, stakingRequired = 0 } = params;
    // 1) find or create this user’s GitHubIssues doc
    let doc = await githubIssues_1.default.findOne({ userId });
    if (!doc) {
        doc = new githubIssues_1.default({
            userId,
            githubUsername,
            suggestedIssues: [],
            userTopLanguages: [],
            userOrganizations: [],
            filters: { languages: [], labels: [] },
        });
    }
    // 2) attach the new issue (with the stake) into suggestedIssues
    ;
    issue.stakingRequired = stakingRequired;
    doc.suggestedIssues.push(issue);
    // 3) save
    await doc.save();
}
//# sourceMappingURL=issueIngestService.js.map