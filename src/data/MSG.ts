// Option 1: More Professional & Informative
const MSG_PROFESSIONAL = (n: number, url: string, repo: string) => `
### 🔍 PullQuest Analysis Started

Thanks for submitting issue **#${n}** in **${repo}**! 

Our automated review system is now analyzing your issue and will provide:
- 📋 Issue categorization and priority assessment
- 🔧 Suggested solutions or workarounds
- 📚 Related documentation and resources
- 🏷️ Appropriate labels and assignee recommendations

**Estimated completion:** 2-5 minutes

${url ? `[View Issue](${url})` : ''}

---
*This is an automated message from PullQuest. A human maintainer will review our analysis.*
`.trim();

// Option 2: Friendly & Encouraging
const MSG_FRIENDLY = (n: number, url: string, repo: string) => `
### 👋 Hey there! PullQuest is on the case

Thanks for opening issue **#${n}** in **${repo}**! 

We're diving into your issue right now and will be back shortly with:
✨ Smart insights and analysis  
🎯 Potential solutions  
🏷️ Proper categorization  

Hang tight – good things are coming! ⏰

${url ? `💡 [Track progress here](${url})` : ''}
`.trim();

// Option 3: Concise & Action-Oriented  
const MSG_CONCISE = (n: number, url: string, repo: string) => `
### ⚡ PullQuest Review in Progress

Issue **#${n}** is being analyzed automatically.

**What's happening:**
- Scanning issue content and context
- Identifying similar issues and solutions  
- Preparing recommendations

**ETA:** ~3 minutes

${url ? `🔗 ${url}` : ''}
`.trim();

// Option 4: Technical & Detailed
const MSG_TECHNICAL = (n: number, url: string, repo: string) => `
### 🤖 Automated Issue Analysis Initiated

**Issue ID:** #${n}  
**Repository:** ${repo}  
**Status:** Processing

**Analysis Pipeline:**
1. ✅ Issue intake complete
2. 🔄 Content parsing and classification  
3. ⏳ Solution matching and recommendation generation
4. ⏳ Priority and label assignment

Results will be posted as a follow-up comment within 5 minutes.

${url ? `**Issue Link:** ${url}` : ''}

---
*Powered by PullQuest AI • [Learn more](https://pullquest.dev)*
`.trim();

// Option 5: Fun & Engaging
const MSG_FUN = (n: number, url: string, repo: string) => `
### 🚀 Mission Control: Issue #${n} Received!

Houston, we have an issue! 📡

**Mission Status:** ACTIVE  
**Target:** ${repo}  
**Crew:** PullQuest AI Agents  

Our digital detectives are investigating and will report back with their findings shortly. Expect intelligence on solutions, similar cases, and next steps.

${url ? `📊 [Mission Dashboard](${url})` : ''}

*T-minus a few minutes to insights...* ⏱️
`.trim();

// Option 6: Community-Focused
const MSG_COMMUNITY = (n: number, url: string, repo: string) => `
### 🌟 Welcome to the ${repo} community!

Your issue **#${n}** has been received and is being reviewed by PullQuest.

**What happens next:**
- 🔍 We'll analyze your issue against our knowledge base
- 🤝 Connect you with relevant discussions and solutions
- 🏷️ Add helpful labels to get the right eyes on this
- 📋 Provide actionable next steps

The maintainers and community appreciate detailed issues like yours!

${url ? `🔗 Issue link: ${url}` : ''}

*Stay tuned – help is on the way! 💪*
`.trim();

// Export your preferred message style
export const MSG = MSG_PROFESSIONAL; // Change this to your preferred option