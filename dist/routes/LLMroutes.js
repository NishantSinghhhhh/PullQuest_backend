"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LLMcontroller_1 = require("../controllers/LLMcontroller");
const router = (0, express_1.Router)();
router.post("/generate-context/", LLMcontroller_1.generateContext);
exports.default = router;
//# sourceMappingURL=LLMroutes.js.map