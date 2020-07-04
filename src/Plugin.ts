import * as HB from 'homebridge';
import {
  Characteristic as C,
  PlatformAccessory as PA,
  Service as S,
  Accessory as A,
} from 'homebridge';
import {SomfySynergyPlatform} from '@pmouli/somfy-synergy';
import {promisify, format} from 'util';
import {pluginInitializer} from 'hb-kit';

export const setTimeoutPromise = promisify(setTimeout);

export default (homebridge: HB.API) => {
  PlatformAccessory = homebridge.platformAccessory;
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  Accessory = homebridge.hap.Accessory;
  UUIDGen = homebridge.hap.uuid;

  /**
   * Platform "Somfy myLink"
   */

  pluginInitializer(
    'homebridge-mylink',
    'Somfy myLink',
    SomfyMyLinkPlatform,
    homebridge,
  );
};

export let PlatformAccessory: typeof PA;
export let Characteristic: typeof C;
export let Service: typeof S;
let Accessory: typeof A;
export let UUIDGen;

import {SomfyMyLinkPlatform} from './SomfyMyLinkPlatform';
