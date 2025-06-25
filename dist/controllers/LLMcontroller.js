"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContext = void 0;
const openai_1 = __importDefault(require("openai"));
const LLM_1 = require("../data/LLM");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function fetchRepoInfo(githubUrl) {
    console.log(`🔍 fetchRepoInfo: fetching metadata for ${githubUrl}`);
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match)
        throw new Error(`Invalid GitHub URL: ${githubUrl}`);
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
    const data = (await resp.json());
    const info = {
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
const generateContext = async (req, res, next) => {
    try {
        console.log(`📝 generateContext request body:`, req.body);
        const { repos } = req.body;
        if (!Array.isArray(repos) || repos.length === 0) {
            console.warn(`❌ Validation failed: repos must be a non-empty array`);
            res
                .status(400)
                .json({ success: false, message: "`repos` must be a non-empty array of URLs" });
            return;
        }
        // 1. fetch RepoInfo[]
        console.log(`📥 Fetching info for ${repos.length} repositories…`);
        const infos = await Promise.all(repos.map(fetchRepoInfo));
        console.log(`📥 All repo infos:`, infos);
        // 2. build the prompt
        const prompt = (0, LLM_1.buildRepoContextPrompt)(infos);
        console.log(`📨 Prompt sent to OpenAI:\n${prompt}`);
        // 3. call OpenAI
        console.log(`🤖 Calling OpenAI gpt-4o-mini…`);
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You explain open-source repositories." },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });
        console.log(`📥 OpenAI raw response:`, completion);
        const summary = completion.choices[0]?.message?.content?.trim() ?? "";
        console.log(`✅ Summary generated:\n${summary}`);
        // 4. Return
        res.json({ success: true, data: summary });
    }
    catch (err) {
        console.error("❌ generateContext error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.generateContext = generateContext;
//# sourceMappingURL=LLMcontroller.js.map