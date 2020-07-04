import * as HB from 'homebridge';
import SomfySynergy from '@pmouli/somfy-synergy';
import {SomfySynergyPlatform} from '@pmouli/somfy-synergy';
import {TargetConfig} from './TargetConfig';
import {SomfyMyLinkPlatformConfig} from './SomfyMyLinkPlatformConfig';
import {SomfyMyLinkTargetAccessory} from './SomfyMyLinkTargetAccessory';
import {PlatformBase} from 'hb-kit';
export declare class SomfyMyLinkPlatform extends PlatformBase<
  SomfyMyLinkTargetAccessory,
  SomfyMyLinkPlatformConfig
> {
  buildAccessories(): Promise<SomfyMyLinkTargetAccessory[]>;
  synergy: SomfySynergyPlatform;
  targets: Map<string, TargetConfig>;
  api: HB.API;
  config: SomfyMyLinkPlatformConfig;
  initialized: Promise<boolean>;
  client: SomfySynergy;
  constructor(log: HB.Logging, config: SomfyMyLinkPlatformConfig, api: HB.API);
}
//# sourceMappingURL=SomfyMyLinkPlatform.d.ts.map
