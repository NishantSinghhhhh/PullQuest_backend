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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakeController = void 0;
const stake_1 = __importStar(require("../model/stake"));
const User_1 = __importDefault(require("../model/User"));
class StakeController {
    constructor() {
        this.createStake = async (req, res) => {
            try {
                const { userId } = req.body;
                const { issueId, repository, amount, prUrl } = req.body;
                const user = await User_1.default.findById(userId);
                if (!user || user.coins < amount) {
                    res.status(400).json({
                        success: false,
                        message: "Insufficient coins",
                    });
                    return;
                }
                user.coins -= amount;
                await user.save();
                const stake = new stake_1.default({
                    userId,
                    issueId,
                    repository,
                    amount,
                    prUrl,
                    status: stake_1.StakeStatus.PENDING,
                });
                await stake.save();
                res.status(201).json({
                    success: true,
                    message: "Stake created successfully",
                    data: stake,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to create stake",
                    error: error.message,
                });
            }
        };
        this.updateStakeStatus = async (req, res) => {
            try {
                const { stakeId } = req.params;
                const { status, xpEarned, coinsEarned } = req.body;
                const stake = await stake_1.default.findById(stakeId);
                if (!stake) {
                    res.status(404).json({
                        success: false,
                        message: "Stake not found",
                    });
                    return;
                }
                const user = await User_1.default.findById(stake.userId);
                if (!user) {
                    res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                    return;
                }
                switch (status) {
                    case stake_1.StakeStatus.ACCEPTED:
                        user.coins += stake.amount + (coinsEarned || 0);
                        user.xp = (user.xp || 0) + (xpEarned || 0);
                        break;
                    case stake_1.StakeStatus.REJECTED:
                        user.coins += coinsEarned || 0;
                        break;
                    case stake_1.StakeStatus.EXPIRED:
                        user.coins += stake.amount;
                        break;
                }
                stake.status = status;
                stake.xpEarned = xpEarned;
                stake.coinsEarned = coinsEarned;
                await Promise.all([stake.save(), user.save()]);
                res.status(200).json({
                    success: true,
                    message: "Stake status updated",
                    data: stake,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to update stake",
                    error: error.message,
                });
            }
        };
        this.getUserStakes = async (req, res) => {
            try {
                const { userId } = req.body;
                const stakes = await stake_1.default.find({ userId }).sort({ createdAt: -1 });
                res.status(200).json({
                    success: true,
                    message: "Got stakes successfully",
                    data: stakes,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to get stake",
                    error: error.message,
                });
            }
        };
    }
}
exports.StakeController = StakeController;
//# sourceMappingURL=stakeController.js.map