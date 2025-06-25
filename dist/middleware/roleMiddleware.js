"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMultipleRoles = exports.validateCompanyRole = exports.validateMaintainerRole = exports.validateContributorRole = void 0;
/**
 * Middleware to validate that the user has contributor role
 */
const validateContributorRole = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        if (req.user.role !== 'contributor') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Contributor role required.',
                userRole: req.user.role,
            });
            return;
        }
        console.log(`Contributor access granted for user: ${req.user.email}`);
        next();
    }
    catch (error) {
        console.error('Role validation error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Role validation failed',
        });
    }
};
exports.validateContributorRole = validateContributorRole;
/**
 * Middleware to validate that the user has maintainer role
 */
const validateMaintainerRole = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        if (req.user.role !== 'maintainer') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Maintainer role required.',
                userRole: req.user.role,
            });
            return;
        }
        console.log(`Maintainer access granted for user: ${req.user.email}`);
        next();
    }
    catch (error) {
        console.error('Role validation error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Role validation failed',
        });
    }
};
exports.validateMaintainerRole = validateMaintainerRole;
/**
 * Middleware to validate that the user has company role
 */
const validateCompanyRole = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        if (req.user.role !== 'company') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Company role required.',
                userRole: req.user.role,
            });
            return;
        }
        console.log(`Company access granted for user: ${req.user.email}`);
        next();
    }
    catch (error) {
        console.error('Role validation error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Role validation failed',
        });
    }
};
exports.validateCompanyRole = validateCompanyRole;
/**
 * Middleware to validate multiple roles (OR condition)
 */
const validateMultipleRoles = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }
            if (!allowedRoles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                    userRole: req.user.role,
                });
                return;
            }
            console.log(`Multi-role access granted for user: ${req.user.email} with role: ${req.user.role}`);
            next();
        }
        catch (error) {
            console.error('Multi-role validation error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Role validation failed',
            });
        }
    };
};
exports.validateMultipleRoles = validateMultipleRoles;
//# sourceMappingURL=roleMiddleware.js.map