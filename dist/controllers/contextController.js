"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = void 0;
const User_1 = __importDefault(require("../model/User"));
const getUserByEmail = async (req, res, next) => {
    const { email } = req.params;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return; // ✅ Add return to avoid hanging
        }
        res.json({
            id: user._id,
            email: user.email,
            role: user.role,
            githubUsername: user.githubUsername
        });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
};
exports.getUserByEmail = getUserByEmail;
//# sourceMappingURL=contextController.js.map