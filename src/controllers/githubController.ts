// src/services/github.ts
const GITHUB_API = "https://api.github.com";

async function githubFetch(
  url: string,
  token: string
): Promise<any> {
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
export async function listUserOrgs(
  username: string,
  token: string
): Promise<any[]> {
  return githubFetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/orgs?per_page=100`,
    token
  );
}

/** 2️⃣ List all repos in an org */
export async function listOrgRepos(
  org: string,
  token: string
): Promise<any[]> {
  return githubFetch(
    `${GITHUB_API}/orgs/${encodeURIComponent(org)}/repos?per_page=100`,
    token
  );
}

/** 3️⃣ List all members in an org */
export async function listOrgMembers(
  org: string,
  token: string
): Promise<any[]> {
  return githubFetch(
    `${GITHUB_API}/orgs/${encodeURIComponent(org)}/members?per_page=100`,
    token
  );
}

/** 4️⃣ List all teams in an org */
export async function listOrgTeams(
  org: string,
  token: string
): Promise<any[]> {
  return githubFetch(
    `${GITHUB_API}/orgs/${encodeURIComponent(org)}/teams?per_page=100`,
    token
  );
}
