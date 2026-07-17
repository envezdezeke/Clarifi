import Link from 'next/link';

const features = [
  { icon: '🎯', title: 'Real-Time Pitch Tracking', desc: 'YIN algorithm detects pitch to within cents. See exactly how sharp or flat every note lands.' },
  { icon: '🎼', title: 'Score Following', desc: 'Upload a PDF and the beat clock follows along — highlighting expected notes measure by measure.' },
  { icon: '📊', title: 'Clarinet-Specific Analysis', desc: 'Odd/even harmonic ratio, throat-tone detection, squeak alerts, air support feedback.' },
  { icon: '📈', title: 'Session Reports', desc: 'Pitch accuracy, timing accuracy, and tone quality scores with prioritized suggestions after every run.' },
];

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Hero ── */}
      <section style={{ padding: '96px 0 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* glow orbs */}
        <div style={{
          position: 'absolute', top: -100, left: '30%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 50, right: '20%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div className="badge badge-purple" style={{ marginBottom: 24 }}>
            Bb Clarinet · Boehm System · Real-Time
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Practice smarter.<br />Sound better.
          </h1>

          <p style={{ fontSize: 20, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Upload your sheet music, play along, and get instant feedback on pitch, tone, and timing — built specifically for clarinet.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/practice" className="btn btn-primary" style={{ fontSize: 16, padding: '13px 32px' }}>
              Start Practicing →
            </Link>
            <Link href="/history" className="btn btn-ghost" style={{ fontSize: 16, padding: '13px 32px' }}>
              View Sessions
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 32 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '0 0 96px' }}>
        <div className="container">
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 32,
            alignItems: 'center',
            padding: '40px 48px',
          }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="badge badge-purple" style={{ marginBottom: 16 }}>3 easy steps</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Get started in seconds</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                No calibration, no complicated setup. Just your clarinet, a PDF, and your microphone.
              </p>
              <Link href="/practice" className="btn btn-primary">Open Practice Room →</Link>
            </div>

            <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                ['1', 'Upload your PDF sheet music', 'Claude Vision parses every note and rest automatically'],
                ['2', 'Set your tempo and press Play', 'The beat clock starts — play along with your score'],
                ['3', 'Get your session report', 'Pitch issues, timing accuracy, and tone quality scored instantly'],
              ].map(([n, title, desc]) => (
                <div key={n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15,
                  }}>{n}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
