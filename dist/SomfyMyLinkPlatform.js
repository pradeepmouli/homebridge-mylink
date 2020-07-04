'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function() {
            return m[k];
          },
        });
      }
    : function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function(o, v) {
        Object.defineProperty(o, 'default', {enumerable: true, value: v});
      }
    : function(o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.SomfyMyLinkPlatform = void 0;
const HB = __importStar(require('homebridge'));
const somfy_synergy_1 = __importDefault(require('@pmouli/somfy-synergy'));
const somfy_synergy_2 = require('@pmouli/somfy-synergy');
const SomfyMyLinkTargetAccessory_1 = require('./SomfyMyLinkTargetAccessory');
const hb_kit_1 = require('hb-kit');
class SomfyMyLinkPlatform extends hb_kit_1.PlatformBase {
  constructor(log, config, api) {
    config.platform = 'Somfy myLink';
    super(log, config, api);
  }
  async buildAccessories() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
      this.pluginName = 'homebridge-mylink';
      this.client = new somfy_synergy_1.default(
        this.config.systemID,
        hb_kit_1.PlatformBase.cloneLogger(
          this.logger,
          'somfy-synergy-api',
          'debug' /* DEBUG */,
        ),
        (_b =
          (_a = this.config.poolOptions) === null || _a === void 0
            ? void 0
            : _a.usePool) !== null && _b !== void 0
          ? _b
          : true,
        this.config.host,
        44100,
        (_d =
          (_c = this.config.connectionOptions) === null || _c === void 0
            ? void 0
            : _c.allowHalfOpen) !== null && _d !== void 0
          ? _d
          : true,
        (_f =
          (_e = this.config.connectionOptions) === null || _e === void 0
            ? void 0
            : _e.timeout) !== null && _f !== void 0
          ? _f
          : 3000,
      );
      this.synergy = new somfy_synergy_1.default.Platform(
        this.client,
        (_g = this.config.compositeTargets) !== null && _g !== void 0 ? _g : [],
      );
      this.targets = new Map();
      this.config.targets.forEach(p => this.targets.set(p.ID, p));
      await this.synergy.initialize();
    } catch (error) {
      this.logger.error(error);
      //await this.synergy.initialize();
    }
    //await this.initialized;
    let list = new Array();
    if (
      ((_h = this.synergy.targets) === null || _h === void 0
        ? void 0
        : _h.size) > 0
    ) {
      this.synergy.targets.forEach(target => {
        var _a;
        let t = this.targets.get(target.ID);
        if (t) {
          // target.name = t.name;
          target.timeToOpen =
            (_a = t.timeToOpen) !== null && _a !== void 0 ? _a : 30;
          target.orientation = t.orientation;
        }
        list.push(
          new SomfyMyLinkTargetAccessory_1.SomfyMyLinkTargetAccessory(
            this,
            target,
          ),
        );
      });
    } /*communication issues*/ else {
      this.targets.forEach(t => {
        var _a;
        let target = new somfy_synergy_2.Target(this.synergy.client, {
          targetID: t.ID,
          name: t.name,
          type: 0,
        });
        if (t) {
          // target.name = t.name;
          target.timeToOpen =
            (_a = t.timeToOpen) !== null && _a !== void 0 ? _a : 30;
          target.orientation = t.orientation;
        }
        list.push(
          new SomfyMyLinkTargetAccessory_1.SomfyMyLinkTargetAccessory(
            this,
            target,
          ),
        );
      });
    }
    return list;
  }
}
exports.SomfyMyLinkPlatform = SomfyMyLinkPlatform;
//# sourceMappingURL=SomfyMyLinkPlatform.js.map
