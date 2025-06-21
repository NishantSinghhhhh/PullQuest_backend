import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import { verifyToken } from "./middleware/verifyToken";
import helmet from "helmet";
import { handlePRWebhook } from "./webhooks/githubWebhooks";
import passport from "passport";
import "./auth/github";
import contributorRoutes from "./routes/contributorRoutes";
import maintainerRoutes from "./routes/MaintainerRoutes";
import { githubApiRateLimit } from "./middleware/rateLimitMiddleware";
import User from "./model/User";
import commentRoute from './routes/commentRoutes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ✅ Initialize Passport WITHOUT sessions (serverless-friendly)
app.use(passport.initialize());

// Health check
app.get("/health", (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// GitHub OAuth (without sessions)
app.get("/auth/github", passport.authenticate("github", { 
  scope: ["user:email"],
  session: false 
}));

app.get("/auth/github/callback",
  passport.authenticate("github", { 
    failureRedirect: "/", 
    session: false 
  }),
  async (req, res) => {
    try {
      const user = req.user as any;
      const { profile, accessToken, refreshToken } = user;
      const githubUsername = profile.username;
      const githubInfo = JSON.stringify(profile._json);

      // Save to MongoDB
      await connectDB();
      const dbUser = await User.findOneAndUpdate(
        { githubUsername },
        {
          $set: {
            accessToken,
            refreshToken,
            githubInfo,
            lastLogin: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      console.log("✅ Saved GitHub user to DB");
      
      // Create JWT token instead of session
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: dbUser._id,
          githubUsername: githubUsername 
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
    }
  }
);

// API Routes
app.use("/api", githubApiRateLimit);
app.use('/api/comment', commentRoute);
app.use("/api/contributor", contributorRoutes);
app.use("/api/maintainer", maintainerRoutes);

// Webhooks
app.post("/webhooks/github", 
  express.json({ type: "application/json" }), 
  handlePRWebhook
);

// Auth routes
app.use("/", authRoutes);

// 404 handler
// 👇 place this AFTER all other app.use / app.get / router mounts
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    message: "The requested endpoint does not exist",
  });
});


// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// MongoDB connection
let isConnected = false;
const connectDB = async (): Promise<void> => {
  if (isConnected) return;
  
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error: any) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

// ✅ Serverless export (required for Vercel)
export default app;

// ✅ For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}