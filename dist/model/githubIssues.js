"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const issueLabelSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    description: { type: String },
});
const issueUserSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    login: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    type: { type: String, required: true },
});
const issueSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String },
    state: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    user: { type: issueUserSchema, required: true },
    labels: [issueLabelSchema],
    assignee: issueUserSchema,
    assignees: [issueUserSchema],
    milestone: {
        id: { type: Number },
        title: { type: String },
        description: { type: String },
        state: { type: String },
        dueOn: { type: Date },
    },
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    closedAt: { type: Date },
    authorAssociation: { type: String, required: true },
    repository: {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true },
        htmlUrl: { type: String, required: true },
        language: { type: String },
        stargazersCount: { type: Number, default: 0 },
        forksCount: { type: Number, default: 0 },
        description: { type: String },
    },
    difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
    },
    estimatedHours: { type: Number },
    // ADD THESE MISSING FIELDS:
    bounty: { type: Number },
    xpReward: { type: Number },
    stakingRequired: { type: Number, default: 0 }, // ← This was missing!
    expirationDate: { type: Date },
});
const gitHubIssuesSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    githubUsername: {
        type: String,
        required: true,
    },
    suggestedIssues: [issueSchema],
    userTopLanguages: [{ type: String }],
    userOrganizations: [{ type: String }],
    lastFetched: {
        type: Date,
        default: Date.now,
    },
    filters: {
        languages: [{ type: String }],
        labels: [{ type: String }],
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
        },
        minStars: { type: Number, default: 0 },
        minBounty: { type: Number },
        maxBounty: { type: Number },
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
gitHubIssuesSchema.index({ userId: 1 });
gitHubIssuesSchema.index({ githubUsername: 1 });
gitHubIssuesSchema.index({ "suggestedIssues.repository.language": 1 });
gitHubIssuesSchema.index({ lastFetched: 1 });
exports.default = mongoose_1.default.model("GitHubIssues", gitHubIssuesSchema);
//# sourceMappingURL=githubIssues.js.map