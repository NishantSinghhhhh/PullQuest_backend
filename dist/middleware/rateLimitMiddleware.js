"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubApiDelay = exports.userAnalysisRateLimit = exports.userGithubRateLimit = exports.issueFetchRateLimit = exports.repositoryAnalysisRateLimit = exports.githubApiRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Rate limiting for GitHub API calls to prevent abuse
 */
exports.githubApiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many GitHub API requests, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
/**
 * Rate limiting for repository analysis (more restrictive)
 */
exports.repositoryAnalysisRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 repository analyses per hour
    message: {
        success: false,
        message: 'Repository analysis rate limit exceeded. Please try again in an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiting for issue fetching
 */
exports.issueFetchRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 issue fetch requests per 15 minutes
    message: {
        success: false,
        message: 'Issue fetching rate limit exceeded. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Custom rate limiting middleware that tracks per user
 */
class UserRateLimiter {
    constructor(maxRequests = 100, windowMs = 15 * 60 * 1000) {
        this.userRequests = new Map();
        this.middleware = (req, res, next) => {
            try {
                const userId = req.user?.id;
                if (!userId) {
                    // Fallback to IP-based rate limiting for unauthenticated requests
                    next();
                    return;
                }
                const now = Date.now();
                const userLimit = this.userRequests.get(userId);
                if (!userLimit) {
                    // First request from this user
                    this.userRequests.set(userId, {
                        count: 1,
                        resetTime: now + this.windowMs,
                    });
                    next();
                    return;
                }
                if (now > userLimit.resetTime) {
                    // Reset the counter
                    userLimit.count = 1;
                    userLimit.resetTime = now + this.windowMs;
                    next();
                    return;
                }
                if (userLimit.count >= this.maxRequests) {
                    res.status(429).json({
                        success: false,
                        message: 'Rate limit exceeded for this user',
                        resetTime: new Date(userLimit.resetTime).toISOString(),
                    });
                    return;
                }
                userLimit.count++;
                next();
            }
            catch (error) {
                console.error('User rate limiting error:', error.message);
                next(); // Continue on error to not break the flow
            }
        };
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        // Clean up expired entries every 5 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [userId, data] of this.userRequests.entries()) {
                if (now > data.resetTime) {
                    this.userRequests.delete(userId);
                }
            }
        }, 5 * 60 * 1000);
    }
}
// Create instances for different use cases
exports.userGithubRateLimit = new UserRateLimiter(50, 15 * 60 * 1000); // 50 requests per 15 minutes per user
exports.userAnalysisRateLimit = new UserRateLimiter(5, 60 * 60 * 1000); // 5 analyses per hour per user
/**
 * Middleware to add delay between requests to respect GitHub API rate limits
 */
const githubApiDelay = (req, res, next) => {
    // Add a small delay to prevent hitting GitHub API rate limits
    setTimeout(() => {
        next();
    }, 100); // 100ms delay
};
exports.githubApiDelay = githubApiDelay;
//# sourceMappingURL=rateLimitMiddleware.js.map