// src/controllers/commentController.ts
import { Request, Response, NextFunction } from 'express';
import { Octokit } from '@octokit/rest';

const RANDOM_COMMENTS = [
  "Thanks for opening this PR! The team will review it shortly.",
  "🚀 PullQuest AI here: I've glanced at this PR and will get back to you soon!",
  "🤖 Automated review: Thanks for your contribution! We'll take a look ASAP.",
  "📝 PullQuest AI comment: Great work—review is queued!"
];

/**
 * POST /api/comment-pr
 * Expects JSON body { access_token: string, pr_link: string }
 * Posts a random comment on that PR.
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
    // Validate inputs
    if (!access_token || typeof access_token !== 'string') {
      res.status(400).json({ error: '`access_token` is required and must be a string' });
      return;
    }
    if (!pr_link || typeof pr_link !== 'string') {
      res.status(400).json({ error: '`pr_link` is required and must be a string' });
      return;
    }

    // Parse the PR URL
    let owner: string, repo: string, pull_number: number;
    try {
      const url = new URL(pr_link);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL must start with http:// or https://');
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 4 || parts[2] !== 'pull') {
        throw new Error('Invalid PR URL: expected path `/owner/repo/pull/number`');
      }
      [owner, repo] = parts;
      pull_number = Number(parts[3]);
      if (!Number.isInteger(pull_number)) {
        throw new Error('Invalid pull number in URL');
      }
    } catch (urlErr: any) {
      res.status(400).json({ error: `Malformed pr_link: ${urlErr.message}` });
      return;
    }

    // Pick a random comment
    const commentBody =
      RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];

    // Post the comment to GitHub
    const octokit = new Octokit({ auth: access_token });
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: commentBody,
    });

    res.status(201).json({
      message: 'Comment posted successfully',
      comment: response.data,
    });
  } catch (err: any) {
    console.error('❌ Error in commentOnIssues:', err);
    next(err);
  }
}
