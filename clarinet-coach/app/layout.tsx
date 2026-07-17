import type { Metadata } from 'next';
import './globals.css';
import NavBar from '../components/NavBar';

export const metadata: Metadata = {
  title: 'Clarinet Coach',
  description: 'Real-time pitch, tone, and timing feedback for clarinet practice',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="page" style={{ paddingTop: 64 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
