import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import User from "../model/User";
import {
  GitHubOrganizationsService,
  IOrganization,
} from "../services/githubService";

const orgService = new GitHubOrganizationsService(process.env.GITHUB_TOKEN);

// extend session type
declare module "express-session" {
  interface SessionData {
    user?: {
      githubId: number;
      login: string;
      avatar: string;
    };
  }
}

const router = Router();

router.get("/github/orgs/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const orgs: IOrganization[] = await orgService.getUserOrganizations(
      username
    );
    res.json(orgs);
  } catch (err) {
    next(err);
  }
});

// 2️⃣ Fetch all (public+private) orgs for *your* token
router.get("/github/orgs", async (req, res, next) => {
  try {
    // no username → uses /user/orgs under the hood
    const orgs: IOrganization[] = await orgService.getUserOrganizations();
    res.json(orgs);
  } catch (err) {
    next(err);
  }
});

// Initiate GitHub OAuth flow
router.get(
  "/auth/github",
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID as string,
        redirect_uri: process.env.GITHUB_CALLBACK_URL as string,
        scope: "read:user user:email repo",
      });
      res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    } catch (err) {
      next(err);
    }
  }
);

// Handle callback
router.get(
  "/auth/callback/github",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.redirect(`http://localhost:5173/login?error=missing_code`);
        return;
      }

      // Exchange code for token
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenJson: any = await tokenResponse.json();
      const access_token = tokenJson.access_token as string;
      
      if (!access_token) {
        console.error("No access token received:", tokenJson);
        res.redirect(`http://localhost:5173/login?error=oauth_failed`);
        return;
      }

      // Fetch GitHub profile
      const userResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      const githubProfile: any = await userResponse.json();
      console.log("GitHub Profile:", githubProfile);

      // Find user in database by GitHub username
      const existingUser = await User.findOne({
        githubUsername: githubProfile.login
      });

      if (!existingUser) {
        console.error("User not found for GitHub username:", githubProfile.login);
        res.redirect(`http://localhost:5173/login?error=user_not_found&username=${githubProfile.login}`);
        return;
      }

      // Update user with GitHub info and access token
      existingUser.accessToken = access_token;
      existingUser.githubInfo = JSON.stringify({
        name: githubProfile.name,
        avatar_url: githubProfile.avatar_url,
        public_repos: githubProfile.public_repos,
        followers: githubProfile.followers,
        following: githubProfile.following,
        location: githubProfile.location,
        bio: githubProfile.bio,
        company: githubProfile.company,
      });

      await existingUser.save();

      // Create user object for frontend
      const userForFrontend = {
        _id: existingUser._id,
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
        githubUsername: existingUser.githubUsername,
        xp: existingUser.xp || 0,
        coins: existingUser.coins || 100,
        isActive: existingUser.isActive,
        accessToken: access_token,
        githubInfo: {
          name: githubProfile.name,
          avatar_url: githubProfile.avatar_url,
          public_repos: githubProfile.public_repos,
          followers: githubProfile.followers,
          following: githubProfile.following,
          location: githubProfile.location,
          bio: githubProfile.bio,
        },
        profile: {
          name: existingUser.profile?.name || githubProfile.name,
          bio: existingUser.profile?.bio || githubProfile.bio,
          username: existingUser.githubUsername,
        },
        weeklyCoinsEarned: 0,
        lastLogin: existingUser.lastLogin,
        createdAt: existingUser.createdAt,
      };

      console.log("Sending user to frontend:", userForFrontend);

      // Redirect to frontend with user data
      const userParam = encodeURIComponent(JSON.stringify(userForFrontend));
      res.redirect(`http://localhost:5173/login?user=${userParam}`);

    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect(`http://localhost:5173/login?error=oauth_error`);
    }
  }
);

export default router;