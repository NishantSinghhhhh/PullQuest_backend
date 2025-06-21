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
exports.StakeStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var StakeStatus;
(function (StakeStatus) {
    StakeStatus["PENDING"] = "pending";
    StakeStatus["ACCEPTED"] = "accepted";
    StakeStatus["REJECTED"] = "rejected";
    StakeStatus["EXPIRED"] = "expired";
})(StakeStatus || (exports.StakeStatus = StakeStatus = {}));
const stakeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issueId: {
        type: Number,
        required: true,
    },
    repository: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    status: {
        type: String,
        enum: Object.values(StakeStatus),
        default: StakeStatus.PENDING,
    },
    prUrl: {
        type: String,
        required: true,
    },
    xpEarned: {
        type: Number,
        min: 0,
    },
    coinsEarned: {
        type: Number,
    },
}, {
    timestamps: true,
});
stakeSchema.index({ userId: 1 });
stakeSchema.index({ issueId: 1 });
stakeSchema.index({ status: 1 });
const Stake = mongoose_1.default.model("Stake", stakeSchema);
exports.default = Stake;
