'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useScoreFollower } from '../../hooks/useScoreFollower';
import { useComparison } from '../../hooks/useComparison';
import { usePracticeStore } from '../../store/practiceStore';
import { requestMicPermission } from '../../lib/utils/permissions';
import PdfUploader from '../../components/PdfUploader';
import PitchMeter from '../../components/PitchMeter';
import TonePanel from '../../components/TonePanel';
import ScorePanel from '../../components/ScorePanel';
import TransportControls from '../../components/TransportControls';
import FeedbackReport from '../../components/FeedbackReport';
import type { SessionFeedback } from '../../lib/types';

export default function PracticePage() {
  const store = usePracticeStore();
  const audio = useAudioEngine();
  const scoreFollower = useScoreFollower();
  const comparison = useComparison();

  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Track onset count to fire comparisons on new onsets
  const prevOnsetCountRef = useRef(0);

  // Wire new onsets → comparison
  useEffect(() => {
    const newCount = audio.onsetHistory.length;
    if (newCount > prevOnsetCountRef.current && store.isPlaying) {
      comparison.compareAtOnset(0);
      prevOnsetCountRef.current = newCount;
    }
  }, [audio.onsetHistory.length, store.isPlaying, comparison]);

  // Reset onset count when session clears
  useEffect(() => {
    if (!store.isPlaying && comparison.eventLog.length === 0) {
      prevOnsetCountRef.current = 0;
    }
  }, [store.isPlaying, comparison.eventLog.length]);

  const startListening = useCallback(async () => {
    setMicError(null);
    const granted = await requestMicPermission();
    if (!granted) {
      setMicError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }
    await audio.start();
    setIsListening(true);
  }, [audio]);

  const stopListening = useCallback(() => {
    audio.stop();
    setIsListening(false);
    if (store.isPlaying) {
      scoreFollower.stop();
    }
  }, [audio, store.isPlaying, scoreFollower]);

  const handlePlay = useCallback(() => {
    if (!store.parsedScore) return;
    setSessionFeedback(null);
    setSessionStartTime(Date.now());
    scoreFollower.start();
    store.setIsPlaying(true);
  }, [store, scoreFollower]);

  const handleStop = useCallback(() => {
    scoreFollower.stop();
    store.setIsPlaying(false);
    if (sessionStartTime) {
      const dur = Math.round((Date.now() - sessionStartTime) / 1000);
      setSessionDuration(dur);
    }
    const fb = comparison.getFeedback();
    setSessionFeedback(fb);
  }, [scoreFollower, store, comparison, sessionStartTime]);

  const handleReset = useCallback(() => {
    scoreFollower.reset();
    store.clearSession();
    setSessionFeedback(null);
    setSessionStartTime(null);
    prevOnsetCountRef.current = 0;
  }, [scoreFollower, store]);

  const handleBpmChange = useCallback((bpm: number) => {
    store.setBpmOverride(bpm);
    // scoreFollower re-reads effectiveBpm from the store via its useEffect
  }, [store]);

  const handleSaveSession = useCallback(async () => {
    if (!sessionFeedback) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: sessionDuration,
          scoreTitle: store.scoreFilename,
          effectiveBpm: store.effectiveBpm,
          feedback: sessionFeedback,
          eventLog: comparison.eventLog,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Save failed');
      }
      setSaveMsg('Session saved!');
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [sessionFeedback, sessionDuration, store, comparison.eventLog]);

  const handleNewSession = useCallback(() => {
    handleReset();
  }, [handleReset]);

  const hasScore = !!store.parsedScore;
  const showFeedback = !!sessionFeedback;

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Practice Room</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Upload your score, start listening, and play along for real-time feedback.
        </p>
      </div>

      {/* Microphone banner */}
      {!isListening && !micError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 20px',
          marginBottom: 20,
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎙️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Microphone required</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Grant mic access to start real-time pitch analysis</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={startListening} style={{ padding: '9px 20px' }}>
            Start Listening
          </button>
        </div>
      )}

      {isListening && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 20px',
          marginBottom: 20,
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--green)',
              animation: 'pulse-ring 1.5s infinite',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Listening — microphone active</span>
          </div>
          <button className="btn btn-ghost" onClick={stopListening} style={{ fontSize: 13, padding: '7px 16px' }}>
            Stop Mic
          </button>
        </div>
      )}

      {micError && (
        <div style={{
          padding: '12px 20px', marginBottom: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: 14,
        }}>
          ⚠️ {micError}
        </div>
      )}

      {/* Main grid */}
      {showFeedback ? (
        <div>
          {saveMsg && (
            <div style={{
              marginBottom: 16, padding: '10px 16px',
              background: saveMsg.includes('saved') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${saveMsg.includes('saved') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 'var(--radius-md)',
              color: saveMsg.includes('saved') ? 'var(--green)' : 'var(--red)',
              fontSize: 14,
            }}>
              {saveMsg}
            </div>
          )}
          <FeedbackReport
            feedback={sessionFeedback!}
            scoreTitle={store.scoreFilename}
            bpm={store.effectiveBpm}
            durationSeconds={sessionDuration}
            onSave={handleSaveSession}
            onNewSession={handleNewSession}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasScore ? '1fr 340px' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {hasScore ? (
              <ScorePanel
                score={store.parsedScore!}
                cursor={store.cursor}
                isPlaying={store.isPlaying}
              />
            ) : (
              <div className="card" style={{ minHeight: 360, padding: 0, overflow: 'hidden' }}>
                <PdfUploader />
              </div>
            )}

            {/* Current note indicator when playing */}
            {hasScore && store.isPlaying && (
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))',
                border: '1px solid rgba(139,92,246,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '16px 24px',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>EXPECTED</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
                    {scoreFollower.getExpectedNote() ?? '𝄽'}
                  </div>
                </div>
                <div style={{ width: 1, height: 50, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>DETECTED</div>
                  <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: audio.pitchReading?.isValid ? 'var(--cyan)' : 'var(--border-light)' }}>
                    {audio.pitchReading?.isValid ? audio.pitchReading.note : '—'}
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Session events</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{comparison.eventLog.length}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right column — only when score loaded */}
          {hasScore && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TransportControls
                isPlaying={store.isPlaying}
                isListening={isListening}
                bpm={store.effectiveBpm}
                useTransposition={store.useTransposition}
                onStart={handlePlay}
                onStop={handleStop}
                onReset={handleReset}
                onBpmChange={handleBpmChange}
                onTranspositionChange={store.setTransposition}
                hasScore={hasScore}
              />

              <PitchMeter reading={audio.pitchReading} isListening={isListening} />

              <TonePanel metrics={audio.toneMetrics} isListening={isListening} />

              {/* Upload different score */}
              <button
                className="btn btn-ghost"
                onClick={() => store.clearSession()}
                style={{ width: '100%', fontSize: 13 }}
              >
                📄 Upload Different Score
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
