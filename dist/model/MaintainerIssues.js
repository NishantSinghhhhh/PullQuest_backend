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
// User schema
const UserSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    login: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    htmlUrl: { type: String, default: "" },
    type: { type: String, default: "User" }
}, { _id: false });
// Label schema
const LabelSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    color: { type: String, default: "000000" },
    description: { type: String, default: "" }
}, { _id: false });
// Milestone schema
const MilestoneSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    state: { type: String, default: "open" },
    dueOn: { type: Date, required: false }
}, { _id: false });
// Repository schema
const RepositorySchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    language: { type: String, default: "" },
    stargazersCount: { type: Number, default: 0 },
    forksCount: { type: Number, default: 0 },
    description: { type: String, default: "" }
}, { _id: false });
// Main MaintainerIssue schema
const MaintainerIssueSchema = new mongoose_1.Schema({
    // Core issue fields
    id: { type: Number, required: true, unique: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    state: { type: String, default: "open", enum: ["open", "closed"] },
    htmlUrl: { type: String, required: true },
    // User/Assignment fields
    user: { type: UserSchema, required: true },
    assignee: { type: UserSchema, required: false },
    assignees: { type: [UserSchema], default: [] },
    // Metadata
    labels: { type: [LabelSchema], default: [] },
    milestone: { type: MilestoneSchema, required: false },
    repository: { type: RepositorySchema, required: true },
    // Counts and timestamps
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, required: false },
    // GitHub specific
    authorAssociation: {
        type: String,
        default: "NONE",
        enum: ["COLLABORATOR", "CONTRIBUTOR", "FIRST_TIMER", "FIRST_TIME_CONTRIBUTOR", "MANNEQUIN", "MEMBER", "NONE", "OWNER"]
    },
    // Bounty/Staking fields
    difficulty: {
        type: String,
        required: false,
        enum: ["easy", "medium", "hard", "expert"]
    },
    estimatedHours: { type: Number, required: false },
    bounty: { type: Number, required: false },
    xpReward: { type: Number, required: false },
    stakingRequired: { type: Number, default: 0 },
    expirationDate: { type: Date, required: false }
}, {
    timestamps: true // This will automatically manage createdAt and updatedAt
});
// Create indexes for better query performance
MaintainerIssueSchema.index({ 'repository.fullName': 1 });
MaintainerIssueSchema.index({ 'user.login': 1 });
MaintainerIssueSchema.index({ state: 1 });
MaintainerIssueSchema.index({ createdAt: -1 });
// Model
const MaintainerIssue = mongoose_1.default.model('MaintainerIssue', MaintainerIssueSchema);
exports.default = MaintainerIssue;
//# sourceMappingURL=MaintainerIssues.js.map