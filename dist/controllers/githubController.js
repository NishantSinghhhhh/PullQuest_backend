"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserOrgs = listUserOrgs;
exports.listOrgRepos = listOrgRepos;
exports.listOrgMembers = listOrgMembers;
exports.listOrgTeams = listOrgTeams;
// src/services/github.ts
const GITHUB_API = "https://api.github.com";
async function githubFetch(url, token) {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} — ${text}`);
    }
    return res.json();
}
/** 1️⃣ List all orgs a user belongs to */
async function listUserOrgs(username, token) {
    return githubFetch(`${GITHUB_API}/users/${encodeURIComponent(username)}/orgs?per_page=100`, token);
}
/** 2️⃣ List all repos in an org */
async function listOrgRepos(org, token) {
    return githubFetch(`${GITHUB_API}/orgs/${encodeURIComponent(org)}/repos?per_page=100`, token);
}
/** 3️⃣ List all members in an org */
async function listOrgMembers(org, token) {
    return githubFetch(`${GITHUB_API}/orgs/${encodeURIComponent(org)}/members?per_page=100`, token);
}
/** 4️⃣ List all teams in an org */
async function listOrgTeams(org, token) {
    return githubFetch(`${GITHUB_API}/orgs/${encodeURIComponent(org)}/teams?per_page=100`, token);
}
//# sourceMappingURL=githubController.js.map