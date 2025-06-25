// src/controllers/commentController.ts
import { Request, Response, NextFunction } from "express";
import { Octokit } from "@octokit/rest";

const RANDOM_COMMENTS = [
  "Thanks for opening this PR! The team will review it shortly.",
  "🚀 PullQuest AI here: I've glanced at this PR and will get back to you soon!",
  "🤖 Automated review: Thanks for your contribution! We'll take a look ASAP.",
  "📝 PullQuest AI comment: Great work—review is queued!",
];

/** helper to build the final comment body */
function buildComment(
  n: number,
  repo: string,
  url: string,
  labels: string[],
  stake?: number
) {
  const labelList = labels.length
    ? labels.map((l) => `\`${l}\``).join(" ")
    : "_none_";

  let body = `
### 🤖 PullQuest is on it!

Issue / PR **#${n}** in **${repo}** has been queued for automated review.  
**Labels:** ${labelList}`.trim();

  if (stake !== undefined) {
    body += `

🔖 **Stake:** ${stake} coin${stake === 1 ? "" : "s"}`;
  }

  body += `

🔗 ${url}
`;

  return body;
}

/**
 * POST /api/comment-pr
 * Expects JSON body ⟨access_token, pr_link⟩
 * Posts a comment that includes label info + stake (if present).
 */
export async function commentOnIssues(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { access_token, pr_link } = req.body as {
    access_token?: string;
    pr_link?: string;
  };

  try {
    /* ── 1. basic validation ─────────────────────────────────────────── */
    if (!access_token || typeof access_token !== "string") {
      res
        .status(400)
        .json({ error: "`access_token` is required and must be a string" });
      return;
    }
    if (!pr_link || typeof pr_link !== "string") {
      res
        .status(400)
        .json({ error: "`pr_link` is required and must be a string" });
      return;
    }

    /* ── 2. parse the GitHub URL ⟨owner/repo/(pull|issues)/number⟩ ───── */
    let owner: string,
      repo: string,
      issue_number: number;
    try {
      const urlObj = new URL(pr_link);
      const parts = urlObj.pathname.split("/").filter(Boolean); // ['', owner, repo, type, num]
      if (parts.length < 4) throw new Error("URL must be /owner/repo/pull/Num");

      [owner, repo] = parts;
      issue_number = Number(parts[3]);
      if (!Number.isInteger(issue_number))
        throw new Error("Invalid issue / PR number");
    } catch (err: any) {
      res.status(400).json({ error: `Malformed pr_link: ${err.message}` });
      return;
    }

    /* ── 3. fetch labels to detect stake ─────────────────────────────── */
    const octokit = new Octokit({ auth: access_token });

    const {
      data: { labels = [], html_url },
    } = await octokit.issues.get({
      owner,
      repo,
      issue_number,
    });

    const labelNames = labels
      .map((l) => (typeof l === "string" ? l : l.name))
      .filter((x): x is string => !!x);

    let stake: number | undefined;
    for (const name of labelNames) {
      const m = name.match(/stake[:\-]?(\d+)/i);
      if (m) {
        stake = parseInt(m[1], 10);
        break;
      }
    }

    /* ── 4. craft the comment body ───────────────────────────────────── */
    const commentBody =
      stake === undefined && labelNames.length === 0
        ? // fall back to a friendly random blurb when nothing fancy to show
          RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)]
        : buildComment(issue_number, repo, pr_link ?? html_url, labelNames, stake);

    /* ── 5. post the comment back to GitHub ──────────────────────────── */
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body: commentBody,
    });

    res.status(201).json({
      message: "Comment posted successfully",
      comment: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error in commentOnIssues:", err);
    next(err);
  }
}
