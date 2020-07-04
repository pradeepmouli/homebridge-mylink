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
Object.defineProperty(exports, '__esModule', {value: true});
exports.SomfyMyLinkTargetAccessory = void 0;
const HB = __importStar(require('homebridge'));
const Commands_1 = require('./Commands');
const hb_kit_1 = require('hb-kit');
const hb_kit_2 = require('hb-kit');
const Plugin_1 = require('./Plugin');
class SomfyMyLinkTargetAccessory extends hb_kit_2.AccessoryBase {
  constructor(platform, target) {
    super(
      platform,
      hb_kit_1.PlatformBase.cloneLogger(
        platform.logger,
        `Target ${target.ID} (${target.name})`,
        'debug' /* DEBUG */,
      ),
    );
    this.direction = 0;
    const name = target.name;
    const ID = target.ID;
    const displayName = `${name}`;
    this.UUID = hb_kit_1.UUIDGen.generate(`mylink.target.${ID}`);
    this.category = 14 /* WINDOW_COVERING */;
    this.currentTask = Promise.resolve({});
    // Homebridge requires these.
    this.name = displayName;
    this.target = target;
    this.synergy = platform.synergy;
    this.requests = [];
    //.getCharacteristic(Characteristic.TargetPosition).setValue(0);
  }
  getServices() {
    return this.services;
  }
  setHoldPosition(targetValue, callback) {
    const handleError = error => {
      this.logger(
        'Encountered an error setting target position of %s: %s',
        `target ${this.target.ID} (${this.name})`,
        error.message,
      );
      callback(error);
    };
    const target = this.synergy.target(this.target.ID);
    const promise = target['stop']();
    promise.then(() => {
      this.logger(`Target ${this.target.ID} (${this.name})`, 'Stopped');
      this.primaryService.updateCharacteristic(
        hb_kit_1.Characteristic.PositionState,
        hb_kit_1.Characteristic.PositionState.STOPPED,
      );
      callback();
    }, handleError);
  }
  async scheduleRequest(targetPosition) {
    this.logger(
      'Received request to update position of %s to %s.',
      targetPosition,
    );
    this.requests.unshift(targetPosition);
    if (!this.isProcessing) {
      this.logger(
        'This is the first request in queue. Calling processRequests.',
      );
      this.isProcessing = true;
      const currentPosition = this.primaryService.getCharacteristic(
        hb_kit_1.Characteristic.CurrentPosition,
      ).value;
      return this.processRequests(currentPosition);
    } else {
      this.logger('Requests in queue:', this.requests.length);
    }
    return Promise.resolve();
  }
  configure(accessory) {
    let s = super.configure(accessory);
    this.buildServices();
    return s;
  }
  async processRequests(lastPosition) {
    var _a;
    this.primaryService.setCharacteristic(
      hb_kit_1.Characteristic.CurrentPosition,
      lastPosition,
    );
    if (this.requests.length > 0) {
      const requestedPosition = this.requests.pop();
      const newDirection =
        requestedPosition < lastPosition
          ? Commands_1.Direction.Closing
          : requestedPosition > lastPosition
          ? Commands_1.Direction.Opening
          : Commands_1.Direction.Stopped;
      const timeToWait =
        (Math.abs(requestedPosition - lastPosition) / 100) *
        ((_a = this.target.timeToOpen) !== null && _a !== void 0 ? _a : 30);
      this.logger(
        'Setting position of %s from %s to %s.',
        `target ${this.target.ID} (${this.name})`,
        `${lastPosition}%`,
        `${requestedPosition}%`,
        'it will take ' + timeToWait + ' seconds.',
      );
      if (newDirection != this.direction) {
        this.logger(
          'Changing direction from %s to %s. Sending command',
          Commands_1.Direction[this.direction],
          Commands_1.Direction[newDirection],
        );
        this.direction = newDirection;
        try {
          let response = await Promise.any([
            this.direction === Commands_1.Direction.Opening
              ? this.target.moveUp()
              : this.target.moveDown(),
            Plugin_1.setTimeoutPromise(30000),
          ]);
          this.logger('Command response %s', response);
        } catch (error) {
          this.logger.error(error);
          this.isProcessing = false;
          this.direction = Commands_1.Direction.Stopped;
          return Promise.reject(error);
        }
      }
      setTimeout(
        this.processRequests.bind(this, requestedPosition),
        timeToWait * 1000 + 500 /*delay*/,
      );
    } else {
      this.logger('No more requests to process. Stopping.');
      this.isProcessing = false;
      this.direction = Commands_1.Direction.Stopped;
      if (lastPosition !== 100 && lastPosition !== 0) {
        this.logger('Sending stop command.');
        await this.target.stop();
      }
    }
    return Promise.resolve();
  }
  async setPosition(targetValue) {
    return this.scheduleRequest(targetValue);
  }
  buildServices() {
    const service = this.platformAccessory.getOrAddService(
      hb_kit_1.Service.WindowCovering,
    );
    const s = this.platformAccessory.getOrAddService(
      hb_kit_1.Service.AccessoryInformation,
    );
    s.setCharacteristic(hb_kit_1.Characteristic.SerialNumber, this.target.ID)
      .setCharacteristic(hb_kit_1.Characteristic.Manufacturer, 'Somfy')
      .setCharacteristic(hb_kit_1.Characteristic.Model, 'myLink');
    //const holdPosition = service.getCharacteristic(Characteristic.HoldPosition);
    //holdPosition.updateValue(true);
    // holdPosition.on('set', this.setHoldPosition.bind(this));
    const currentPosition = service.getCharacteristic(
      hb_kit_1.Characteristic.CurrentPosition,
    );
    service
      .getCharacteristic(hb_kit_1.Characteristic.TargetPosition)
      .onSet(this.setPosition.bind(this))
      .setProps({minStep: 10});
    this.primaryService = service;
  }
}
exports.SomfyMyLinkTargetAccessory = SomfyMyLinkTargetAccessory;
//# sourceMappingURL=SomfyMyLinkTargetAccessory.js.map
