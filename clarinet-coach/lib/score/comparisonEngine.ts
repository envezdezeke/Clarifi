// lib/score/comparisonEngine.ts
// Compares detected pitch to expected note at each onset event.
// Handles Bb transposition and enharmonic equivalence.

import type { ComparisonEvent, ParsedScore, PitchReading, ToneMetrics } from '../types';
import { writtenToSounding, isEnharmonic } from '../utils/noteUtils';

// Timing tolerance in milliseconds around expected beat
const TIMING_WINDOW_MS = 200;

export class ComparisonEngine {
  private parsedScore: ParsedScore | null = null;
  private useTransposition = true;

  setScore(score: ParsedScore): void { this.parsedScore = score; }
  setTransposition(enabled: boolean): void { this.useTransposition = enabled; }

  /**
   * Call this when an onset is detected.
   * @param onsetTime - AudioContext.currentTime of the onset
   * @param expectedBeat - beat clock time the onset occurred at (from ScoreFollower)
   * @param measure / beat - cursor position from ScoreFollower
   * @param pitchReading - latest pitch reading (snapshot at onset time)
   * @param toneMetrics - snapshot of tone at onset time
   */
  compare(params: {
    measure: number;
    beat: number;
    expectedWrittenPitch: string | null;
    pitchReading: PitchReading;
    toneMetrics: ToneMetrics;
    beatTimeDelta: number;  // ms between onset and nearest beat tick
  }): ComparisonEvent | null {
    const { measure, beat, expectedWrittenPitch, pitchReading, toneMetrics, beatTimeDelta } = params;

    if (!expectedWrittenPitch) return null;  // rest in score, skip

    const expectedSoundingPitch = this.useTransposition
      ? writtenToSounding(expectedWrittenPitch)
      : expectedWrittenPitch;

    const isPickupMeasure = this.parsedScore
      ? this.parsedScore.measures[0]?.events.length < this.parsedScore.beatsPerMeasure
      : false;

    const detectedNote = pitchReading.isValid ? pitchReading.note : null;

    // Determine timing result
    let timing: ComparisonEvent['timing'] = 'missed';
    if (detectedNote) {
      if (Math.abs(beatTimeDelta) <= TIMING_WINDOW_MS * 0.5) timing = 'on-time';
      else if (beatTimeDelta < 0) timing = 'early';
      else timing = 'late';
    }

    // Check pitch correctness using enharmonic equivalence
    const pitchCorrect = detectedNote ? isEnharmonic(detectedNote, expectedSoundingPitch) : false;
    const centsDeviation = pitchReading.isValid ? pitchReading.cents : null;

    // Tone score: composite of stability, noisiness (inverted), harmonic ratio (capped at 5)
    const toneScore = detectedNote
      ? Math.min(1, (
          toneMetrics.stability * 0.4 +
          (1 - toneMetrics.noisiness) * 0.4 +
          Math.min(toneMetrics.harmonicRatio / 5, 1) * 0.2
        ))
      : 0;

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      measure,
      beat,
      expectedWrittenPitch,
      expectedSoundingPitch,
      detectedNote: pitchCorrect ? detectedNote : (detectedNote ? `${detectedNote}*` : null),
      centsDeviation,
      timing: detectedNote && !pitchCorrect ? 'missed' : timing,
      toneScore,
      isPickupMeasure,
    };
  }
}
