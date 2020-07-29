import {Commands} from '@pmouli/somfy-synergy';
export interface TargetConfig {
  ID: string;
  name: string;
  type: number;
  timeToOpen?: number;
  orientation?:
    | {
        opened: Commands.Up;
        closed: Commands.Down;
      }
    | {
        opened: Commands.Down;
        closed: Commands.Up;
      };
}
