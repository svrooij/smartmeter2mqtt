import { SunspecResult } from '@svrooij/sunspec/lib/sunspec-result';
import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import SolarInput from './solar-input';

interface TypedP1SolarEvents {

  /** Receive solar information */
  solar: (reading: Partial<SunspecResult>) => void;
}

export default abstract class BaseSolarReader extends (EventEmitter as new () => TypedEmitter<TypedP1SolarEvents>) implements SolarInput {
  abstract getCurrentProduction(): Promise<number | undefined>;

  abstract getSolarData(): Promise<Partial<SunspecResult> | undefined>;

  abstract close(): void;
}
