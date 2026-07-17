'use client';

import type { ToneMetrics } from '../lib/types';

interface Props {
  metrics: ToneMetrics | null;
  isListening: boolean;
}

function Gauge({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {note && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note}</span>}
    </div>
  );
}

export default function TonePanel({ metrics, isListening }: Props) {
  const m = metrics;

  // Derive display values
  const brightness   = m ? m.brightness : 0;
  const clarity      = m ? 1 - m.noisiness : 0;          // invert: high clarity = low noise
  const harmonicPct  = m ? Math.min(1, m.harmonicRatio / 6) : 0;  // 6 = excellent ratio
  const stability    = m ? m.stability : 0;
  const dynamicsDb   = m ? m.dynamicsDb : -96;

  const brightnessColor  = brightness > 0.7 ? 'var(--red)'   : brightness < 0.2 ? 'var(--cyan)'  : 'var(--accent)';
  const clarityColor     = clarity > 0.7    ? 'var(--green)'  : clarity < 0.4    ? 'var(--red)'   : 'var(--amber)';
  const harmonicColor    = harmonicPct > 0.5 ? 'var(--green)' : 'var(--amber)';
  const stabilityColor   = stability > 0.7  ? 'var(--green)'  : stability < 0.4  ? 'var(--red)'   : 'var(--amber)';

  // dB to volume bar (range -60 to 0 dB)
  const volPct = Math.max(0, Math.min(100, ((dynamicsDb + 60) / 60) * 100));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Tone Metrics
      </h3>

      {m && isListening ? (
        <>
          <Gauge
            label="Clarity"
            value={clarity}
            color={clarityColor}
            note={clarity < 0.4 ? 'Excess breath noise detected' : undefined}
          />
          <Gauge
            label="Harmonic Balance"
            value={harmonicPct}
            color={harmonicColor}
            note={harmonicPct < 0.35 ? 'Odd harmonics low — check embouchure' : undefined}
          />
          <Gauge
            label="Stability"
            value={stability}
            color={stabilityColor}
            note={stability < 0.4 ? 'Unsteady airflow — support from the diaphragm' : undefined}
          />
          <Gauge
            label="Brightness"
            value={brightness}
            color={brightnessColor}
            note={brightness > 0.7 ? 'Very bright — relax jaw / throat' : undefined}
          />

          {/* Volume */}
          <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Volume</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(dynamicsDb)} dB</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${volPct}%`,
                background: volPct > 85 ? 'var(--red)' : 'var(--cyan)',
              }} />
            </div>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '24px 0',
          color: 'var(--text-muted)',
          fontSize: 14,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36 }}>〰️</div>
          {isListening ? 'Play a note to see tone analysis' : 'Start listening to analyse tone'}
        </div>
      )}
    </div>
  );
}
