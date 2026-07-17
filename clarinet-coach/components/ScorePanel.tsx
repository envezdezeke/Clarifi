'use client';

import type { ParsedScore, ScoreEvent } from '../lib/types';

interface Props {
  score: ParsedScore;
  cursor: { measure: number; beat: number };
  isPlaying: boolean;
}

function noteLabel(event: ScoreEvent): string {
  if (event.type === 'rest') return '𝄽';
  return event.writtenPitch;
}

function durationSymbol(dur: string): string {
  const map: Record<string, string> = {
    'whole': '𝅝', 'half': '𝅗𝅥', 'quarter': '♩', 'eighth': '♪', 'sixteenth': '𝅘𝅥𝅯',
    'dotted-half': '𝅗𝅥.', 'dotted-quarter': '♩.', 'dotted-eighth': '♪.', 'thirty-second': '𝅘𝅥𝅰',
  };
  return map[dur] ?? '♩';
}

export default function ScorePanel({ score, cursor, isPlaying }: Props) {
  // Show a window of measures around the cursor
  const windowSize = 4;
  const startMeasure = Math.max(1, cursor.measure - 1);
  const endMeasure = Math.min(score.measures.length, startMeasure + windowSize - 1);
  const visibleMeasures = score.measures.filter(m => m.number >= startMeasure && m.number <= endMeasure);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Score header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Score</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {score.keySignature} · {score.timeSignature} · {score.measures.length} measures
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {score.tempoMarking && (
            <span className="badge badge-purple">{score.tempoMarking}</span>
          )}
        </div>
      </div>

      {/* Cursor position */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>MEASURE</div>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: isPlaying ? 'var(--accent)' : 'var(--text-primary)' }}>
            {cursor.measure}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>BEAT</div>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: isPlaying ? 'var(--cyan)' : 'var(--text-primary)' }}>
            {cursor.beat}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>PROGRESS</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {cursor.measure} / {score.measures.length}
          </div>
          <div className="progress-track" style={{ marginTop: 4, height: 4 }}>
            <div className="progress-fill" style={{
              width: `${(cursor.measure / score.measures.length) * 100}%`,
              background: 'var(--accent)',
            }} />
          </div>
        </div>
      </div>

      {/* Measure view */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibleMeasures.map(measure => {
          const isCurrentMeasure = measure.number === cursor.measure;
          return (
            <div
              key={measure.number}
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'stretch',
                border: `1px solid ${isCurrentMeasure ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: isCurrentMeasure ? 'rgba(139,92,246,0.06)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {/* Measure number */}
              <div style={{
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isCurrentMeasure ? 'var(--accent)' : 'var(--bg-elevated)',
                color: isCurrentMeasure ? '#fff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {measure.number}
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flex: 1, padding: '8px 4px', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {measure.events.map((event, i) => {
                  const isCurrentBeat = isCurrentMeasure && event.beat === cursor.beat;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: isCurrentBeat
                          ? 'var(--accent)'
                          : event.type === 'rest'
                            ? 'rgba(100,116,139,0.1)'
                            : 'var(--bg-elevated)',
                        transition: 'all 0.1s',
                        minWidth: 44,
                      }}
                    >
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isCurrentBeat ? '#fff' : event.type === 'rest' ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}>
                        {noteLabel(event)}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: isCurrentBeat ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                      }}>
                        {durationSymbol(event.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Parse warnings */}
      {score.parseWarnings.length > 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--amber)',
        }}>
          ⚠️ {score.parseWarnings.length} parse warning{score.parseWarnings.length > 1 ? 's' : ''}:{' '}
          {score.parseWarnings[0]}
          {score.parseWarnings.length > 1 && ` (+${score.parseWarnings.length - 1} more)`}
        </div>
      )}
    </div>
  );
}
