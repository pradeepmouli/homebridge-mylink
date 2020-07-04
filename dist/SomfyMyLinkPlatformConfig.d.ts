/// <reference types="node" />
import {TargetConfig} from './TargetConfig';
import {TcpNetConnectOpts} from 'net';
export interface SomfyMyLinkPlatformConfig {
  platform: string;
  name: string;
  host: string;
  systemID: string;
  connectionOptions: TcpNetConnectOpts;
  poolOptions: {
    usePool: boolean;
    max: number;
    min: number;
  };
  commandDelay: number;
  targets: TargetConfig[];
  compositeTargets: string[][];
}
//# sourceMappingURL=SomfyMyLinkPlatformConfig.d.ts.map
