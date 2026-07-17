// lib/audio/pitchDetector.ts
// Wraps pitchfinder YIN algorithm with AudioContext plumbing.
// Keep audio processing outside React render cycle — never setState here.
// Caller is responsible for reading .latestReading via a polling interval.

import { YIN } from 'pitchfinder';
import type { PitchReading } from '../types';
import { hzToPitchReading } from '../utils/noteUtils';

const BUFFER_SIZE = 2048;   // ~46ms at 44100Hz. Do not go below 1024.
const SAMPLE_RATE = 44100;
const SILENCE_THRESHOLD = 0.01;  // RMS below this = silence, skip detection

export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private detectYIN: ((float32: Float32Array) => number | null) | null = null;
  private _stream: MediaStream | null = null;

  public latestReading: PitchReading = { hz: 0, note: '', cents: 0, isValid: false };

  async start(stream: MediaStream): Promise<void> {
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this._stream = stream;

    this.detectYIN = YIN({ sampleRate: SAMPLE_RATE, threshold: 0.1 });

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // ScriptProcessorNode is deprecated but AudioWorklet requires extra setup.
    // Use ScriptProcessorNode for Phase 1; migrate to AudioWorklet in Phase 4 if latency matters.
    this.scriptNode = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
    this.scriptNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const rms = Math.sqrt(input.reduce((sum, s) => sum + s * s, 0) / input.length);
      if (rms < SILENCE_THRESHOLD) {
        this.latestReading = { hz: 0, note: '', cents: 0, isValid: false };
        return;
      }
      const hz = this.detectYIN!(input);
      this.latestReading = hz ? hzToPitchReading(hz) : { hz: 0, note: '', cents: 0, isValid: false };
    };

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  stop(): void {
    this.scriptNode?.disconnect();
    this.sourceNode?.disconnect();
    this._stream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}
