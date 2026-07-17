'use client';

import type { PitchReading } from '../lib/types';

interface Props {
  reading: PitchReading | null;
  isListening: boolean;
}

// Cent bar: -50 to +50, green at center, red at extremes
function CentBar({ cents }: { cents: number }) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const pct = ((clamped + 50) / 100) * 100;
  const isCenter = Math.abs(clamped) < 8;
  const color = isCenter ? 'var(--green)' : Math.abs(clamped) > 30 ? 'var(--red)' : 'var(--amber)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        <span>♭ flat</span>
        <span style={{ color: isCenter ? 'var(--green)' : 'var(--text-muted)' }}>in tune</span>
        <span>sharp ♯</span>
      </div>
      <div style={{
        height: 10,
        background: 'var(--bg-elevated)',
        borderRadius: 5,
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* center tick */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: -3,
          width: 2,
          height: 16,
          background: 'var(--border-light)',
          borderRadius: 1,
        }} />
        {/* needle */}
        <div style={{
          position: 'absolute',
          left: `${pct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          background: color,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${color}`,
          transition: 'left 0.1s ease, background 0.15s',
          zIndex: 2,
        }} />
        {/* fill from center */}
        <div style={{
          position: 'absolute',
          left: clamped >= 0 ? '50%' : `${pct}%`,
          width: `${Math.abs(pct - 50)}%`,
          top: 0,
          height: '100%',
          background: color,
          opacity: 0.25,
          transition: 'all 0.1s ease',
        }} />
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color, fontWeight: 600 }}>
        {clamped > 0 ? `+${Math.round(clamped)}` : Math.round(clamped)}¢
      </div>
    </div>
  );
}

export default function PitchMeter({ reading, isListening }: Props) {
  const hasReading = reading?.isValid;
  const note = hasReading ? reading!.note : null;
  const cents = hasReading ? reading!.cents : 0;
  const hz = hasReading ? reading!.hz : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Pitch
        </h3>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px',
          borderRadius: 999,
          background: isListening ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
          border: `1px solid ${isListening ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.3)'}`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isListening ? 'var(--green)' : 'var(--text-muted)',
            ...(isListening ? { animation: 'pulse-ring 1.5s infinite' } : {}),
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isListening ? 'var(--green)' : 'var(--text-muted)' }}>
            {isListening ? 'Listening' : 'Off'}
          </span>
        </div>
      </div>

      {/* Big note display */}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: hasReading ? 'var(--text-primary)' : 'var(--border-light)',
          transition: 'color 0.1s',
          minHeight: 80,
        }}>
          {note ?? '—'}
        </div>
        {hz && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {hz.toFixed(1)} Hz
          </div>
        )}
      </div>

      {/* Cent deviation bar */}
      {hasReading ? (
        <CentBar cents={cents} />
      ) : (
        <div style={{
          height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          {isListening ? 'Play a note…' : 'Start listening to see pitch'}
        </div>
      )}
    </div>
  );
}
