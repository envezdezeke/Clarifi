'use client';

interface Props {
  isPlaying: boolean;
  isListening: boolean;
  bpm: number;
  useTransposition: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onBpmChange: (bpm: number) => void;
  onTranspositionChange: (enabled: boolean) => void;
  hasScore: boolean;
}

export default function TransportControls({
  isPlaying, isListening, bpm, useTransposition,
  onStart, onStop, onReset, onBpmChange, onTranspositionChange, hasScore,
}: Props) {

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Transport
      </h3>

      {/* Play / Stop / Reset */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!isPlaying ? (
          <button
            className="btn btn-primary"
            onClick={onStart}
            disabled={!hasScore || !isListening}
            style={{ flex: 1, padding: '12px 0', fontSize: 16 }}
          >
            ▶ Play
          </button>
        ) : (
          <button
            className="btn btn-danger"
            onClick={onStop}
            style={{ flex: 1, padding: '12px 0', fontSize: 16 }}
          >
            ◼ Stop
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={onReset}
          disabled={isPlaying}
          style={{ padding: '12px 18px' }}
          title="Reset to measure 1"
        >
          ↺
        </button>
      </div>

      {!isListening && (
        <div style={{
          fontSize: 12,
          color: 'var(--amber)',
          padding: '8px 12px',
          background: 'rgba(245,158,11,0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(245,158,11,0.25)',
          textAlign: 'center',
        }}>
          Microphone not active — click Start Listening below
        </div>
      )}

      {/* BPM slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Tempo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onBpmChange(Math.max(20, bpm - 5))}
              style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
            >−</button>
            <span style={{ fontWeight: 700, fontSize: 20, minWidth: 52, textAlign: 'center' }}>{bpm}</span>
            <button
              onClick={() => onBpmChange(Math.min(300, bpm + 5))}
              style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
            >+</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>BPM</span>
          </div>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          value={bpm}
          onChange={e => onBpmChange(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            height: 4,
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          <span>20</span>
          <span>160</span>
          <span>300</span>
        </div>
      </div>

      {/* Transposition toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Bb Transposition</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            PDF is written pitch (clarinet part)
          </div>
        </div>
        <button
          onClick={() => onTranspositionChange(!useTransposition)}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: useTransposition ? 'var(--accent)' : 'var(--bg-card)',
            border: `1px solid ${useTransposition ? 'var(--accent)' : 'var(--border-light)'}`,
            position: 'relative',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: useTransposition ? 22 : 2,
            width: 18, height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  );
}
