// lib/audio/onsetDetector.ts
// High-Frequency Content (HFC) onset detection.
// HFC is preferred over simple energy delta for clarinet:
// tonguing produces sharp high-frequency transients even at soft dynamics.

import type { OnsetEvent } from '../types';

const FFT_SIZE = 1024;
const BIN_HZ = 44100 / FFT_SIZE;
const MIN_ONSET_INTERVAL_MS = 80;  // prevents double-triggering on one note

export class OnsetDetector {
  private analyserNode: AnalyserNode | null = null;
  private freqData: Float32Array | null = null;
  private prevHFC = 0;
  private lastOnsetTime = 0;
  private adaptiveMean = 0;
  private adaptiveStd = 1;
  private readonly K = 1.5;         // threshold multiplier: onset when HFC > mean + K*std

  public onOnset: ((event: OnsetEvent) => void) | null = null;

  attach(audioContext: AudioContext, sourceNode: AudioNode): void {
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = FFT_SIZE;
    this.freqData = new Float32Array(this.analyserNode.frequencyBinCount);
    sourceNode.connect(this.analyserNode);
  }

  /**
   * Poll this at ~30ms intervals (more frequent than pitch polling).
   * @param audioContextTime - AudioContext.currentTime for accurate timestamping
   * @param currentMeasure / currentBeat - from score follower cursor for tagging
   */
  poll(audioContextTime: number, currentMeasure: number | null, currentBeat: number | null): void {
    if (!this.analyserNode || !this.freqData) return;

    this.analyserNode.getFloatFrequencyData(this.freqData);
    const magnitudes = this.freqData.map(db => Math.pow(10, db / 20));

    // HFC = Σ k² × |X(k)|²
    let hfc = 0;
    for (let k = 0; k < magnitudes.length; k++) {
      hfc += (k * k) * (magnitudes[k] * magnitudes[k]);
    }

    // Update adaptive threshold with exponential moving average
    const alpha = 0.02;
    this.adaptiveMean = (1 - alpha) * this.adaptiveMean + alpha * hfc;
    this.adaptiveStd = (1 - alpha) * this.adaptiveStd + alpha * Math.abs(hfc - this.adaptiveMean);

    const threshold = this.adaptiveMean + this.K * this.adaptiveStd;
    const timeSinceLast = (audioContextTime - this.lastOnsetTime) * 1000;

    // Onset condition: HFC spike above adaptive threshold, not too soon after last onset
    const isOnset = hfc > threshold && hfc > this.prevHFC && timeSinceLast > MIN_ONSET_INTERVAL_MS;

    if (isOnset && this.onOnset) {
      this.lastOnsetTime = audioContextTime;
      this.onOnset({
        time: audioContextTime,
        beat: currentBeat,
        measure: currentMeasure,
      });
    }

    this.prevHFC = hfc;
  }

  detach(): void {
    this.analyserNode?.disconnect();
    this.analyserNode = null;
  }
}
