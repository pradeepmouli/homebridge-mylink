import {TargetConfig} from './TargetConfig';
import {TcpNetConnectOpts} from 'net';
import {SocketOptions}  from 'dgram';


export interface SomfyMyLinkPlatformConfig {
  platform: string;

  name: string;
  host: string;
  systemID: string;



  connectionOptions: Partial<TcpNetConnectOpts> & Partial<SocketOptions> ;

  poolOptions: {usePool: boolean; max: number; min: number};

  commandDelay: number;
  targets: TargetConfig[];
  compositeTargets: string[][];
}
