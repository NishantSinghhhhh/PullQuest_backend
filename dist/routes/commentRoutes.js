"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/commentRoutes.ts
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const router = (0, express_1.Router)();
/* POST /api/comment/issues */
router.post("/issues", commentController_1.commentOnIssues);
exports.default = router;
//# sourceMappingURL=commentRoutes.js.map