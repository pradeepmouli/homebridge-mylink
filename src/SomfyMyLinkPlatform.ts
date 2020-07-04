import * as HB from 'homebridge';
import SomfySynergy from '@pmouli/somfy-synergy';
import {SomfySynergyPlatform, Target} from '@pmouli/somfy-synergy';
import {TargetConfig} from './TargetConfig';
import {SomfyMyLinkPlatformConfig} from './SomfyMyLinkPlatformConfig';
import {SomfyMyLinkTargetAccessory} from './SomfyMyLinkTargetAccessory';
import {PlatformBase, AccessoryBase} from 'hb-kit';
export class SomfyMyLinkPlatform extends PlatformBase<
  SomfyMyLinkTargetAccessory,
  SomfyMyLinkPlatformConfig
> {
  async buildAccessories(): Promise<SomfyMyLinkTargetAccessory[]> {
    try {
      this.pluginName = 'homebridge-mylink';

      this.client = new SomfySynergy(
        this.config.systemID,
        PlatformBase.cloneLogger(
          this.logger,
          'somfy-synergy-api',
          HB.LogLevel.DEBUG,
        ),
        this.config.poolOptions?.usePool ?? true,
        this.config.host,
        44100,
        this.config.connectionOptions?.allowHalfOpen ?? true,
        this.config.connectionOptions?.timeout ?? 3000,
      );

      this.synergy = new SomfySynergy.Platform(
        this.client,
        this.config.compositeTargets ?? [],
      );
      this.targets = new Map();
      this.config.targets.forEach(p => this.targets.set(p.ID, p));

      await this.synergy.initialize();
    } catch (error) {
      this.logger.error(error);

      //await this.synergy.initialize();
    }
    //await this.initialized;
    let list = new Array<SomfyMyLinkTargetAccessory>();
    if (this.synergy.targets?.size > 0) {
      this.synergy.targets.forEach((target: Target) => {
        let t = this.targets.get(target.ID);
        if (t) {
          // target.name = t.name;
          target.timeToOpen = t.timeToOpen ?? 30;
          target.orientation = t.orientation;
        }
        list.push(new SomfyMyLinkTargetAccessory(this, target));
      });
    } /*communication issues*/ else {
      this.targets.forEach((t: TargetConfig) => {
        let target = new Target(this.synergy.client, {
          targetID: t.ID,
          name: t.name,
          type: 0,
        });

        if (t) {
          // target.name = t.name;
          target.timeToOpen = t.timeToOpen ?? 30;
          target.orientation = t.orientation;
        }
        list.push(new SomfyMyLinkTargetAccessory(this, target));
      });
    }

    return list;
  }
  synergy: SomfySynergyPlatform;

  targets: Map<string, TargetConfig>;
  api: HB.API;
  config: SomfyMyLinkPlatformConfig;
  initialized: Promise<boolean>;
  client: SomfySynergy;
  constructor(log: HB.Logging, config: SomfyMyLinkPlatformConfig, api: HB.API) {
    config.platform = 'Somfy myLink';

    super(log, config, api);
  }
}
