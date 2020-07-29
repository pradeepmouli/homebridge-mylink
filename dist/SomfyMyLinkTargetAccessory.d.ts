import * as HB from 'homebridge';
import { SomfySynergyPlatform, Target, Commands } from '@pmouli/somfy-synergy';
import { Direction } from './Commands';
import { SomfyMyLinkPlatform } from './SomfyMyLinkPlatform';
import { AccessoryBase } from 'hb-kit';
import { TargetConfig } from './TargetConfig';
export declare class SomfyMyLinkTargetAccessory extends AccessoryBase<HB.Categories.WINDOW_COVERING> {
    pendingTargetValue: number;
    queue: number[];
    target: Target & TargetConfig;
    synergy: SomfySynergyPlatform;
    name: string;
    requests: number[];
    direction: Direction;
    services: HB.Service[];
    primaryService: HB.Service;
    category: HB.Categories.WINDOW_COVERING;
    isProcessing: boolean;
    constructor(platform: SomfyMyLinkPlatform, target: Target & TargetConfig);
    getServices(): HB.Service[];
    handleCommandTriggered(commands: Commands): void;
    setHoldPosition(targetValue: number, callback: (arg0?: any) => void): void;
    scheduleRequest(targetPosition: number): Promise<void>;
    configure(accessory?: HB.PlatformAccessory): HB.PlatformAccessory;
    processRequests(lastPosition: number): Promise<void>;
    setPosition(targetValue: number): Promise<number>;
    buildServices(): void;
}
//# sourceMappingURL=SomfyMyLinkTargetAccessory.d.ts.map