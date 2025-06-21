"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const verifyToken_1 = require("./middleware/verifyToken");
const helmet_1 = __importDefault(require("helmet"));
const githubWebhooks_1 = require("./webhooks/githubWebhooks");
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
require("./auth/github");
const contributorRoutes_1 = __importDefault(require("./routes/contributorRoutes"));
const MaintainerRoutes_1 = __importDefault(require("./routes/MaintainerRoutes"));
const rateLimitMiddleware_1 = require("./middleware/rateLimitMiddleware");
const User_1 = __importDefault(require("./model/User"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: "pullquestby4anus",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Middleware to skip verifyToken on /login and /register
const jwtMiddleware = (req, res, next) => {
    // Allow unauthenticated access to these paths
    if (req.path === "/login" || req.path === "/register") {
        next();
        return;
    }
    // Otherwise verify token
    (0, verifyToken_1.verifyToken)(req, res, next);
};
// Start GitHub OAuth flow
app.get("/auth/github", passport_1.default.authenticate("github", { scope: ["user:email"] }));
app.use('/api/comment', commentRoutes_1.default);
app.get("/auth/github/callback", passport_1.default.authenticate("github", { failureRedirect: "/" }), (req, res) => {
    const user = req.user;
    // ─── Persist into MongoDB ─────────────────────────────────────────
    const { profile, accessToken, refreshToken } = user;
    const githubUsername = profile.username;
    const githubInfo = JSON.stringify(profile._json);
    User_1.default.findOneAndUpdate({ githubUsername }, {
        $set: {
            accessToken,
            refreshToken,
            githubInfo,
            lastLogin: new Date(),
        },
    }, { upsert: true, new: true }).then(dbUser => {
        console.log("✅ Saved GitHub user to DB with _id:", dbUser._id);
    }).catch(err => {
        console.error("❌ Error saving GitHub user to DB:", err);
    });
    // ─────────────────────────────────────────────────────────────────
    console.log("✅ GitHub OAuth success:");
    console.log("Full user object →", JSON.stringify(user, null, 2));
    console.log("accessToken →", user.accessToken);
    console.log("refreshToken →", user.refreshToken);
    res.redirect(`http://localhost:5173?user=${JSON.stringify(req.user)}`);
});
app.get("/api/user", (req, res) => {
    res.json(req.user || null);
});
app.use("/api", rateLimitMiddleware_1.githubApiRateLimit);
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});
app.post("/webhooks/github", express_1.default.json({
    type: "application/json",
}), githubWebhooks_1.handlePRWebhook);
app.use("/", auth_1.default);
app.use("/api/contributor", contributorRoutes_1.default);
app.use("/api/maintainer", MaintainerRoutes_1.default);
//db connection function
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        await mongoose_1.default.connect(mongoURI);
        console.log("✅ MongoDB connected successfully");
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};
// Start server
const startServer = async () => {
    try {
        await connectDB();
        Promise.resolve().then(() => __importStar(require("./utils/coinRefillScheduler"))).then((module) => {
            module.scheduleCoinRefill();
        });
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};
startServer();
