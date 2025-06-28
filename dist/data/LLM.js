"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYSIS_DEPTH = void 0;
exports.buildRepoContextPrompt = buildRepoContextPrompt;
exports.ANALYSIS_DEPTH = {
    BRIEF: 'brief',
    DETAILED: 'detailed',
    COMPREHENSIVE: 'comprehensive'
};
function buildRepoContextPrompt(infos, depth = 'COMPREHENSIVE', focusAreas) {
    const repoList = infos
        .map((repo, index) => `${index + 1}. **${repo.full_name}**
     - Description: ${repo.description ?? "No description provided"}
     - Primary Language: ${repo.language ?? "Unknown"}
     - Stars: ${repo.stargazers_count.toLocaleString()} | Issues: ${repo.open_issues_count}
     - Repository URL: ${repo.html_url}
     - Clone URL: ${repo.clone_url ?? repo.url}
     ${repo.topics && repo.topics.length > 0 ? `- Topics: ${repo.topics.join(', ')}` : ''}
     ${repo.size ? `- Size: ${(repo.size / 1024).toFixed(1)}MB` : ''}
     ${repo.created_at ? `- Created: ${new Date(repo.created_at).toLocaleDateString()}` : ''}
     ${repo.updated_at ? `- Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}` : ''}`)
        .join('\n\n');
    const basePrompt = `# Repository Analysis Request
  
  I need a comprehensive analysis of the following ${infos.length} repositories:
  
  ${repoList}
  
  ## Analysis Requirements
  
  Please provide a **${depth.toLowerCase()} analysis** for each repository with approximately **100+ lines of detailed context per repository**. For each repository, include:`;
    const detailedRequirements = `
  
  ### Architecture Analysis
  - Project Structure: Analyze the directory layout and organization patterns
  - Design Patterns: Identify architectural patterns (MVC, microservices, monolith, etc.)
  - Code Organization: How modules, components, and services are structured
  - Separation of Concerns: How different layers (presentation, business logic, data) are organized
  - Scalability Considerations: How the architecture supports growth and maintenance
  
  ### Routing & Navigation
  - Routing Framework: Identify the routing system being used (React Router, Next.js routing, Express routes, etc.)
  - Route Structure: Analyze URL patterns and route organization
  - Navigation Flow: How users/requests move through the application
  - Route Guards: Authentication and authorization mechanisms
  - API Endpoints: REST/GraphQL endpoints and their structure (if applicable)
  
  ### Package Analysis & Dependencies
  - Core Dependencies: Primary frameworks and libraries being used
  - Package Manager: npm, yarn, pnpm configuration and lock files
  - Development Dependencies: Build tools, testing frameworks, linting tools
  - Package Architecture: How packages are organized (monorepo, single package, etc.)
  - Version Management: Dependency versioning strategy and potential issues
  - Security Analysis: Identify outdated or vulnerable dependencies
  
  ### Technical Implementation
  - Build System: Webpack, Vite, Rollup, or other build configurations
  - Development Workflow: Scripts, automation, and development server setup
  - Testing Strategy: Unit tests, integration tests, E2E testing setup
  - CI/CD Pipeline: GitHub Actions, deployment strategies (if visible)
  - Environment Configuration: How different environments are handled
  
  ### Configuration & Setup
  - Environment Variables: Configuration management approach
  - Database Integration: ORM/ODM usage, database connection patterns
  - Authentication: Auth implementation (JWT, OAuth, sessions, etc.)
  - State Management: Redux, Zustand, Context API, or other state solutions
  - Styling Approach: CSS frameworks, styled-components, CSS modules, etc.
  
  ### Performance & Optimization
  - Bundle Analysis: Code splitting, lazy loading implementations
  - Caching Strategies: Browser caching, API caching, static asset optimization
  - Performance Monitoring: Analytics, error tracking, performance metrics
  - SEO Considerations: Meta tags, structured data, server-side rendering
  
### Code Quality & Patterns
  - Coding Standards: ESLint, Prettier, TypeScript configuration
  - Coding Style Patterns: Identify specific naming conventions and code organization patterns
    * Variable/Function Naming: camelCase, snake_case, PascalCase usage patterns
    * File/Directory Naming: kebab-case, camelCase, PascalCase for files and folders
    * Component/Class Naming: React component patterns, class naming conventions
    * Constants/Enums: UPPER_CASE, PascalCase, or other constant naming patterns
    * Import/Export Patterns: Named exports, default exports, barrel exports
    * Code Organization Style: Functional vs OOP approaches, composition patterns
  - Design Patterns: Common patterns used throughout the codebase (Factory, Observer, Singleton, etc.)
  - Error Handling: How errors are caught, logged, and handled
  - Logging & Monitoring: Logging strategies and monitoring setup
  - Documentation: README quality, inline documentation, API docs`;
    const focusAreasSection = focusAreas && focusAreas.length > 0
        ? `\n\n### Additional Focus Areas
  Please pay special attention to:
  ${focusAreas.map(area => `- ${area}`).join('\n')}`
        : '';
    const outputFormat = `
  
  ## Expected Output Format
  
  For each repository, provide:
  
  1. **Executive Summary** (2-3 sentences)
     - Project purpose and primary technology stack
     - Target audience and use case
  
  2. **Detailed Technical Analysis** (80-100 lines)
     - Follow all the analysis requirements above
     - Use bullet points and subheadings for clarity
     - Include specific examples from the codebase where possible
     - Mention specific file paths, configurations, and implementations
  
  3. **Key Insights & Recommendations** (10-15 lines)
     - Strengths and potential improvements
     - Security considerations
     - Performance optimization opportunities
     - Maintenance and scalability notes
  
  ## Ecosystem Analysis
  
  After analyzing individual repositories, provide:
  
  1. **Relationship Analysis** (20-30 lines)
     - How these repositories complement each other
     - Shared technologies and patterns
     - Integration possibilities and dependencies
  
  2. **Ecosystem Overview** (15-20 lines)
     - Overall project ecosystem assessment
     - Technology stack coherence
     - Potential consolidation or refactoring opportunities
  
  3. **Strategic Recommendations** (10-15 lines)
     - Development workflow improvements
     - Technology standardization suggestions
     - Future development roadmap considerations
  
  ## Analysis Methodology
  
  Please base your analysis on:
  - Repository structure and file organization
  - Package.json, requirements.txt, or equivalent dependency files
  - Configuration files (webpack.config.js, next.config.js, etc.)
  - README.md and documentation files
  - Source code patterns visible in the repository
  - GitHub repository metadata and statistics
  
  **Note**: If you cannot access the actual repository contents, please indicate which parts of the analysis are based on metadata only and suggest what additional information would be needed for a complete analysis.`;
    return basePrompt + detailedRequirements + focusAreasSection + outputFormat;
}
// Additional utility functions and types (unchanged)
//# sourceMappingURL=LLM.js.map