"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const helmet_1 = __importDefault(require("helmet"));
const githubWebhooks_1 = require("./webhooks/githubWebhooks");
const passport_1 = __importDefault(require("passport"));
require("./auth/github");
// import contributorRoutes from "./routes/contributorRoutes";
const MaintainerRoutes_1 = __importDefault(require("./routes/MaintainerRoutes"));
const rateLimitMiddleware_1 = require("./middleware/rateLimitMiddleware");
const User_1 = __importDefault(require("./model/User"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const LLMroutes_1 = __importDefault(require("./routes/LLMroutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    credentials: true,
    origin: (incomingOrigin, callback) => {
        const whitelist = [
            "http://localhost:5173",
            "https://pull-quest-frontend.vercel.app"
        ];
        if (!incomingOrigin || whitelist.includes(incomingOrigin)) {
            // allow requests with no origin (like mobile apps, curl) 
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${incomingOrigin} not allowed by CORS`));
        }
    }
}));
app.use(express_1.default.json());
// ✅ Initialize Passport WITHOUT sessions (serverless-friendly)
app.use(passport_1.default.initialize());
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});
// GitHub OAuth (without sessions)
app.get("/auth/github", passport_1.default.authenticate("github", {
    scope: ["user:email"],
    session: false
}));
app.get("/auth/github/callback", passport_1.default.authenticate("github", { failureRedirect: "/", session: false }), async (req, res) => {
    try {
        const { profile, accessToken, refreshToken } = req.user;
        const githubUsername = profile.username;
        await connectDB();
        // ...
        const dbUser = await User_1.default.findOneAndUpdate({ githubUsername }, {
            $set: {
                accessToken,
                refreshToken,
                githubInfo: JSON.stringify(profile._json), // ← stringify here
                lastLogin: new Date(),
            },
        }, { upsert: true, new: true });
        const jwt = require("jsonwebtoken").sign({ userId: dbUser._id.toString(), githubUsername }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" });
        const frontendUser = {
            id: dbUser._id.toString(),
            role: dbUser.role || "contributor", // make sure `role` exists on the user doc
            email: dbUser.email,
            githubUsername,
            token: jwt,
        };
        const encoded = encodeURIComponent(JSON.stringify(frontendUser));
        // after you build `encoded`
        res.redirect(`${process.env.FRONTEND_URL || "https://pull-quest-frontend.vercel.app"}/login?user=${encoded}`);
    }
    catch (err) {
        console.error("❌ OAuth callback error:", err);
        res.redirect(`${process.env.FRONTEND_URL || "https://pull-quest-frontend.vercel.app"}?error=auth_failed`);
    }
});
app.use("/api", rateLimitMiddleware_1.githubApiRateLimit);
app.use('/api/comment', commentRoutes_1.default);
// app.use("/api/contributor", contributorRoutes);
app.use("/api/maintainer", MaintainerRoutes_1.default);
app.use("/api/LLM", LLMroutes_1.default);
// Webhooks
app.post("/webhooks/github", express_1.default.json({ type: "application/json" }), githubWebhooks_1.handlePRWebhook);
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        service: "PullQuest Backend API",
        version: "v1.0.0",
        message: "👋  Welcome!  The API is alive and ready.",
        docs: "/health, /api/maintainer/…, /auth/github, …",
        note: "See /health for a lightweight uptime probe."
    });
});
app.use((_req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: "The requested endpoint does not exist",
    });
});
// Auth routes
app.use("/", auth_1.default);
app.use((_req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: "The requested endpoint does not exist",
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// MongoDB connection
let isConnected = false;
const connectDB = async () => {
    if (isConnected)
        return;
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        await mongoose_1.default.connect(mongoURI);
        isConnected = true;
        console.log("✅ MongoDB connected successfully");
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
    }
};
// ✅ Serverless export (required for Vercel)
exports.default = app;
// ✅ For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    });
}
//# sourceMappingURL=index.js.map