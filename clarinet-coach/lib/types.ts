// lib/types.ts

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface ToneMetrics {
  brightness: number;          // spectral centroid normalized 0–1
  noisiness: number;           // spectral flatness 0–1 (0 = pure tone, 1 = noise)
  harmonicRatio: number;       // odd/even harmonic energy ratio (clarinet-specific, target > 3)
  stability: number;           // RMS variance over 500ms window, lower = more stable
  dynamicsDb: number;          // current RMS in dB
}

export interface PitchReading {
  hz: number;
  note: string;                // e.g. "C4", "Bb3"
  cents: number;               // deviation from nearest equal temperament pitch, -50 to +50
  isValid: boolean;            // false if confidence below threshold
}

export interface OnsetEvent {
  time: number;                // AudioContext.currentTime at onset
  beat: number | null;         // nearest beat if score is loaded
  measure: number | null;
}

// ─── Score ───────────────────────────────────────────────────────────────────

export type NoteDuration =
  | 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
  | 'dotted-half' | 'dotted-quarter' | 'dotted-eighth'
  | 'thirty-second';

export type ScoreEvent =
  | { type: 'note'; beat: number; writtenPitch: string; duration: NoteDuration }
  | { type: 'rest'; beat: number; duration: NoteDuration };

export interface Measure {
  number: number;
  events: ScoreEvent[];
}

export interface ParsedScore {
  keySignature: string;           // e.g. "Bb major"
  timeSignature: string;          // e.g. "4/4"
  beatsPerMeasure: number;        // numerator of time signature
  beatUnit: number;               // denominator (4 = quarter note gets the beat)
  tempoExtracted: number | null;  // numeric BPM from score, null if only verbal
  tempoMarking: string | null;    // e.g. "Allegro" or "♩ = 112"
  measures: Measure[];
  pageCount: number;
  parseWarnings: string[];        // non-fatal issues Claude flagged
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export type TimingResult = 'on-time' | 'early' | 'late' | 'missed';

export interface ComparisonEvent {
  id: string;
  timestamp: number;
  measure: number;
  beat: number;
  expectedWrittenPitch: string;
  expectedSoundingPitch: string;  // after Bb transposition
  detectedNote: string | null;    // null = missed
  centsDeviation: number | null;
  timing: TimingResult;
  toneScore: number;              // 0–1 snapshot of tone quality at this event
  isPickupMeasure: boolean;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface PitchIssue {
  note: string;
  avgCentsDeviation: number;
  direction: 'sharp' | 'flat';
  occurrences: number;
  measures: number[];
}

export interface ToneIssue {
  type: 'squeak' | 'air' | 'embouchure' | 'throat-tone' | 'articulation';
  description: string;
  measures: number[];
  severity: 'minor' | 'moderate' | 'significant';
}

export interface SessionFeedback {
  overallScore: number;           // 0–100
  pitchAccuracy: number;          // 0–100
  timingAccuracy: number;         // 0–100
  toneQuality: number;            // 0–100
  pitchIssues: PitchIssue[];
  toneIssues: ToneIssue[];
  suggestions: string[];          // ordered by priority
  notesPlayed: number;
  notesMissed: number;
  measuresAnalyzed: number;
}

// ─── Session (Supabase) ───────────────────────────────────────────────────────

export interface PracticeSession {
  id: string;
  userId: string;
  createdAt: string;
  durationSeconds: number;
  scoreTitle: string | null;      // filename of uploaded PDF
  effectiveBpm: number;
  feedback: SessionFeedback;
  eventLog: ComparisonEvent[];
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export interface PracticeState {
  // audio (live — update via refs, flush to state at 60ms intervals)
  pitchReading: PitchReading | null;
  toneMetrics: ToneMetrics | null;
  onsetHistory: OnsetEvent[];

  // score
  parsedScore: ParsedScore | null;
  scoreFilename: string | null;
  bpmOverride: number | null;
  effectiveBpm: number;           // computed: bpmOverride ?? tempoExtracted ?? 80
  useTransposition: boolean;      // true = PDF is written Bb clarinet pitch

  // playback cursor
  cursor: { measure: number; beat: number };
  isPlaying: boolean;

  // session
  eventLog: ComparisonEvent[];
  sessionStartTime: number | null;
  isParsing: boolean;
  parseError: string | null;

  // actions
  setParsedScore: (score: ParsedScore, filename: string) => void;
  setBpmOverride: (bpm: number | null) => void;
  setTransposition: (enabled: boolean) => void;
  setCursor: (measure: number, beat: number) => void;
  setIsPlaying: (playing: boolean) => void;
  logEvent: (event: ComparisonEvent) => void;
  clearSession: () => void;
  setIsParsing: (parsing: boolean) => void;
  setParseError: (error: string | null) => void;
}

// ─── Fingering DB ─────────────────────────────────────────────────────────────

export interface Fingering {
  id: string;                     // "standard" | "alt1" | "alt2"
  label: string;
  keys: string[];                 // array of key IDs that must be covered
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface FingeringEntry {
  note: string;                   // written pitch, e.g. "C4"
  frequency: number;              // sounding Hz at A4=440
  octave: number;
  fingerings: Fingering[];
}
