'use client';

import { useCallback, useState } from 'react';
import { pdfToBase64Images } from '../lib/utils/pdfToImages';
import { usePracticeStore } from '../store/practiceStore';
import type { ParsedScore } from '../lib/types';

export default function PdfUploader() {
  const [dragging, setDragging] = useState(false);
  const { isParsing, parseError, setIsParsing, setParseError, setParsedScore } = usePracticeStore();

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setParseError('Please upload a PDF file.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    try {
      const pages = await pdfToBase64Images(file);
      const res = await fetch('/api/parse-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Parse failed');
      }
      const score: ParsedScore = await res.json();
      setParsedScore(score, file.name);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsParsing(false);
    }
  }, [setIsParsing, setParseError, setParsedScore]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎼</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Upload Sheet Music</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320 }}>
          Drop a PDF of your clarinet part. Claude Vision will parse every note automatically.
        </p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 400,
          minHeight: 180,
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-light)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          cursor: 'pointer',
          background: dragging ? 'rgba(139,92,246,0.07)' : 'var(--bg-elevated)',
          transition: 'all 0.2s',
        }}
      >
        <input type="file" accept=".pdf" onChange={onFileChange} style={{ display: 'none' }} disabled={isParsing} />
        {isParsing ? (
          <>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ color: 'var(--accent)', fontWeight: 600 }}>Parsing score with Claude Vision…</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This takes 5–15 seconds</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32 }}>📄</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your PDF</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>or click to browse · max 10 pages</p>
            </div>
          </>
        )}
      </label>

      {parseError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          color: 'var(--red)',
          fontSize: 14,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          ⚠️ {parseError}
        </div>
      )}
    </div>
  );
}
