'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const S = {
  nav: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0,
    height: 64,
    background: 'rgba(8,8,14,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 700,
    fontSize: 18,
    color: 'var(--text-primary)',
  },
  logoIcon: {
    width: 32, height: 32,
    background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
};

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 500,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const path = usePathname();

  return (
    <nav style={S.nav}>
      <div className="container" style={S.inner}>
        <Link href="/" style={S.logo}>
          <div style={S.logoIcon}>🎵</div>
          Clarinet Coach
        </Link>
        <div style={S.links}>
          <NavLink href="/" label="Home" active={path === '/'} />
          <NavLink href="/practice" label="Practice" active={path === '/practice'} />
          <NavLink href="/history" label="History" active={path === '/history'} />
          <Link href="/practice" className="btn btn-primary" style={{ marginLeft: 12, padding: '7px 18px', fontSize: 14 }}>
            Start Session
          </Link>
        </div>
      </div>
    </nav>
  );
}
