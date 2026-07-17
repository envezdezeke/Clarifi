'use client';

// hooks/useAudioEngine.ts
// Manages PitchDetector, FFTAnalyzer, OnsetDetector lifecycle.
// Returns live readings from Zustand (flushed at 60ms intervals).

import { useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from '../lib/audio/pitchDetector';
import { FFTAnalyzer } from '../lib/audio/fftAnalyzer';
import { OnsetDetector } from '../lib/audio/onsetDetector';
import { getMicStream } from '../lib/utils/permissions';
import { usePracticeStore } from '../store/practiceStore';
import type { PitchReading, ToneMetrics, OnsetEvent } from '../lib/types';

export function useAudioEngine() {
  const detectorRef = useRef<PitchDetector>(new PitchDetector());
  const fftRef = useRef<FFTAnalyzer>(new FFTAnalyzer());
  const onsetRef = useRef<OnsetDetector>(new OnsetDetector());
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onsetPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const store = usePracticeStore();

  const start = useCallback(async () => {
    const stream = await getMicStream();
    if (!stream) {
      console.error('Microphone access denied');
      return;
    }

    await detectorRef.current.start(stream);
    const ctx = detectorRef.current.getAudioContext();
    if (!ctx) return;

    // Get the source node from the pitch detector's internal graph
    // Both FFT and onset tap the same source
    // NOTE: Attach after PitchDetector.start() so AudioContext exists
    // The source is the mic stream; re-create it for FFT/onset
    const fftSource = ctx.createMediaStreamSource(stream);
    fftRef.current.attach(ctx, fftSource);
    onsetRef.current.attach(ctx, fftSource);

    onsetRef.current.onOnset = (event: OnsetEvent) => {
      usePracticeStore.setState(s => ({
        onsetHistory: [...s.onsetHistory.slice(-50), event],
      }));
    };

    // Flush audio readings to Zustand at 60ms (not every audio frame)
    flushIntervalRef.current = setInterval(() => {
      const reading: PitchReading = detectorRef.current.latestReading;
      const metrics: ToneMetrics = fftRef.current.analyze(reading.hz);
      usePracticeStore.setState({ pitchReading: reading, toneMetrics: metrics });
    }, 60);

    // Poll onset detector at 30ms
    onsetPollRef.current = setInterval(() => {
      const cursor = usePracticeStore.getState().cursor;
      onsetRef.current.poll(
        ctx.currentTime,
        cursor.measure,
        cursor.beat,
      );
    }, 30);
  }, []);

  const stop = useCallback(() => {
    if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
    if (onsetPollRef.current) clearInterval(onsetPollRef.current);
    detectorRef.current.stop();
    fftRef.current.detach();
    onsetRef.current.detach();
    usePracticeStore.setState({ pitchReading: null, toneMetrics: null });
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    start,
    stop,
    pitchReading: store.pitchReading,
    toneMetrics: store.toneMetrics,
    onsetHistory: store.onsetHistory,
  };
}
