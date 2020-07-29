"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUIDGen = exports.setTimeoutPromise = exports.platformName = void 0;
const util_1 = require("util");
const hb_kit_1 = require("hb-kit");
exports.platformName = 'Somfy myLink';
exports.setTimeoutPromise = util_1.promisify(setTimeout);
exports.default = (homebridge) => {
    /**
     * Platform "Somfy myLink"
     */
    hb_kit_1.pluginInitializer(exports.platformName, SomfyMyLinkPlatform_1.SomfyMyLinkPlatform, homebridge);
};
const SomfyMyLinkPlatform_1 = require("./SomfyMyLinkPlatform");
//# sourceMappingURL=Plugin.js.map