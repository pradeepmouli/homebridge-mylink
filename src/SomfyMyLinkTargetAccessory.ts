import * as HB from 'homebridge';
import { SomfySynergyPlatform, Target, Commands } from '@pmouli/somfy-synergy';
import {Direction} from './Commands';
import {SomfyMyLinkPlatform} from './SomfyMyLinkPlatform';
import {callbackify} from 'util';
import {Socket} from 'dgram';
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

  pendingTargetValue: number;
  queue: number[];
  target: Target & TargetConfig;
  synergy: SomfySynergyPlatform;
  name: string;

  requests: number[];
  direction: Direction  = Direction.Stopped;
  services: HB.Service[];
  primaryService: HB.Service;
  category: HB.Categories.WINDOW_COVERING;
  isProcessing: boolean = false;
  constructor(platform: SomfyMyLinkPlatform, target: Target & TargetConfig) {
    super(
      platform,
      platform.logger,

      target.name,
      target.displayName, target.ID
    );
    const name = target.name;
    //const ID = target.ID;
    //const displayName = `${name}`;
    //this.UUID = UUIDGen.generate(`mylink.target.${ID}`);

    this.category = HB.Categories.WINDOW_COVERING;


    // Homebridge requires these.
    this.name = target.name;

    this.target = target;


    this.synergy = platform.synergy;
    this.requests = [];

    //.getCharacteristic(Characteristic.TargetPosition).setValue(0);
  }

  getServices() {
    return this.services;
  }

  handleCommandTriggered(commands: Commands)
  {
      switch (commands) {
        case Commands.Down:
          this.primaryService.updateCharacteristic(Characteristic.PositionState,Characteristic.PositionState.DECREASING);
          break;
        case Commands.Up:
          this.primaryService.updateCharacteristic(Characteristic.PositionState,Characteristic.PositionState.INCREASING);
          break;
        case Commands.Stop:
          this.primaryService.updateCharacteristic(Characteristic.PositionState,Characteristic.PositionState.STOPPED);
          break;
        default:
          break;
      }
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
      'Received request to update position to',
      targetPosition
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
  
    return s;
  }

  async processRequests(lastPosition: number) {
    this.primaryService.updateCharacteristic(
      Characteristic.CurrentPosition,
      lastPosition,
    );
    const requestedPosition = this.requests.pop();
    if (requestedPosition != undefined && requestedPosition != lastPosition) {
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
          let response = await await ( this.direction === Direction.Opening
              ? this.target.moveUp()
              : this.direction === Direction.Closing ? this.target.moveDown() : this.target.stop());
          this.logger('Command response %s', response);
        } catch (error) {
          this.logger.error(error);
          this.isProcessing = false;
          this.direction = Direction.Stopped;
          this.primaryService.updateCharacteristic(Characteristic.PositionState,Characteristic.PositionState.STOPPED);
          return Promise.reject(error);
        }
      }

      setTimeout(
        this.processRequests.bind(this, requestedPosition),
        timeToWait * 1000 + 500 /*delay*/,
      );
    }
    else if(requestedPosition === undefined){
      this.logger('No more requests to process. Stopping.');
      this.isProcessing = false;
      this.direction = Direction.Stopped;

      if (lastPosition !== 100 && lastPosition !== 0) {
        this.logger('Sending stop command.');
        await this.target.stop();
      }
      else
      {
        this.primaryService.updateCharacteristic(Characteristic.PositionState,Characteristic.PositionState.STOPPED);
      }
    }
    else
    {
        this.processRequests(requestedPosition);
    }
    return Promise.resolve();
  }

  async setPosition(targetValue: number) : Promise<number>{
    await this.scheduleRequest(targetValue);
    return targetValue;
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


    service
      .getCharacteristic(Characteristic.TargetPosition)
      .on('set',((p,q) => this.setPosition(p).handleWith(q)).bind(this))
      .setProps({minStep: 10});

    this.primaryService = service;
  }
}
