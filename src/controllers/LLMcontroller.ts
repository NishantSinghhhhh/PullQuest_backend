// src/controllers/maintainer.ts
import { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import OpenAI from "openai";
import { buildRepoContextPrompt, RepoInfo } from "../data/LLM";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchRepoInfo(githubUrl: string): Promise<RepoInfo> {
  console.log(`🔍 fetchRepoInfo: fetching metadata for ${githubUrl}`);
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  const [, owner, repo] = match;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  console.log(`👉 GET ${apiUrl}`);
  const resp = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`⚠️ GitHub API error (${resp.status}): ${text}`);
    throw new Error(`GitHub API error ${resp.status}: ${text}`);
  }

  const data = (await resp.json()) as any;
  const info: RepoInfo = {
    full_name: data.full_name,
    description: data.description,
    stargazers_count: data.stargazers_count,
    open_issues_count: data.open_issues_count,
    language: data.language,
    url: githubUrl,
    html_url: data.html_url, // Added html_url property
  };
  console.log(`✅ fetched info:`, info);
  return info;
}

export const generateContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`📝 generateContext request body:`, req.body);
    const { repos } = req.body as { repos?: string[] };

    if (!Array.isArray(repos) || repos.length === 0) {
      console.warn(`❌ Validation failed: repos must be a non-empty array`);
      res
        .status(400)
        .json({ success: false, message: "`repos` must be a non-empty array of URLs" });
      return;
    }

    // 1. fetch RepoInfo[]
    console.log(`📥 Fetching info for ${repos.length} repositories…`);
    const infos = await Promise.all(
      repos.map(fetchRepoInfo)
    );
    console.log(`📥 All repo infos:`, infos);

    // 2. build the prompt
    const prompt = buildRepoContextPrompt(infos);
    console.log(`📨 Prompt sent to OpenAI:\n${prompt}`);

    // 3. call OpenAI
    console.log(`🤖 Calling OpenAI gpt-4o-mini…`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You explain open-source repositories." },
        { role: "user",    content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    console.log(`📥 OpenAI raw response:`, completion);

    const summary = completion.choices[0]?.message?.content?.trim() ?? "";
    console.log(`✅ Summary generated:\n${summary}`);

    // 4. Return
    res.json({ success: true, data: summary });
  } catch (err: any) {
    console.error("❌ generateContext error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
