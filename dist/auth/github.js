"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:8012/auth/github/callback",
    scope: [
        "read:user",
        "user:email",
        "repo",
        "read:org",
        "write:repo_hook",
        "admin:repo_hook",
        "write:repo_hook",
        "admin:repo_hook",
    ]
}, function (accessToken, refreshToken, profile, done) {
    const user = {
        profile,
        accessToken,
        refreshToken,
    };
    return done(null, user);
}));
//# sourceMappingURL=github.js.map