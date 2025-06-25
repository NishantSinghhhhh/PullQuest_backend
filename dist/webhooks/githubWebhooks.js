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
exports.handlePRWebhook = void 0;
const stake_1 = __importStar(require("../model/stake"));
const handlePRWebhook = async (req, res) => {
    try {
        const event = req.headers["x-github-event"];
        const payload = req.body;
        if (event === "pull_request") {
            const { action, pull_request } = payload;
            const prUrl = pull_request.html_url;
            const stake = await stake_1.default.findOne({ prUrl });
            if (!stake)
                return;
            switch (action) {
                case "closed":
                    if (pull_request.merged) {
                        stake.status = stake_1.StakeStatus.ACCEPTED;
                    }
                    else {
                        stake.status = stake_1.StakeStatus.REJECTED;
                    }
                    break;
                case "reopened":
                    stake.status = stake_1.StakeStatus.PENDING;
                    break;
            }
            await stake.save();
        }
        res.status(200).send("Webhook Processed");
    }
    catch (error) {
        console.error("Webhook error: ", error);
        res.status(500).send("Internal server error");
    }
};
exports.handlePRWebhook = handlePRWebhook;
//# sourceMappingURL=githubWebhooks.js.map