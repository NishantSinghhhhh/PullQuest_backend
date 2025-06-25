import mongoose, { Document, Schema, Types } from "mongoose";

export interface IOrgMember {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: string;
  role: "member" | "admin" | "owner";
  publicMember: boolean;
}

export interface IOrgRepository {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description?: string;
  language?: string;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  size: number;
  defaultBranch: string;
  openIssuesCount: number;
  topics: string[];
  visibility: "public" | "private" | "internal";
  archived: boolean;
  disabled: boolean;
  fork: boolean;
  createdAt: Date;
  updatedAt: Date;
  pushedAt?: Date;
  license?: {
    key: string;
    name: string;
    spdxId: string;
  };
}

export interface IOrgTeam {
  id: number;
  name: string;
  slug: string;
  description?: string;
  privacy: "closed" | "secret";
  permission: "pull" | "push" | "admin" | "maintain" | "triage";
  membersCount: number;
  reposCount: number;
  htmlUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrgPlan {
  name: string;
  space: number;
  privateRepos: number;
  collaborators: number;
}

export interface IOrganization {
  id: number;
  login: string;
  name?: string;
  description?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  twitterUsername?: string;
  avatarUrl: string;
  gravatarId?: string;
  htmlUrl: string;
  followersUrl: string;
  followingUrl: string;
  reposUrl: string;
  eventsUrl: string;
  hooksUrl: string;
  issuesUrl: string;
  membersUrl: string;
  publicMembersUrl: string;
  type: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: Date;
  updatedAt: Date;
  totalPrivateRepos?: number;
  ownedPrivateRepos?: number;
  privateGists?: number;
  diskUsage?: number;
  collaborators?: number;
  billingEmail?: string;
  plan?: IOrgPlan;
  defaultRepositoryPermission?: "read" | "write" | "admin" | "none";
  membersCanCreateRepos?: boolean;
  twoFactorRequirementEnabled?: boolean;
  membersAllowedRepositoryCreationType?: "all" | "private" | "none";
  membersCanCreatePages?: boolean;
  membersCanCreatePrivatePages?: boolean;
  membersCanCreatePublicPages?: boolean;
  dependencyGraphEnabledForNewRepos?: boolean;
  dependabotAlertsEnabledForNewRepos?: boolean;
  dependabotSecurityUpdatesEnabledForNewRepos?: boolean;
  advancedSecurityEnabledForNewRepos?: boolean;
  secretScanningEnabledForNewRepos?: boolean;
  secretScanningPushProtectionEnabledForNewRepos?: boolean;
}

export interface IApiKey {
  secretKey: string;
  context: string;
  githubUsername: string;
  position?: string;
  repoLinks: string[];
  orgName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGitHubOrganization extends Document {
  userId: Types.ObjectId;
  githubUsername: string;
  organization: IOrganization;
  members: IOrgMember[];
  repositories: IOrgRepository[];
  teams: IOrgTeam[];
  membership?: {
    state: "active" | "pending";
    role: "member" | "admin" | "owner";
    organizationUrl: string;
    publicMember: boolean;
  };
  statistics: {
    totalRepos: number;
    totalMembers: number;
    totalTeams: number;
    languageDistribution: { [key: string]: number };
    topContributors: string[];
    recentActivity: {
      commits: number;
      issues: number;
      pullRequests: number;
      releases: number;
    };
  };
  apiKeys: IApiKey[];
  lastFetched: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orgMemberSchema = new Schema<IOrgMember>({
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

const orgRepositorySchema = new Schema<IOrgRepository>({
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

const orgTeamSchema = new Schema<IOrgTeam>({
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

const orgPlanSchema = new Schema<IOrgPlan>({
  name: { type: String, required: true },
  space: { type: Number, required: true },
  privateRepos: { type: Number, required: true },
  collaborators: { type: Number, required: true },
});

const organizationSchema = new Schema<IOrganization>({
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

const apiKeySchema = new Schema<IApiKey>({
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

const gitHubOrganizationSchema = new Schema<IGitHubOrganization>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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

export default mongoose.model<IGitHubOrganization>(
  "GitHubOrganization",
  gitHubOrganizationSchema
);