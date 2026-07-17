'use client';

import type { SessionFeedback } from '../lib/types';

interface Props {
  feedback: SessionFeedback;
  scoreTitle: string | null;
  bpm: number;
  durationSeconds: number;
  onSave: () => void;
  onNewSession: () => void;
  isSaving: boolean;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={6} />
        <circle
          cx={40} cy={40} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
        <text x={40} y={44} textAnchor="middle" fill="var(--text-primary)" fontSize={18} fontWeight={800}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function FeedbackReport({ feedback, scoreTitle, bpm, durationSeconds, onSave, onNewSession, isSaving }: Props) {
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  const overallColor = feedback.overallScore >= 80 ? 'var(--green)' : feedback.overallScore >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Overall banner */}
      <div className="card" style={{
        background: `linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))`,
        border: '1px solid rgba(139,92,246,0.3)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Session Complete</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            {scoreTitle ?? 'Free Practice'} · {bpm} BPM
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Duration: {mins}m {secs}s · {feedback.notesPlayed} notes played · {feedback.notesMissed} missed · {feedback.measuresAnalyzed} measures
          </div>
        </div>

        {/* Score rings */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <ScoreRing score={feedback.overallScore}    label="Overall"  color={overallColor} />
          <ScoreRing score={feedback.pitchAccuracy}   label="Pitch"    color="var(--cyan)" />
          <ScoreRing score={feedback.timingAccuracy}  label="Timing"   color="var(--amber)" />
          <ScoreRing score={feedback.toneQuality}     label="Tone"     color="var(--accent)" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Pitch issues */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Pitch Issues</h3>
          {feedback.pitchIssues.length === 0 ? (
            <div style={{ color: 'var(--green)', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>✓</span> No significant pitch issues
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedback.pitchIssues.map(issue => (
                <div key={issue.note} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  gap: 12,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{issue.note}</span>
                    <span className={`badge ${issue.direction === 'sharp' ? 'badge-amber' : 'badge-cyan'}`}>
                      {issue.direction === 'sharp' ? '↑ sharp' : '↓ flat'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: issue.direction === 'sharp' ? 'var(--amber)' : 'var(--cyan)' }}>
                      {Math.abs(issue.avgCentsDeviation)}¢
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>×{issue.occurrences}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tone issues */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Tone Issues</h3>
          {feedback.toneIssues.length === 0 ? (
            <div style={{ color: 'var(--green)', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>✓</span> Tone quality looks good
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedback.toneIssues.map(issue => (
                <div key={issue.type} style={{
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${issue.severity === 'significant' ? 'var(--red)' : issue.severity === 'moderate' ? 'var(--amber)' : 'var(--text-muted)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${issue.severity === 'significant' ? 'badge-red' : issue.severity === 'moderate' ? 'badge-amber' : 'badge-cyan'}`}>
                      {issue.type}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      mm. {issue.measures.slice(0, 4).join(', ')}{issue.measures.length > 4 ? '…' : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {feedback.suggestions.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Suggestions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedback.suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: i === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i === 0 ? '#fff' : 'var(--text-muted)',
                }}>{i + 1}</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onNewSession}>Start New Session</button>
        <button className="btn btn-primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? <><span className="spinner" /> Saving…</> : '💾 Save Session'}
        </button>
      </div>
    </div>
  );
}
