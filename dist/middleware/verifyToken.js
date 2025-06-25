"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    // Add explicit return type
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (!token) {
        res.status(403).json({ message: "No token provided" });
        return; // Return void, not the response
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Authenticated user:", decoded);
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid token" });
        return; // Return void, not the response
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=verifyToken.js.map