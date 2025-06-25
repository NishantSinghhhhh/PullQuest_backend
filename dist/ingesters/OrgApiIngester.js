"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestApiKey = void 0;
const User_1 = __importDefault(require("../model/User"));
const apiKey_1 = __importDefault(require("../model/apiKey"));
const Org_1 = __importDefault(require("../model/Org"));
const githubController_1 = require("../controllers/githubController");
const GITHUB_API = "https://api.github.com";
/** fetch a single organisation profile (not exported in services/github.ts) */
const getOrg = async (org, token) => fetch(`${GITHUB_API}/orgs/${encodeURIComponent(org)}`, {
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
    },
}).then(async (r) => {
    if (!r.ok)
        throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
});
const ingestApiKey = async (req, res) => {
    try {
        /* ───────── 1. validate body ───────── */
        const { orgName, secretKey, context = "", position = "", repoLinks = [], maintainerUsername, role: payloadRole, } = req.body;
        if (!orgName || !secretKey || !maintainerUsername || !Array.isArray(repoLinks)) {
            res
                .status(400)
                .json({ success: false, message: "orgName, secretKey, repoLinks and maintainerUsername are required" });
            return;
        }
        /* ───────── 2. maintainer lookup ───── */
        const user = await User_1.default.findOne({ githubUsername: maintainerUsername }).select("_id role githubUsername accessToken");
        if (!user) {
            res.status(404).json({ success: false, message: "Maintainer user not found" });
            return;
        }
        if (payloadRole && user.role !== payloadRole) {
            res.status(403).json({ success: false, message: `User is not a ${payloadRole}` });
            return;
        }
        /* ───────── 3. persist API-key doc ─── */
        await apiKey_1.default.create({
            userId: user._id,
            secretKey,
            context,
            githubUsername: user.githubUsername,
            position,
            repoLinks,
            orgName,
        });
        /* ───────── 4. fetch GitHub data ───── */
        const ghToken = user.accessToken || process.env.GITHUB_TOKEN;
        if (!ghToken) {
            res.status(500).json({ success: false, message: "GitHub token missing on server" });
            return;
        }
        const [org, repos,] = await Promise.all([
            getOrg(orgName, ghToken),
            (0, githubController_1.listOrgRepos)(orgName, ghToken),
            // listOrgMembers(orgName, ghToken),
            // listOrgTeams(orgName, ghToken),
        ]);
        /* ───────── 5. language histogram ──── */
        const langDist = {};
        repos.forEach((r) => {
            const lang = r.language || "Unknown";
            langDist[lang] = (langDist[lang] || 0) + 1;
        });
        /* ───────── 6. upsert org doc ──────── */
        const upserted = await Org_1.default.findOneAndUpdate({ userId: user._id, "organization.id": org.id }, {
            userId: user._id,
            githubUsername: user.githubUsername,
            organization: {
                id: org.id,
                login: org.login,
                name: org.name ?? org.login,
                avatarUrl: org.avatar_url,
                htmlUrl: org.html_url,
                type: org.type,
                publicRepos: org.public_repos,
                createdAt: org.created_at,
                updatedAt: org.updated_at,
            },
            // members: members.map((m: any) => ({
            //   id: m.id,
            //   login: m.login,
            //   avatarUrl: m.avatar_url,
            //   htmlUrl: m.html_url,
            //   type: m.type,
            //   role: "member",
            //   publicMember: m.site_admin ?? false,
            // })),
            repositories: repos.map((r) => ({
                id: r.id,
                name: r.name,
                htmlUrl: r.html_url,
                language: r.language,
                stargazersCount: r.stargazers_count,
            })),
            // teams: teams.map((t: any) => ({
            //   id: t.id,
            //   name: t.name,
            //   slug: t.slug,
            //   privacy: t.privacy,
            //   permission: t.permission,
            //   membersCount: t.members_count,
            // })),
            // statistics: {
            //   totalRepos: repos.length,
            //   totalMembers: members.length,
            //   languageDistribution: langDist,
            // },
            $push: {
                apiKeys: {
                    secretKey,
                    context,
                    githubUsername: user.githubUsername,
                    position,
                    repoLinks,
                    orgName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            lastFetched: new Date(),
        }, { upsert: true, new: true });
        res.json({ success: true, data: upserted });
    }
    catch (err) {
        console.error("❌ ingestApiKey error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.ingestApiKey = ingestApiKey;
//# sourceMappingURL=OrgApiIngester.js.map