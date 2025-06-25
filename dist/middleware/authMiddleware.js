"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'No token provided, authorization denied',
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET not found in environment variables');
            res.status(500).json({
                success: false,
                message: 'Server configuration error',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        console.log(`Authenticated user: ${decoded.email} with role: ${decoded.role}`);
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error.message);
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token has expired',
            });
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map