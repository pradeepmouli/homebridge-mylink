'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.UUIDGen = exports.Service = exports.Characteristic = exports.PlatformAccessory = exports.setTimeoutPromise = void 0;
const util_1 = require('util');
const hb_kit_1 = require('hb-kit');
exports.setTimeoutPromise = util_1.promisify(setTimeout);
exports.default = homebridge => {
  exports.PlatformAccessory = homebridge.platformAccessory;
  exports.Characteristic = homebridge.hap.Characteristic;
  exports.Service = homebridge.hap.Service;
  Accessory = homebridge.hap.Accessory;
  exports.UUIDGen = homebridge.hap.uuid;
  /**
   * Platform "Somfy myLink"
   */
  hb_kit_1.pluginInitializer(
    'homebridge-mylink',
    'Somfy myLink',
    SomfyMyLinkPlatform_1.SomfyMyLinkPlatform,
    homebridge,
  );
};
let Accessory;
const SomfyMyLinkPlatform_1 = require('./SomfyMyLinkPlatform');
//# sourceMappingURL=Plugin.js.map
