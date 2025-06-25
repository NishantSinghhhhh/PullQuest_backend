"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = generateApiKey;
// src/utils/generateApiKey.mjs  ⬅︎ rename to .mjs OR keep .js once "type":"module"
const { customAlphabet } = require('nanoid');
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nanoid20 = customAlphabet(alphabet, 20);
function generateApiKey(orgName = '') {
    const prefix = orgName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 19);
    const random = nanoid20().slice(0, 20 - prefix.length);
    return `${prefix}${random}`;
}
//# sourceMappingURL=generateApiKey.js.map