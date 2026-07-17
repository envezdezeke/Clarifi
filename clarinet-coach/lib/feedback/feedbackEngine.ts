// lib/feedback/feedbackEngine.ts
// Aggregates ComparisonEvents from a session into human-readable feedback.
// All logic here; no UI concerns.

import type { ComparisonEvent, PitchIssue, SessionFeedback, ToneIssue } from '../types';

// Throat tone range on Bb clarinet (written pitch) — notorious intonation trouble
const THROAT_TONE_NOTES = ['Bb3', 'B3', 'C4', 'C#4', 'Db4'];

export function generateFeedback(events: ComparisonEvent[]): SessionFeedback {
  const played = events.filter(e => e.detectedNote !== null && !e.isPickupMeasure);
  const missed = events.filter(e => e.detectedNote === null && !e.isPickupMeasure);
  const wrongNote = played.filter(e => e.detectedNote?.endsWith('*'));
  const correct = played.filter(e => !e.detectedNote?.endsWith('*'));

  // ── Pitch accuracy ────────────────────────────────────────────────────────
  const pitchAccuracy = events.length > 0
    ? Math.round((correct.length / events.length) * 100)
    : 100;

  // Per-note pitch deviation analysis
  const noteDeviations = new Map<string, number[]>();
  for (const e of correct) {
    if (e.centsDeviation !== null) {
      const key = e.expectedSoundingPitch;
      if (!noteDeviations.has(key)) noteDeviations.set(key, []);
      noteDeviations.get(key)!.push(e.centsDeviation);
    }
  }

  const pitchIssues: PitchIssue[] = [];
  for (const [note, deviations] of noteDeviations) {
    if (deviations.length < 2) continue;
    const avg = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    if (Math.abs(avg) > 10) {  // flag if avg deviation > 10 cents
      const measures = events
        .filter(e => e.expectedSoundingPitch === note && e.centsDeviation !== null)
        .map(e => e.measure);
      pitchIssues.push({
        note,
        avgCentsDeviation: Math.round(avg),
        direction: avg > 0 ? 'sharp' : 'flat',
        occurrences: deviations.length,
        measures: [...new Set(measures)],
      });
    }
  }
  // Sort by severity (most deviated first)
  pitchIssues.sort((a, b) => Math.abs(b.avgCentsDeviation) - Math.abs(a.avgCentsDeviation));

  // ── Timing accuracy ───────────────────────────────────────────────────────
  const timedEvents = played.filter(e => e.timing !== 'missed');
  const onTime = timedEvents.filter(e => e.timing === 'on-time').length;
  const timingAccuracy = timedEvents.length > 0
    ? Math.round((onTime / timedEvents.length) * 100)
    : 100;

  // ── Tone quality ──────────────────────────────────────────────────────────
  const toneScores = played.map(e => e.toneScore).filter(s => s > 0);
  const avgToneScore = toneScores.length > 0
    ? toneScores.reduce((a, b) => a + b, 0) / toneScores.length
    : 1;
  const toneQuality = Math.round(avgToneScore * 100);

  // ── Clarinet-specific tone issues ─────────────────────────────────────────
  const toneIssues: ToneIssue[] = [];

  // Throat tone detection
  const throatToneEvents = correct.filter(e => THROAT_TONE_NOTES.includes(e.expectedSoundingPitch));
  const weakThroatTones = throatToneEvents.filter(e => e.toneScore < 0.5);
  if (weakThroatTones.length >= 2) {
    toneIssues.push({
      type: 'throat-tone',
      description: `Tone quality drops on throat tones (Bb3–Db4). These notes require adjusted embouchure pressure.`,
      measures: [...new Set(weakThroatTones.map(e => e.measure))],
      severity: weakThroatTones.length > 4 ? 'significant' : 'moderate',
    });
  }

  // Air support (low stability)
  const unstableNotes = correct.filter(e => e.toneScore < 0.4);
  if (unstableNotes.length > correct.length * 0.3) {
    toneIssues.push({
      type: 'air',
      description: 'Inconsistent air support detected across multiple notes. Sustain steady airflow through the note.',
      measures: [...new Set(unstableNotes.map(e => e.measure))],
      severity: 'moderate',
    });
  }

  // High missed note rate
  if (missed.length > events.length * 0.2) {
    toneIssues.push({
      type: 'articulation',
      description: 'More than 20% of expected notes were not detected. Check tonguing clarity.',
      measures: [...new Set(missed.map(e => e.measure))],
      severity: missed.length > events.length * 0.4 ? 'significant' : 'minor',
    });
  }

  // ── Suggestions ───────────────────────────────────────────────────────────
  const suggestions: string[] = [];

  if (pitchIssues.length > 0) {
    const worst = pitchIssues[0];
    suggestions.push(
      `Focus on ${worst.note}: averaging ${Math.abs(worst.avgCentsDeviation)} cents ${worst.direction}. ` +
      `Try tuning drones on this pitch before your next session.`
    );
  }
  if (timingAccuracy < 70) {
    suggestions.push(`Practice measures with a metronome at 50–60% of session tempo. Timing accuracy was ${timingAccuracy}%.`);
  }
  for (const issue of toneIssues) {
    suggestions.push(issue.description);
  }
  if (suggestions.length === 0) {
    suggestions.push('Strong session. Consider increasing tempo or working on dynamic contrast.');
  }

  const overallScore = Math.round(
    pitchAccuracy * 0.4 + timingAccuracy * 0.3 + toneQuality * 0.3
  );

  // suppress unused variable warning
  void wrongNote;

  return {
    overallScore,
    pitchAccuracy,
    timingAccuracy,
    toneQuality,
    pitchIssues: pitchIssues.slice(0, 5),  // top 5 only
    toneIssues,
    suggestions,
    notesPlayed: played.length,
    notesMissed: missed.length,
    measuresAnalyzed: new Set(events.map(e => e.measure)).size,
  };
}
