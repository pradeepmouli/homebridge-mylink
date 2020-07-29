import * as HB from 'homebridge';

import {SomfySynergyPlatform} from '@pmouli/somfy-synergy';
import {promisify, format} from 'util';
import {pluginInitializer} from 'hb-kit';

export const platformName = 'Somfy myLink';
export const setTimeoutPromise = promisify(setTimeout);

export default (homebridge: HB.API) => {


  /**
   * Platform "Somfy myLink"
   */


  pluginInitializer(
    platformName,
    SomfyMyLinkPlatform,
    homebridge,
  );
};


export let UUIDGen;

import {SomfyMyLinkPlatform} from './SomfyMyLinkPlatform';
