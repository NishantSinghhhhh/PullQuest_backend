"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../model/User"));
const router = (0, express_1.Router)();
// POST /register
router.post("/register", async (req, res) => {
    const { email, password, role, githubUsername } = req.body;
    if (!role || !password) {
        res.status(400).json({ message: "Role and password are required" });
        return;
    }
    if (role === "company") {
        if (!email) {
            res.status(400).json({ message: "Email is required for company" });
            return;
        }
    }
    else {
        if (!githubUsername) {
            res.status(400).json({ message: "GitHub username is required for this role" });
            return;
        }
    }
    try {
        const existing = await User_1.default.findOne(role === "company"
            ? { email }
            : { githubUsername, role });
        if (existing) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = new User_1.default({
            email: email || undefined,
            password: hashedPassword,
            role,
            githubUsername: githubUsername || undefined,
        });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
});
// POST /login
router.post("/login", async (req, res) => {
    const { email, password, role, githubUsername } = req.body;
    if (!role) {
        res.status(400).json({ message: "Role is required" });
        return;
    }
    try {
        let user;
        if (role === "company") {
            if (!email || !password) {
                res.status(400).json({ message: "Email and password required for company" });
                return;
            }
            user = await User_1.default.findOne({ email, role });
            if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
                res.status(401).json({ message: "Invalid credentials" });
                return;
            }
        }
        else {
            if (!githubUsername) {
                res.status(400).json({ message: "GitHub username is required for this role" });
                return;
            }
            user = await User_1.default.findOne({ githubUsername, role });
            if (!user) {
                res.status(401).json({ message: "Invalid GitHub credentials" });
                return;
            }
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ token });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map