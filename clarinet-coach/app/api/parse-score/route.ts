// app/api/parse-score/route.ts
// Receives PDF page images (base64), sends to Claude Vision, returns ParsedScore.
// Server-side only — ANTHROPIC_API_KEY never touches the client.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ParsedScore } from '../../../lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSE_PROMPT = `You are analyzing a single-staff clarinet part (Bb clarinet, written pitch, treble clef).
Extract all musical content and return ONLY valid JSON — no explanation, no markdown, no code fences.

Return this exact structure:
{
  "keySignature": string,
  "timeSignature": string,
  "beatsPerMeasure": number,
  "beatUnit": number,
  "tempoExtracted": number | null,
  "tempoMarking": string | null,
  "measures": [
    {
      "number": 1,
      "events": [
        { "type": "note", "beat": 1, "writtenPitch": "D4", "duration": "quarter" },
        { "type": "rest", "beat": 2, "duration": "quarter" }
      ]
    }
  ],
  "parseWarnings": []
}

Rules:
- Written pitch only (not concert pitch). D4 on the page = D4 in output.
- Beat numbers are 1-indexed, matching the time signature numerator.
- For dotted notes: "dotted-quarter", "dotted-half", "dotted-eighth".
- For ties: extend the first note's duration to cover the full tied value. Do not output the second tied note.
- For trills or ornaments: output the written note pitch only. Ignore the ornament itself.
- For repeats: expand inline. If a section is marked to repeat, output the measures twice.
- If you cannot confidently read a measure, output { "number": N, "events": [{"type":"rest","beat":1,"duration":"whole"}] } and add a warning string to parseWarnings.
- Pickup/anacrusis: output it as measure 1 with fewer beats than beatsPerMeasure. Do not fabricate missing beats.
- If multiple images are provided, they are pages in order. Process all pages as one continuous score.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pages }: { pages: string[] } = body;  // base64 PNG strings, one per page

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages provided' }, { status: 400 });
    }
    if (pages.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 pages per request' }, { status: 400 });
    }

    const imageContent: Anthropic.ImageBlockParam[] = pages.map(b64 => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: b64 },
    }));

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: PARSE_PROMPT },
          ],
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip any accidental markdown fences Claude might add
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: ParsedScore;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Claude returned unparseable JSON', raw },
        { status: 502 }
      );
    }

    // Validate required fields
    if (!parsed.measures || !Array.isArray(parsed.measures)) {
      return NextResponse.json({ error: 'Invalid score structure from Claude' }, { status: 502 });
    }

    parsed.pageCount = pages.length;
    if (!parsed.parseWarnings) parsed.parseWarnings = [];

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('[parse-score] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
