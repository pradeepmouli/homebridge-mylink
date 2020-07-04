import * as HB from 'homebridge';
import {SomfySynergyPlatform, Target} from '@pmouli/somfy-synergy';
import {Direction} from './Commands';
import {SomfyMyLinkPlatform} from './SomfyMyLinkPlatform';

import {
  UUIDGen,
  Service,
  Characteristic,
  PlatformAccessory,
  PlatformBase,
} from 'hb-kit';
import {AccessoryBase} from 'hb-kit';
import {setTimeoutPromise} from './Plugin';
import {TargetConfig} from './TargetConfig';
import {promisify} from 'util';

export class SomfyMyLinkTargetAccessory extends AccessoryBase<
  HB.Categories.WINDOW_COVERING
> {
  currentTask: Promise<any>;
  pendingTargetValue: number;
  queue: number[];
  target: Target & TargetConfig;
  synergy: SomfySynergyPlatform;
  name: string;

  requests: number[];
  direction: Direction = 0;
  services: HB.Service[];
  primaryService: HB.Service;
  category: HB.Categories.WINDOW_COVERING;
  isProcessing: boolean;
  constructor(platform: SomfyMyLinkPlatform, target: Target & TargetConfig) {
    super(
      platform,
      PlatformBase.cloneLogger(
        platform.logger,
        `Target ${target.ID} (${target.name})`,
        HB.LogLevel.DEBUG,
      ),
    );
    const name = target.name;
    const ID = target.ID;
    const displayName = `${name}`;
    this.UUID = UUIDGen.generate(`mylink.target.${ID}`);

    this.category = HB.Categories.WINDOW_COVERING;
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

  setHoldPosition(targetValue: number, callback: (arg0?: any) => void) {
    const handleError = (error: {message: any}) => {
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
        Characteristic.PositionState,
        Characteristic.PositionState.STOPPED,
      );
      callback();
    }, handleError);
  }

  async scheduleRequest(targetPosition: number) {
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
        Characteristic.CurrentPosition,
      ).value as number;
      return this.processRequests(currentPosition);
    } else {
      this.logger('Requests in queue:', this.requests.length);
    }
    return Promise.resolve();
  }

  configure(accessory?: HB.PlatformAccessory) {
    let s = super.configure(accessory);
    this.buildServices();
    return s;
  }

  async processRequests(lastPosition: number) {
    this.primaryService.setCharacteristic(
      Characteristic.CurrentPosition,
      lastPosition,
    );
    if (this.requests.length > 0) {
      const requestedPosition = this.requests.pop();

      const newDirection =
        requestedPosition < lastPosition
          ? Direction.Closing
          : requestedPosition > lastPosition
          ? Direction.Opening
          : Direction.Stopped;
      const timeToWait =
        (Math.abs(requestedPosition - lastPosition) / 100) *
        (this.target.timeToOpen ?? 30);
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
          Direction[this.direction],
          Direction[newDirection],
        );
        this.direction = newDirection;

        try {
          let response = await Promise.any([
            this.direction === Direction.Opening
              ? this.target.moveUp()
              : this.target.moveDown(),
            setTimeoutPromise(30000),
          ]);
          this.logger('Command response %s', response);
        } catch (error) {
          this.logger.error(error);
          this.isProcessing = false;
          this.direction = Direction.Stopped;
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
      this.direction = Direction.Stopped;
      if (lastPosition !== 100 && lastPosition !== 0) {
        this.logger('Sending stop command.');
        await this.target.stop();
      }
    }
    return Promise.resolve();
  }

  async setPosition(targetValue: number) {
    return this.scheduleRequest(targetValue);
  }

  buildServices() {
    const service = this.platformAccessory.getOrAddService(
      Service.WindowCovering,
    );

    const s = this.platformAccessory.getOrAddService(
      Service.AccessoryInformation,
    );
    s.setCharacteristic(Characteristic.SerialNumber, this.target.ID)
      .setCharacteristic(Characteristic.Manufacturer, 'Somfy')
      .setCharacteristic(Characteristic.Model, 'myLink');

    //const holdPosition = service.getCharacteristic(Characteristic.HoldPosition);
    //holdPosition.updateValue(true);
    // holdPosition.on('set', this.setHoldPosition.bind(this));
    const currentPosition = service.getCharacteristic(
      Characteristic.CurrentPosition,
    );

    service
      .getCharacteristic(Characteristic.TargetPosition)
      .onSet(this.setPosition.bind(this))
      .setProps({minStep: 10});

    this.primaryService = service;
  }
}
