// lib/utils/noteUtils.ts
// All pitch math. No side effects. Fully tested.

const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A4 = 440 Hz, MIDI note 69
const A4_HZ = 440;
const A4_MIDI = 69;

/** Convert frequency to MIDI note number (floating point for microtonal precision) */
export function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / A4_HZ) + A4_MIDI;
}

/** Round MIDI float to nearest integer note, return note name + octave */
export function midiToNoteName(midi: number, preferFlats = true): string {
  const rounded = Math.round(midi);
  const octave = Math.floor((rounded - 12) / 12);  // C0 = MIDI 12
  const semitone = ((rounded % 12) + 12) % 12;
  const name = preferFlats ? NOTE_NAMES_FLAT[semitone] : NOTE_NAMES_SHARP[semitone];
  return `${name}${octave}`;
}

/** Cents deviation from nearest equal-temperament pitch (-50 to +50) */
export function centDeviation(hz: number): number {
  const midi = hzToMidi(hz);
  const rounded = Math.round(midi);
  return (midi - rounded) * 100;
}

/** Full pitch reading from raw Hz */
export function hzToPitchReading(hz: number): import('../types').PitchReading {
  if (!hz || hz < 30 || hz > 5000) {
    return { hz: 0, note: '', cents: 0, isValid: false };
  }
  const midi = hzToMidi(hz);
  const note = midiToNoteName(midi, true);
  const cents = centDeviation(hz);
  return { hz, note, cents, isValid: true };
}

/** Reference frequency for a written note name (A4 = 440, equal temperament) */
export function noteNameToHz(noteName: string): number {
  const match = noteName.match(/^([A-G][#b]?)(-?\d)$/);
  if (!match) throw new Error(`Invalid note name: ${noteName}`);
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const semitone = NOTE_NAMES_FLAT.indexOf(name) !== -1
    ? NOTE_NAMES_FLAT.indexOf(name)
    : NOTE_NAMES_SHARP.indexOf(name);
  if (semitone === -1) throw new Error(`Unknown note name: ${name}`);
  const midi = semitone + 12 + (octave * 12);
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Bb clarinet written-to-sounding transposition.
 * Written pitch sounds a major second (2 semitones) lower.
 * "D4" written → "C4" sounding
 * "C4" written → "Bb3" sounding
 */
export function writtenToSounding(writtenPitch: string): string {
  const match = writtenPitch.match(/^([A-G][#b]?)(-?\d)$/);
  if (!match) return writtenPitch;
  const [, name, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const writtenSemitone = NOTE_NAMES_FLAT.indexOf(name) !== -1
    ? NOTE_NAMES_FLAT.indexOf(name)
    : NOTE_NAMES_SHARP.indexOf(name);
  if (writtenSemitone === -1) return writtenPitch;

  let soundingSemitone = writtenSemitone - 2;
  let soundingOctave = octave;
  if (soundingSemitone < 0) {
    soundingSemitone += 12;
    soundingOctave -= 1;
  }
  return `${NOTE_NAMES_FLAT[soundingSemitone]}${soundingOctave}`;
}

/** Are two note names enharmonically equivalent? (F# === Gb) */
export function isEnharmonic(a: string, b: string): boolean {
  try {
    return Math.abs(noteNameToHz(a) - noteNameToHz(b)) < 0.01;
  } catch {
    return false;
  }
}

/** Duration in beats given a NoteDuration string and the beat unit (4 = quarter) */
export function durationToBeats(duration: string, beatUnit = 4): number {
  const map: Record<string, number> = {
    'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25,
    'thirty-second': 0.125,
    'dotted-half': 3, 'dotted-quarter': 1.5, 'dotted-eighth': 0.75,
  };
  const beats = map[duration] ?? 1;
  // Adjust if beat unit is not quarter note (e.g. 6/8 where eighth gets the beat)
  return beats * (4 / beatUnit);
}
