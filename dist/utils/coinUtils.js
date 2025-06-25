"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinUtils = void 0;
class CoinUtils {
    static calculateStake(issueBounty) {
        return Math.floor(issueBounty * 0.3);
    }
    static calculateEarnings(stake, outcome) {
        return outcome === "accepted" ? stake * 2 : Math.floor(stake * 0.5);
    }
    static calculateXPGain(issueXP, outcome) {
        return outcome === "accepted" ? issueXP : Math.floor(issueXP * 0.2);
    }
}
exports.CoinUtils = CoinUtils;
//# sourceMappingURL=coinUtils.js.map