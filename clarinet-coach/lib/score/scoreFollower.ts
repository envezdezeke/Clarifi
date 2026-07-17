// lib/score/scoreFollower.ts
// Beat-clock based cursor advancement using Tone.js Transport.
// The cursor advances on every beat tick. It does NOT attempt dynamic time warping.
// A "re-sync" method allows snapping the cursor to the nearest matching measure.

import * as Tone from 'tone';
import type { ParsedScore } from '../types';
import { durationToBeats } from '../utils/noteUtils';

export type CursorPosition = { measure: number; beat: number };
export type CursorCallback = (cursor: CursorPosition) => void;
export type BeatCallback = (time: number, cursor: CursorPosition) => void;

export class ScoreFollower {
  private parsedScore: ParsedScore | null = null;
  private onCursorChange: CursorCallback | null = null;
  private onBeat: BeatCallback | null = null;
  private cursor: CursorPosition = { measure: 1, beat: 1 };
  private scheduledId: number | null = null;

  setScore(score: ParsedScore): void {
    this.parsedScore = score;
    this.reset();
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = Math.max(20, Math.min(300, bpm));
  }

  onCursorUpdate(cb: CursorCallback): void { this.onCursorChange = cb; }
  onBeatTick(cb: BeatCallback): void { this.onBeat = cb; }

  start(): void {
    if (!this.parsedScore) return;
    Tone.getContext().resume();
    const beatUnit = this.parsedScore.beatUnit;

    // Schedule a callback on every beat
    const noteValue = `${beatUnit}n` as Tone.Unit.Time;
    this.scheduledId = Tone.getTransport().scheduleRepeat((time) => {
      this.advanceCursor();
      this.onBeat?.(time, { ...this.cursor });
    }, noteValue);

    Tone.getTransport().start();
  }

  stop(): void {
    Tone.getTransport().stop();
    if (this.scheduledId !== null) {
      Tone.getTransport().clear(this.scheduledId);
      this.scheduledId = null;
    }
  }

  reset(): void {
    this.stop();
    this.cursor = { measure: 1, beat: 1 };
    this.onCursorChange?.(this.cursor);
  }

  getCurrentCursor(): CursorPosition {
    return { ...this.cursor };
  }

  /**
   * Returns the expected note (written pitch) at the current cursor position.
   * Returns null if cursor is on a rest or beyond the score.
   */
  getExpectedNote(): string | null {
    if (!this.parsedScore) return null;
    const measure = this.parsedScore.measures.find(m => m.number === this.cursor.measure);
    if (!measure) return null;

    // Find the event that covers the current beat
    let runningBeat = 1;
    for (const event of measure.events) {
      if (runningBeat >= this.cursor.beat) {
        return event.type === 'note' ? event.writtenPitch : null;
      }
      runningBeat += durationToBeats(event.duration, this.parsedScore.beatUnit);
    }
    return null;
  }

  private advanceCursor(): void {
    if (!this.parsedScore) return;
    const { beatsPerMeasure, measures } = this.parsedScore;
    const totalMeasures = measures.length;

    this.cursor.beat += 1;
    if (this.cursor.beat > beatsPerMeasure) {
      this.cursor.beat = 1;
      this.cursor.measure += 1;
      if (this.cursor.measure > totalMeasures) {
        this.stop();
        return;
      }
    }
    this.onCursorChange?.({ ...this.cursor });
  }
}
