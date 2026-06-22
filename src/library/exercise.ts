import type {
  CardioIntensity,
  Equipment,
  Impact,
  Loads,
  MovementPattern,
  Position,
  Trains,
} from './tags';

/**
 * A single exercise in the tagged library. Every classification is a typed tag
 * dimension; the engine treats exercises as opaque data referenced by `id`.
 */
export interface Exercise {
  id: string;
  name: string;

  /** What it trains (primary/secondary movers). */
  trains: Trains;
  /** What it loads (joints, grip, load type) — drives exclusion filtering. */
  loads: Loads;

  equipment: Equipment[];
  impact: Impact;
  position: Position;
  movementPattern: MovementPattern;
  cardioIntensity: CardioIntensity;

  /** Metabolic equivalent, used for calorie estimation. */
  met: number;

  /** Identifier of the avatar animation clip to play on the TV. */
  clip: string;
}
