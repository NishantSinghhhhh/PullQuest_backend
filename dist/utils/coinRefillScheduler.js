"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleCoinRefill = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../model/User"));
const scheduleCoinRefill = () => {
    node_cron_1.default.schedule("0 0 1 * *", async () => {
        try {
            const result = await User_1.default.updateMany({ role: "contributor" }, {
                $inc: { coins: 100 },
                $set: { monthlyCoinsLastRefill: new Date() },
            });
            console.log(`Refilled coins for ${result.modifiedCount} contributors`);
        }
        catch (error) {
            console.error("Coin Refill Failed: ", error);
        }
    });
};
exports.scheduleCoinRefill = scheduleCoinRefill;
//# sourceMappingURL=coinRefillScheduler.js.map