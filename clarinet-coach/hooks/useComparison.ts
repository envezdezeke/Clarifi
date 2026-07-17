'use client';

// hooks/useComparison.ts

import { useRef, useCallback } from 'react';
import { ComparisonEngine } from '../lib/score/comparisonEngine';
import { generateFeedback } from '../lib/feedback/feedbackEngine';
import { usePracticeStore } from '../store/practiceStore';
import type { SessionFeedback } from '../lib/types';

export function useComparison() {
  const engineRef = useRef<ComparisonEngine>(new ComparisonEngine());
  const store = usePracticeStore();

  // Sync transposition setting
  engineRef.current.setTransposition(store.useTransposition);
  if (store.parsedScore) engineRef.current.setScore(store.parsedScore);

  /**
   * Call this from onset handler when you want to log a comparison event.
   */
  const compareAtOnset = useCallback((beatTimeDelta: number) => {
    const { cursor, parsedScore, pitchReading, toneMetrics, useTransposition } = usePracticeStore.getState();
    if (!parsedScore || !pitchReading || !toneMetrics) return;

    const engine = engineRef.current;
    engine.setTransposition(useTransposition);
    engine.setScore(parsedScore);

    const expectedNote = parsedScore.measures
      .find(m => m.number === cursor.measure)
      ?.events.find(e => e.type === 'note' && e.beat === cursor.beat);

    const writtenPitch = expectedNote?.type === 'note' ? expectedNote.writtenPitch : null;

    const event = engine.compare({
      measure: cursor.measure,
      beat: cursor.beat,
      expectedWrittenPitch: writtenPitch,
      pitchReading,
      toneMetrics,
      beatTimeDelta,
    });

    if (event) usePracticeStore.getState().logEvent(event);
  }, []);

  const getFeedback = useCallback((): SessionFeedback => {
    return generateFeedback(store.eventLog);
  }, [store.eventLog]);

  return {
    compareAtOnset,
    getFeedback,
    eventLog: store.eventLog,
  };
}
