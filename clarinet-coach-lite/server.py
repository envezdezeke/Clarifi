#!/usr/bin/env python3
"""
Clarinet Coach - Local server
Run: python server.py
Then open: http://localhost:8080
No pip installs needed — uses Python stdlib only.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────

GEMINI_API_KEY = "AIzaSyBcf2aAx8BYp6x1r8jRTN2V8fcC8XNYa7g"
GEMINI_MODEL   = "gemini-2.0-flash"
PORT           = 8080
APP_FILE       = Path(__file__).parent / "app.html"

PARSE_PROMPT = """You are analyzing a single-staff clarinet part (Bb clarinet, written pitch, treble clef).
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
- For dotted notes: use "dotted-quarter", "dotted-half", "dotted-eighth".
- For ties: extend the first note duration to cover the full tied value. Do not output the second tied note.
- For repeats: expand inline — output the repeated measures twice.
- If you cannot confidently read a measure, output {"number": N, "events": [{"type":"rest","beat":1,"duration":"whole"}]} and add a warning to parseWarnings.
- Pickup/anacrusis: output as measure 1 with fewer events than beatsPerMeasure.
- If multiple images are provided they are pages in order — treat as one continuous score."""


# ─── Gemini API Call ──────────────────────────────────────────────────────────

def call_gemini(pages_b64: list[str]) -> str:
    """Call Gemini Vision API with base64 PNG images. Returns raw text response."""
    parts = []
    for b64 in pages_b64:
        parts.append({
            "inlineData": {
                "mimeType": "image/png",
                "data": b64
            }
        })
    parts.append({"text": PARSE_PROMPT})

    payload = json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192
        }
    }).encode("utf-8")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    # Extract text from Gemini response structure
    candidates = result.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini returned no candidates")
    text = candidates[0]["content"]["parts"][0]["text"]
    return text


# ─── HTTP Handler ─────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        # Suppress default noisy logging; print cleaner version
        print(f"  {self.command} {self.path} → {args[1] if len(args) > 1 else '?'}")

    def send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            if not APP_FILE.exists():
                self.send_error(404, "app.html not found")
                return
            content = APP_FILE.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", len(content))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == "/api/parse-score":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length))
                pages = body.get("pages", [])

                if not pages:
                    self.send_json({"error": "No pages provided"}, 400)
                    return
                if len(pages) > 10:
                    self.send_json({"error": "Maximum 10 pages"}, 400)
                    return

                print(f"  → Calling Gemini Vision with {len(pages)} page(s)…")
                raw = call_gemini(pages)

                # Strip markdown fences if Gemini added them
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[1:])
                if cleaned.endswith("```"):
                    cleaned = "\n".join(cleaned.split("\n")[:-1])
                cleaned = cleaned.strip()

                parsed = json.loads(cleaned)
                if "measures" not in parsed or not isinstance(parsed["measures"], list):
                    self.send_json({"error": "Invalid score structure from Gemini", "raw": raw}, 502)
                    return

                parsed.setdefault("pageCount", len(pages))
                parsed.setdefault("parseWarnings", [])
                self.send_json(parsed)

            except json.JSONDecodeError as e:
                self.send_json({"error": f"JSON parse error: {e}", "raw": raw if 'raw' in dir() else ""}, 502)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                self.send_json({"error": f"Gemini API error {e.code}: {err_body}"}, 502)
            except Exception as e:
                print(f"  ERROR: {e}")
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_error(404)


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not APP_FILE.exists():
        print(f"ERROR: {APP_FILE} not found. Make sure app.html is in the same folder as server.py.")
        sys.exit(1)

    server = HTTPServer(("localhost", PORT), Handler)
    print(f"""
  ╔══════════════════════════════════════╗
  ║       Clarinet Coach is running      ║
  ║   Open: http://localhost:{PORT}         ║
  ║   Press Ctrl+C to stop               ║
  ╚══════════════════════════════════════╝
""")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")
