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
const orgMemberSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    login: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    type: { type: String, required: true },
    role: {
        type: String,
        enum: ["member", "admin", "owner"],
        required: true
    },
    publicMember: { type: Boolean, default: false },
});
const orgRepositorySchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    description: { type: String },
    language: { type: String },
    stargazersCount: { type: Number, default: 0 },
    forksCount: { type: Number, default: 0 },
    watchersCount: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    defaultBranch: { type: String, default: "main" },
    openIssuesCount: { type: Number, default: 0 },
    topics: [{ type: String }],
    visibility: {
        type: String,
        enum: ["public", "private", "internal"],
        default: "public"
    },
    archived: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    fork: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    pushedAt: { type: Date },
    license: {
        key: { type: String },
        name: { type: String },
        spdxId: { type: String },
    },
});
const orgTeamSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    privacy: {
        type: String,
        enum: ["closed", "secret"],
        default: "closed"
    },
    permission: {
        type: String,
        enum: ["pull", "push", "admin", "maintain", "triage"],
        default: "pull"
    },
    membersCount: { type: Number, default: 0 },
    reposCount: { type: Number, default: 0 },
    htmlUrl: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
});
const orgPlanSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    space: { type: Number, required: true },
    privateRepos: { type: Number, required: true },
    collaborators: { type: Number, required: true },
});
const organizationSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    login: { type: String, required: true },
    name: { type: String },
    description: { type: String },
    company: { type: String },
    blog: { type: String },
    location: { type: String },
    email: { type: String },
    twitterUsername: { type: String },
    avatarUrl: { type: String, required: true },
    gravatarId: { type: String },
    htmlUrl: { type: String, required: true },
    followersUrl: { type: String, required: true },
    followingUrl: { type: String, required: true },
    reposUrl: { type: String, required: true },
    eventsUrl: { type: String, required: true },
    hooksUrl: { type: String, required: true },
    issuesUrl: { type: String, required: true },
    membersUrl: { type: String, required: true },
    publicMembersUrl: { type: String, required: true },
    type: { type: String, required: true },
    publicRepos: { type: Number, default: 0 },
    publicGists: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    totalPrivateRepos: { type: Number },
    ownedPrivateRepos: { type: Number },
    privateGists: { type: Number },
    diskUsage: { type: Number },
    collaborators: { type: Number },
    billingEmail: { type: String },
    plan: orgPlanSchema,
    defaultRepositoryPermission: {
        type: String,
        enum: ["read", "write", "admin", "none"]
    },
    membersCanCreateRepos: { type: Boolean },
    twoFactorRequirementEnabled: { type: Boolean },
    membersAllowedRepositoryCreationType: {
        type: String,
        enum: ["all", "private", "none"]
    },
    membersCanCreatePages: { type: Boolean },
    membersCanCreatePrivatePages: { type: Boolean },
    membersCanCreatePublicPages: { type: Boolean },
    dependencyGraphEnabledForNewRepos: { type: Boolean },
    dependabotAlertsEnabledForNewRepos: { type: Boolean },
    dependabotSecurityUpdatesEnabledForNewRepos: { type: Boolean },
    advancedSecurityEnabledForNewRepos: { type: Boolean },
    secretScanningEnabledForNewRepos: { type: Boolean },
    secretScanningPushProtectionEnabledForNewRepos: { type: Boolean },
});
const apiKeySchema = new mongoose_1.Schema({
    secretKey: {
        type: String,
        required: true,
    },
    context: {
        type: String,
        default: "",
    },
    githubUsername: {
        type: String,
        required: true,
    },
    position: {
        type: String,
    },
    repoLinks: {
        type: [String],
        default: [],
    },
    orgName: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
const gitHubOrganizationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    githubUsername: {
        type: String,
        required: true,
    },
    organization: {
        type: organizationSchema,
        required: true,
    },
    members: [orgMemberSchema],
    repositories: [orgRepositorySchema],
    teams: [orgTeamSchema],
    membership: {
        state: {
            type: String,
            enum: ["active", "pending"]
        },
        role: {
            type: String,
            enum: ["member", "admin", "owner"]
        },
        organizationUrl: { type: String },
        publicMember: { type: Boolean, default: false },
    },
    statistics: {
        totalRepos: { type: Number, default: 0 },
        totalMembers: { type: Number, default: 0 },
        totalTeams: { type: Number, default: 0 },
        languageDistribution: {
            type: Map,
            of: Number,
            default: new Map(),
        },
        topContributors: [{ type: String }],
        recentActivity: {
            commits: { type: Number, default: 0 },
            issues: { type: Number, default: 0 },
            pullRequests: { type: Number, default: 0 },
            releases: { type: Number, default: 0 },
        },
    },
    apiKeys: [apiKeySchema],
    lastFetched: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
gitHubOrganizationSchema.index({ userId: 1 });
gitHubOrganizationSchema.index({ githubUsername: 1 });
gitHubOrganizationSchema.index({ "organization.login": 1 });
gitHubOrganizationSchema.index({ "organization.id": 1 });
gitHubOrganizationSchema.index({ "repositories.language": 1 });
gitHubOrganizationSchema.index({ "repositories.stargazersCount": -1 });
gitHubOrganizationSchema.index({ lastFetched: 1 });
gitHubOrganizationSchema.index({ "membership.role": 1 });
gitHubOrganizationSchema.index({ "apiKeys.secretKey": 1 });
gitHubOrganizationSchema.index({ "apiKeys.githubUsername": 1 });
gitHubOrganizationSchema.index({ "apiKeys.orgName": 1 });
exports.default = mongoose_1.default.model("GitHubOrganization", gitHubOrganizationSchema);
//# sourceMappingURL=Org.js.map