// lib/audio/fftAnalyzer.ts
// Runs in parallel with PitchDetector on the same AudioContext.
// Computes clarinet-specific timbre metrics from frequency domain data.

import type { ToneMetrics } from '../types';

const FFT_SIZE = 2048;
const SAMPLE_RATE = 44100;
const BIN_HZ = SAMPLE_RATE / FFT_SIZE;

// Squeak = sudden energy spike above this frequency with no fundamental below it
const SQUEAK_THRESHOLD_HZ = 3500;

// Window for RMS stability measurement in milliseconds
const STABILITY_WINDOW_MS = 500;

export class FFTAnalyzer {
  private analyserNode: AnalyserNode | null = null;
  private freqData: Float32Array | null = null;
  private rmsHistory: number[] = [];

  public latestMetrics: ToneMetrics = {
    brightness: 0,
    noisiness: 0,
    harmonicRatio: 1,
    stability: 0,
    dynamicsDb: -96,
  };

  attach(audioContext: AudioContext, sourceNode: AudioNode): void {
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = FFT_SIZE;
    this.analyserNode.smoothingTimeConstant = 0.5;
    this.freqData = new Float32Array(this.analyserNode.frequencyBinCount);
    sourceNode.connect(this.analyserNode);
  }

  /**
   * Call this on a polling interval (~60ms) — NOT in an audio callback.
   * Reads current frequency data and updates latestMetrics.
   * @param fundamentalHz - pass the current detected pitch so harmonic analysis is pitch-aware
   */
  analyze(fundamentalHz: number): ToneMetrics {
    if (!this.analyserNode || !this.freqData) return this.latestMetrics;

    this.analyserNode.getFloatFrequencyData(this.freqData);
    const magnitudes = this.freqData.map(db => Math.pow(10, db / 20)); // dB → linear

    const N = magnitudes.length;

    // ── Spectral centroid (brightness) ──────────────────────────────────────
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let k = 0; k < N; k++) {
      const freq = k * BIN_HZ;
      weightedSum += freq * magnitudes[k];
      magnitudeSum += magnitudes[k];
    }
    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    // Normalize to 0–1 over the range 200Hz–8000Hz
    const brightness = Math.min(1, Math.max(0, (centroid - 200) / (8000 - 200)));

    // ── Spectral flatness (noisiness) ────────────────────────────────────────
    // SF = geometric_mean / arithmetic_mean. Near 0 = tonal, near 1 = noise.
    const epsilon = 1e-10;
    const logSum = magnitudes.reduce((sum, m) => sum + Math.log(m + epsilon), 0);
    const geoMean = Math.exp(logSum / N);
    const arithMean = magnitudeSum / N;
    const noisiness = arithMean > 0 ? Math.min(1, geoMean / arithMean) : 0;

    // ── Odd/even harmonic ratio (clarinet-specific) ──────────────────────────
    // Cylindrical bore suppresses even harmonics. Good clarinet tone: ratio > 3.
    let oddEnergy = 0;
    let evenEnergy = 0;
    if (fundamentalHz > 0) {
      for (let harmonic = 1; harmonic <= 10; harmonic++) {
        const targetHz = fundamentalHz * harmonic;
        const bin = Math.round(targetHz / BIN_HZ);
        if (bin < N) {
          const energy = magnitudes[bin] * magnitudes[bin];
          if (harmonic % 2 !== 0) oddEnergy += energy;
          else evenEnergy += energy;
        }
      }
    }
    const harmonicRatio = evenEnergy > 0 ? oddEnergy / evenEnergy : 1;

    // ── RMS dynamics and stability ────────────────────────────────────────────
    const rms = Math.sqrt(magnitudes.reduce((s, m) => s + m * m, 0) / N);
    const dynamicsDb = 20 * Math.log10(rms + epsilon);

    // Keep rolling history for stability measurement
    const maxSamples = Math.ceil(STABILITY_WINDOW_MS / 60); // ~8 samples at 60ms
    this.rmsHistory.push(rms);
    if (this.rmsHistory.length > maxSamples) this.rmsHistory.shift();
    const mean = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
    const variance = this.rmsHistory.reduce((s, r) => s + (r - mean) ** 2, 0) / this.rmsHistory.length;
    const stability = 1 - Math.min(1, Math.sqrt(variance) / (mean + epsilon));

    this.latestMetrics = { brightness, noisiness, harmonicRatio, stability, dynamicsDb };
    return this.latestMetrics;
  }

  /**
   * Squeak detection: spike above SQUEAK_THRESHOLD_HZ with disproportionate energy.
   * Returns true if a squeak is occurring right now.
   */
  detectSqueak(fundamentalHz: number): boolean {
    if (!this.freqData) return false;
    const squeakBin = Math.floor(SQUEAK_THRESHOLD_HZ / BIN_HZ);
    const magnitudes = this.freqData.map(db => Math.pow(10, db / 20));
    const highEnergy = magnitudes.slice(squeakBin).reduce((a, b) => a + b, 0);
    const totalEnergy = magnitudes.reduce((a, b) => a + b, 0);
    // Squeak = high-frequency band holds > 40% of total energy AND no valid fundamental
    return (totalEnergy > 0) && (highEnergy / totalEnergy > 0.4) && (fundamentalHz < 200);
  }

  detach(): void {
    this.analyserNode?.disconnect();
    this.analyserNode = null;
    this.rmsHistory = [];
  }
}
