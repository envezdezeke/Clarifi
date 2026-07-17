'use client';

// hooks/useScoreFollower.ts

import { useEffect, useRef, useCallback } from 'react';
import { ScoreFollower } from '../lib/score/scoreFollower';
import { usePracticeStore } from '../store/practiceStore';

export function useScoreFollower() {
  const followerRef = useRef<ScoreFollower>(new ScoreFollower());
  const store = usePracticeStore();

  useEffect(() => {
    const follower = followerRef.current;

    follower.onCursorUpdate((cursor) => {
      usePracticeStore.getState().setCursor(cursor.measure, cursor.beat);
    });

    // When parsedScore or effectiveBpm changes, update the follower
    if (store.parsedScore) {
      follower.setScore(store.parsedScore);
    }
    follower.setBpm(store.effectiveBpm);
  }, [store.parsedScore, store.effectiveBpm]);

  const start = useCallback(() => {
    followerRef.current.start();
    usePracticeStore.getState().setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    followerRef.current.stop();
    usePracticeStore.getState().setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    followerRef.current.reset();
    usePracticeStore.getState().setIsPlaying(false);
  }, []);

  const getExpectedNote = useCallback(() => {
    return followerRef.current.getExpectedNote();
  }, []);

  useEffect(() => () => followerRef.current.stop(), []);

  return {
    start,
    stop,
    reset,
    getExpectedNote,
    cursor: store.cursor,
    isPlaying: store.isPlaying,
  };
}
