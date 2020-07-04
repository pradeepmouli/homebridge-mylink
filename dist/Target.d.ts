import {Commands} from './Commands';
export interface Target {
  ID: string;
  name: string;
  type: number;
  timeToOpen?: number;
  orientation?: {
    opened: Commands;
    closed: Commands;
    middle: Commands;
  };
}
//# sourceMappingURL=Target.d.ts.map
