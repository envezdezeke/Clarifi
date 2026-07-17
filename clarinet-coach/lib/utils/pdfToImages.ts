// lib/utils/pdfToImages.ts
// Renders each PDF page to a canvas and returns base64 PNG strings.
// Runs in the browser only (uses pdfjs-dist with canvas API).

import * as PDFJS from 'pdfjs-dist';

// Point the worker at the CDN copy so Next.js doesn't try to bundle it
if (typeof window !== 'undefined') {
  PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.mjs`;
}

export async function pdfToBase64Images(file: File, scale = 2.0): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Strip the "data:image/png;base64," prefix — API wants raw base64
    const dataUrl = canvas.toDataURL('image/png');
    images.push(dataUrl.split(',')[1]);
  }

  return images;
}
