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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ["contributor", "maintainer", "company"],
        default: "contributor", // Add default role
    },
    githubUsername: { type: String, sparse: true, trim: true },
    /* ─── NEW FIELDS ──────────────────────────────── */
    accessToken: { type: String },
    githubInfo: { type: String },
    /* ─────────────────────────────────────────────── */
    profile: {
        name: { type: String, trim: true },
        bio: { type: String, maxlength: 500 },
    },
    coins: {
        type: Number,
        default: function () {
            return this?.role === "contributor" || this?.role == null
                ? 100
                : 0;
        },
    },
    xp: { type: Number, default: 0 },
    rank: {
        type: String,
        default: "Code Novice",
        enum: [
            "Code Novice",
            "Code Apprentice",
            "Code Contributor",
            "Code Master",
            "Code Expert",
            "Open Source Legend",
        ],
    },
    monthlyCoinsLastRefill: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },
}, { timestamps: true });
// userSchema.index({ email: 1 });
// userSchema.index({ githubUsername: 1 });
userSchema.index({ role: 1 });
userSchema.index({ xp: -1 });
userSchema.methods.calculateRank = function () {
    const xp = this.xp || 0;
    if (xp >= 5000)
        return "Open Source Legend";
    if (xp >= 3000 && xp < 5000)
        return "Code Expert";
    if (xp >= 1500 && xp < 3000)
        return "Code Master";
    if (xp >= 500 && xp < 1500)
        return "Code Contributor";
    if (xp >= 100 && xp < 500)
        return "Code Apprentice";
    return "Code Novice";
};
userSchema.pre("save", function (next) {
    if (this.role === "contributor") {
        this.rank = this.calculateRank();
    }
    next();
});
userSchema.methods.xpForNextRank = function () {
    const xp = this.xp || 0;
    if (xp < 100)
        return 100 - xp;
    if (xp >= 100 && xp < 500)
        return 500 - xp;
    if (xp >= 500 && xp < 1500)
        return 1500 - xp;
    if (xp >= 1500 && xp < 3000)
        return 3500 - xp;
    if (xp >= 3000 && xp < 5000)
        return 5000 - xp;
    return 0;
};
exports.default = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=User.js.map