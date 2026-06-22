import type { Workout } from './workout';
import type { BlockMode } from './workout';
import type { CompletedBlock, SessionResult } from './session';
import { flattenWorkout } from './timeline';
import type { Phase, RestReason, WorkPhase } from './timeline';

// Framework-agnostic interval/circuit engine. It is a pure, tick-driven state
// machine: the host advances time by calling `tick(deltaSeconds)` (or lets the
// engine self-drive via `tickIntervalMs`), and subscribes to state changes. No
// DOM, timers-by-default, or library imports — exercises are referenced by id.

export type EngineStatus = 'idle' | 'running' | 'paused' | 'completed';
export type EnginePhase = 'work' | 'rest';

export interface UpNext {
  exerciseId: string;
  round: number;
  rounds: number;
}

/** Immutable snapshot emitted to subscribers on every change. */
export interface EngineState {
  status: EngineStatus;
  /** Current phase kind, or null when idle/completed. */
  phase: EnginePhase | null;
  /** Current exercise during work; null during rest/idle/completed. */
  exerciseId: string | null;
  mode: BlockMode | null;
  /** Rep target for a reps work phase; null otherwise. */
  repsTarget: number | null;
  circuitName: string | null;
  /** Current round (1-based). During rest, the round you're about to start. */
  round: number;
  /** Total rounds for the current/upcoming circuit. */
  rounds: number;
  /** Seconds left in the current phase; null while a reps block waits for `done`. */
  remaining: number | null;
  /** Total seconds of the current phase; null for a reps block. */
  duration: number | null;
  /** Why we're resting, when `phase === 'rest'`. */
  restReason: RestReason | null;
  /** The next exercise coming up, or null if none remain. */
  upNext: UpNext | null;
  /** Index of the current phase (0-based); -1 when idle. */
  index: number;
  /** Total number of phases in the workout. */
  total: number;
}

export type Listener = (state: EngineState) => void;

export interface EngineOptions {
  /**
   * If set (> 0) and a global timer is available, the engine self-drives: on
   * start/resume it ticks itself every `tickIntervalMs` ms. Leave unset for
   * deterministic, test-driven ticking via `tick()`.
   */
  tickIntervalMs?: number;
}

const EPS = 1e-9;

export class WorkoutEngine {
  private readonly phases: Phase[];
  private readonly listeners = new Set<Listener>();
  private readonly tickIntervalMs: number;

  private status: EngineStatus = 'idle';
  private index = -1;
  private remaining: number | null = null;
  private duration: number | null = null;
  private elapsed = 0;
  private completed: CompletedBlock[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly workout: Workout,
    options: EngineOptions = {},
  ) {
    this.phases = flattenWorkout(workout);
    this.tickIntervalMs = options.tickIntervalMs ?? 0;
  }

  // --- Controls -----------------------------------------------------------

  /** Begin (or restart) the workout from the first phase. */
  start(): void {
    this.index = 0;
    this.elapsed = 0;
    this.completed = [];
    if (this.phases.length === 0) {
      this.finish();
      return;
    }
    this.status = 'running';
    this.enterPhase();
    this.startTicker();
    this.emit();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.stopTicker();
    this.emit();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.startTicker();
    this.emit();
  }

  /** Skip the current phase without recording it as completed. */
  skip(): void {
    if (this.status !== 'running' && this.status !== 'paused') return;
    this.advance();
    this.emit();
  }

  /** Mark the current work phase done (records it) and advance. */
  done(): void {
    if (this.status !== 'running' && this.status !== 'paused') return;
    const phase = this.currentPhase();
    if (!phase || phase.type !== 'work') return;
    this.record(phase);
    this.advance();
    this.emit();
  }

  /** Go back to the previous work phase, or restart the current one. */
  back(): void {
    if (this.phases.length === 0) return;
    if (this.status === 'completed') this.status = 'running';
    if (this.index < 0) this.index = 0;

    let i = this.index - 1;
    while (i >= 0 && this.phases[i].type !== 'work') i--;
    this.index = i >= 0 ? i : Math.max(0, this.findCurrentOrNextWork());
    this.enterPhase();
    this.startTicker();
    this.emit();
  }

  /** Add seconds to the current timed phase (no-op while a reps block waits). */
  addTime(seconds: number): void {
    if (this.remaining == null) return;
    this.remaining += seconds;
    if (this.duration != null) this.duration += seconds;
    this.emit();
  }

  /** End the workout immediately. */
  end(): void {
    this.finish();
  }

  // --- Time ---------------------------------------------------------------

  /**
   * Advance time by `deltaSeconds`. Overflow carries into subsequent timed
   * phases; a reps work phase halts consumption until `done()` is called.
   */
  tick(deltaSeconds: number): void {
    if (this.status !== 'running') return;
    let dt = deltaSeconds;
    while (dt > EPS && this.index < this.phases.length) {
      if (this.remaining == null) break; // reps block waits for done()
      const consume = Math.min(dt, this.remaining);
      this.remaining -= consume;
      this.elapsed += consume;
      dt -= consume;
      if (this.remaining <= EPS) {
        const phase = this.currentPhase();
        if (phase && phase.type === 'work') this.record(phase);
        this.advance();
        if ((this.status as EngineStatus) === 'completed') break;
      }
    }
    this.emit();
  }

  // --- Subscription -------------------------------------------------------

  /** Subscribe to state changes. Fires immediately with the current state. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): EngineState {
    const phase = this.currentPhase();
    const base: EngineState = {
      status: this.status,
      phase: null,
      exerciseId: null,
      mode: null,
      repsTarget: null,
      circuitName: null,
      round: 0,
      rounds: 0,
      remaining: null,
      duration: null,
      restReason: null,
      upNext: this.upNextFrom(this.index),
      index: this.status === 'idle' ? -1 : this.index,
      total: this.phases.length,
    };

    if (!phase || this.status === 'idle' || this.status === 'completed') {
      return { ...base, upNext: null };
    }

    if (phase.type === 'work') {
      return {
        ...base,
        phase: 'work',
        exerciseId: phase.exerciseId,
        mode: phase.mode,
        repsTarget: phase.repsTarget,
        circuitName: phase.circuitName,
        round: phase.round,
        rounds: phase.rounds,
        remaining: this.remaining,
        duration: this.duration,
      };
    }

    // rest: round/up-next describe the work we're resting before.
    const upcoming = this.nextWork(this.index);
    return {
      ...base,
      phase: 'rest',
      circuitName: upcoming?.circuitName ?? null,
      round: upcoming?.round ?? 0,
      rounds: upcoming?.rounds ?? 0,
      remaining: this.remaining,
      duration: this.duration,
      restReason: phase.reason,
    };
  }

  /** A SessionResult summarising what was completed. */
  getResult(): SessionResult {
    return {
      workoutId: this.workout.id,
      completedBlocks: [...this.completed],
      durationSeconds: Math.round(this.elapsed),
      estimatedCalories: 0, // filled in by a profile-aware layer (has MET data)
      timestamp: Date.now(),
    };
  }

  // --- Internals ----------------------------------------------------------

  private currentPhase(): Phase | null {
    return this.index >= 0 && this.index < this.phases.length
      ? this.phases[this.index]
      : null;
  }

  private enterPhase(): void {
    const phase = this.currentPhase();
    if (!phase) {
      this.remaining = null;
      this.duration = null;
      return;
    }
    if (phase.type === 'rest') {
      this.remaining = phase.duration;
      this.duration = phase.duration;
    } else {
      this.remaining = phase.duration; // null for reps -> waits for done()
      this.duration = phase.duration;
    }
  }

  private advance(): void {
    this.index += 1;
    if (this.index >= this.phases.length) {
      this.finish();
      return;
    }
    this.enterPhase();
  }

  private finish(): void {
    this.status = 'completed';
    this.index = this.phases.length;
    this.remaining = null;
    this.duration = null;
    this.stopTicker();
    this.emit();
  }

  private record(phase: WorkPhase): void {
    this.completed.push({
      exerciseId: phase.exerciseId,
      mode: phase.mode,
      value: phase.mode === 'timed' ? phase.duration ?? 0 : phase.repsTarget ?? 0,
      round: phase.round,
    });
  }

  private nextWork(fromIndex: number): WorkPhase | null {
    for (let i = fromIndex + 1; i < this.phases.length; i++) {
      const p = this.phases[i];
      if (p.type === 'work') return p;
    }
    return null;
  }

  private findCurrentOrNextWork(): number {
    for (let i = this.index; i < this.phases.length; i++) {
      if (this.phases[i].type === 'work') return i;
    }
    return this.index;
  }

  private upNextFrom(fromIndex: number): UpNext | null {
    const w = this.nextWork(fromIndex);
    return w ? { exerciseId: w.exerciseId, round: w.round, rounds: w.rounds } : null;
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  private startTicker(): void {
    if (this.tickIntervalMs <= 0 || this.status !== 'running') return;
    if (typeof setInterval !== 'function' || this.timer != null) return;
    this.timer = setInterval(
      () => this.tick(this.tickIntervalMs / 1000),
      this.tickIntervalMs,
    );
  }

  private stopTicker(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
