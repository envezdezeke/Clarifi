'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PracticeSession } from '../../lib/types';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      border: `3px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: 16, color, flexShrink: 0,
    }}>
      {score}
    </div>
  );
}

function SessionCard({ session }: { session: PracticeSession }) {
  const date = new Date(session.createdAt);
  const mins = Math.floor(session.durationSeconds / 60);
  const secs = session.durationSeconds % 60;
  const { feedback } = session;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <ScoreBadge score={feedback.overallScore} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.scoreTitle ?? 'Free Practice'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {mins}m {secs}s
            {' · '}
            {session.effectiveBpm} BPM
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Pitch', value: feedback.pitchAccuracy, color: 'var(--cyan)' },
          { label: 'Timing', value: feedback.timingAccuracy, color: 'var(--amber)' },
          { label: 'Tone', value: feedback.toneQuality, color: 'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span>🎵 {feedback.notesPlayed} notes</span>
        <span>❌ {feedback.notesMissed} missed</span>
        <span>📄 {feedback.measuresAnalyzed} measures</span>
      </div>

      {/* Top suggestion */}
      {feedback.suggestions.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          💡 {feedback.suggestions[0]}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<PracticeSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/session?limit=20')
      .then(async res => {
        if (res.status === 401) throw new Error('auth');
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(data => setSessions(data))
      .catch(e => setError(e.message === 'auth' ? 'auth' : 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Session History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Your practice sessions, sorted by most recent.</p>
        </div>
        <Link href="/practice" className="btn btn-primary">+ New Session</Link>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      )}

      {error === 'auth' && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sign in to view history</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Sessions are saved to your account. Connect Supabase Auth to enable this feature.
          </p>
          <Link href="/practice" className="btn btn-primary">Go Practice →</Link>
        </div>
      )}

      {error && error !== 'auth' && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No sessions yet</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Complete a practice session and save it to see it here.
          </p>
          <Link href="/practice" className="btn btn-primary">Start Practicing →</Link>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Sessions', value: sessions.length },
              { label: 'Avg Overall Score', value: Math.round(sessions.reduce((a, s) => a + s.feedback.overallScore, 0) / sessions.length) },
              { label: 'Avg Pitch', value: Math.round(sessions.reduce((a, s) => a + s.feedback.pitchAccuracy, 0) / sessions.length) },
              { label: 'Total Practice', value: `${Math.round(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60)}m` },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {sessions.map(s => <SessionCard key={s.id} session={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
