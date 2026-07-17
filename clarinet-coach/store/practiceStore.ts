// store/practiceStore.ts
// Single shared store for all session state.
// Audio values (pitchReading, toneMetrics) are updated via refs in hooks,
// then flushed here at 60ms intervals — never on every audio frame.

import { create } from 'zustand';
import type { PracticeState, ComparisonEvent, ParsedScore } from '../lib/types';

const DEFAULT_BPM = 80;

export const usePracticeStore = create<PracticeState>((set, get) => ({
  pitchReading: null,
  toneMetrics: null,
  onsetHistory: [],

  parsedScore: null,
  scoreFilename: null,
  bpmOverride: null,
  effectiveBpm: DEFAULT_BPM,
  useTransposition: true,

  cursor: { measure: 1, beat: 1 },
  isPlaying: false,

  eventLog: [],
  sessionStartTime: null,
  isParsing: false,
  parseError: null,

  setParsedScore: (score: ParsedScore, filename: string) => {
    const extracted = score.tempoExtracted ?? DEFAULT_BPM;
    const override = get().bpmOverride;
    set({
      parsedScore: score,
      scoreFilename: filename,
      effectiveBpm: override ?? extracted,
      cursor: { measure: 1, beat: 1 },
      eventLog: [],
      parseError: null,
    });
  },

  setBpmOverride: (bpm: number | null) => {
    const score = get().parsedScore;
    const extracted = score?.tempoExtracted ?? DEFAULT_BPM;
    set({ bpmOverride: bpm, effectiveBpm: bpm ?? extracted });
  },

  setTransposition: (enabled: boolean) => set({ useTransposition: enabled }),

  setCursor: (measure: number, beat: number) => set({ cursor: { measure, beat } }),

  setIsPlaying: (playing: boolean) => set({
    isPlaying: playing,
    sessionStartTime: playing ? (get().sessionStartTime ?? Date.now()) : get().sessionStartTime,
  }),

  logEvent: (event: ComparisonEvent) => set(state => ({
    eventLog: [...state.eventLog.slice(-200), event],  // keep last 200 events
  })),

  clearSession: () => set({
    pitchReading: null,
    toneMetrics: null,
    onsetHistory: [],
    cursor: { measure: 1, beat: 1 },
    isPlaying: false,
    eventLog: [],
    sessionStartTime: null,
    parseError: null,
  }),

  setIsParsing: (parsing: boolean) => set({ isParsing: parsing }),
  setParseError: (error: string | null) => set({ parseError: error }),
}));
