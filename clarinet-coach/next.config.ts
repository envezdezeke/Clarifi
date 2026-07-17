import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pdfjs-dist ships a legacy worker; exclude it from server-side bundling
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
