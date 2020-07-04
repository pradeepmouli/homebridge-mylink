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
const HB = __importStar(require('homebridge'));
const somfy_synergy_1 = __importDefault(require('@pmouli/somfy-synergy'));
const util_1 = require('util');
let PlatformAccessory;
let Characteristic;
let Service;
let Accessory;
let UUIDGen;
const setTimeoutPromise = util_1.promisify(setTimeout);
exports.default = homebridge => {
  PlatformAccessory = homebridge.platformAccessory;
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  Accessory = homebridge.hap.Accessory;
  UUIDGen = homebridge.hap.uuid;
  /**
   * Platform "Somfy myLink"
   */
  class SomfyMyLinkPlatform {
    constructor(log, config, api) {
      var _a;
      this.log = log;
      this.client = new somfy_synergy_1.default(config.systemID, config.host);
      this.config = config;
      this.synergy = new somfy_synergy_1.default.Platform(
        this.client,
        (_a = this.config.compositeTargets) !== null && _a !== void 0 ? _a : [],
      );
      this.targets = new Map();
      this.config.targets.forEach(p => this.targets.set(p.ID, p));
      this.api = api;
    }
    async accessories(callback) {
      //list targets
      try {
        await this.synergy.initialize();
      } catch (error) {
        console.error(error);
        await this.synergy.initialize();
      }
      //await this.initialized;
      let list = [];
      this.synergy.targets.forEach(target => {
        var _a;
        let t = this.targets.get(target.ID);
        if (t) {
          // target.name = t.name;
          target.timeToOpen =
            (_a = t.timeToOpen) !== null && _a !== void 0 ? _a : 30;
          console.log(target.timeToOpen);
          target.orientation = t.orientation;
        }
        list.push(new SomfyMyLinkTargetAccessory(this, target));
      });
      callback(list);
    }
  }
  class SomfyMyLinkTargetAccessory extends PlatformAccessory {
    constructor(platform, target) {
      const name = target.name;
      const ID = target.ID;
      const displayName = `${name}`;
      const uuid = UUIDGen.generate(`mylink.target.${ID}`);
      super(displayName, uuid);
      this.category = 14 /* WINDOW_COVERING */;
      this.currentTask = Promise.resolve({});
      // Homebridge requires these.
      this.name = displayName;
      this.uuid_base = uuid;
      this.target = target;
      this.log = platform.log;
      this.synergy = platform.synergy;
      this.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.SerialNumber, ID)
        .setCharacteristic(Characteristic.Manufacturer, 'Somfy')
        .setCharacteristic(Characteristic.Model, 'myLink');
      this.addService(this.createWindowCoveringService(name)); //.getCharacteristic(Characteristic.TargetPosition).setValue(0);
    }
    getServices() {
      return this.services;
    }
    setHoldPosition(targetValue, callback) {
      const handleError = error => {
        this.log(
          'Encountered an error setting target position of %s: %s',
          `target ${this.target.ID} (${this.name})`,
          error.message,
        );
        callback(error);
      };
      const target = this.synergy.target(this.target.ID);
      const promise = target['stop']();
      promise.then(() => {
        this.log(`Target ${this.target.ID} (${this.name})`, 'Stopped');
        this.getService(Service.WindowCovering).updateCharacteristic(
          Characteristic.PositionState,
          Characteristic.PositionState.STOPPED,
        );
        callback();
      }, handleError);
    }
    async setPosition(targetValue, callback) {
      const targetID = this.target.ID;
      const name = this.name;
      const handleError = error => {
        this.log(
          'Encountered an error setting target position of %s: %s',
          `target ${targetID} (${name})`,
          error.message,
        );
        // callback(error);
      };
      callback();
      /* if(this.currentTask)        {
              this.pendingTargetValue = this.pendingTargetValue ?? currentPosition.value.valueOf() as number;
              const timeToWait = Math.abs((this.pendingTargetValue - targetValue)) / 100 * timeToOpen;
              this.queue.push(timeToOpen);
              this.pendingTargetValue = targetValue;
              await this.currentTask;
    
            }
     */ const self = this;
      this.currentTask = this.currentTask.then(async () => {
        var _a, _b;
        const service = this.getService(Service.WindowCovering);
        const currentPosition = service.getCharacteristic(
          Characteristic.CurrentPosition,
        );
        const positionState = service.getCharacteristic(
          Characteristic.PositionState,
        );
        this.log(
          'Setting position of %s from %s to %s.',
          `target ${targetID} (${name})`,
          `${this.pendingTargetValue}%`,
          `${targetValue}%`,
        );
        const currentValue = currentPosition.value;
        this.pendingTargetValue =
          (_a = this.pendingTargetValue) !== null && _a !== void 0
            ? _a
            : currentValue;
        positionState.updateValue(
          targetValue < this.pendingTargetValue
            ? Characteristic.PositionState.DECREASING
            : targetValue > this.pendingTargetValue
            ? Characteristic.PositionState.INCREASING
            : Characteristic.PositionState.STOPPED,
        );
        if (positionState.value !== Characteristic.PositionState.STOPPED) {
          const timeToWait =
            (Math.abs(this.pendingTargetValue - targetValue) / 100) *
            ((_b = this.target.timeToOpen) !== null && _b !== void 0 ? _b : 30);
          const promise =
            positionState.value === Characteristic.PositionState.DECREASING
              ? this.target.moveDown()
              : this.target.moveUp();
          this.pendingTargetValue = targetValue;
          await promise.then(async p => {
            this.log(`Target ${targetID} (${name}): `, 'Command Response', p);
            //callback();
            await setTimeoutPromise(timeToWait * 1000);
            this.log(
              `target ${targetID} (${name})`,
              `reached ${targetValue}%`,
              'after ' + timeToWait + ' seconds.',
            );
            if (targetValue == 0 || targetValue == 100) {
              currentPosition.updateValue(targetValue);
              positionState.updateValue(Characteristic.PositionState.STOPPED);
            } else {
              await this.synergy
                .target(this.target.ID)
                .stop()
                .then(() => {
                  currentPosition.updateValue(targetValue);
                  positionState.updateValue(
                    Characteristic.PositionState.STOPPED,
                  );
                });
            }
            this.pendingTargetValue = null;
          }, handleError);
        }
      });
      // Set a more sane default value for the current position.
    }
    createWindowCoveringService(name) {
      const service = new Service.WindowCovering(name);
      const holdPosition = service.getCharacteristic(
        Characteristic.HoldPosition,
      );
      //holdPosition.updateValue(true);
      // holdPosition.on('set', this.setHoldPosition.bind(this));
      const currentPosition = service.getCharacteristic(
        Characteristic.CurrentPosition,
      );
      currentPosition.updateValue(0);
      const positionState = service.getCharacteristic(
        Characteristic.PositionState,
      );
      positionState.updateValue(Characteristic.PositionState.STOPPED);
      service
        .getCharacteristic(Characteristic.TargetPosition)
        .on('set', this.setPosition.bind(this));
      return service;
    }
  }
  homebridge.registerPlatform(
    'homebridge-mylink',
    'Somfy myLink',
    SomfyMyLinkPlatform,
  );
};
//# sourceMappingURL=index.js.map
