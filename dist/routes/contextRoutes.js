"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contextController_1 = require("../controllers/contextController"); // ✅ Correct
const router = (0, express_1.Router)();
router.get("/context/:email", contextController_1.getUserByEmail);
exports.default = router;
//# sourceMappingURL=contextRoutes.js.map