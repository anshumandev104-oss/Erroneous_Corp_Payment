import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  cc: string;
  body: string;
  raw_headers: Record<string, string>;
}

/**
 * Parse an .eml or .txt email file into a structured object.
 * Uses mailparser for .eml; falls back to line-by-line parsing for .txt.
 * NOTE: mailparser is a CJS module — loaded via require at runtime.
 */
export async function parseEml(filePath: string): Promise<ParsedEmail> {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath);

  if (ext === '.eml') {
    // Dynamic require avoids ESM/CJS bundling issues (see next.config.js serverExternalPackages)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { simpleParser } = require('mailparser') as typeof import('mailparser');
    const parsed = await simpleParser(raw);

    const from = parsed.from?.text ?? '';
    const to   = parsed.to
      ? Array.isArray(parsed.to) ? parsed.to.map((a: { text: string }) => a.text).join(', ') : (parsed.to as { text: string }).text
      : '';
    const cc   = parsed.cc
      ? Array.isArray(parsed.cc) ? parsed.cc.map((a: { text: string }) => a.text).join(', ') : (parsed.cc as { text: string }).text
      : '';

    // Prefer plain text; strip HTML tags if only HTML part is available
    let body = parsed.text ?? '';
    if (!body && parsed.html) {
      body = (parsed.html as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const raw_headers: Record<string, string> = {};
    parsed.headers?.forEach((value: unknown, key: string) => {
      raw_headers[key] = typeof value === 'string' ? value : JSON.stringify(value);
    });

    // Fallback for non-standard .eml files where body is empty because there
    // is no blank line between headers and body (mailparser treats every
    // "Key: value" line as a header).  Extract the 'body' pseudo-header or
    // collect all non-standard header lines as the body text.
    if (!body) {
      const rawText = raw.toString('utf-8');
      const rawLines = rawText.split('\n');
      const KNOWN_HEADERS = /^(Subject|From|To|Cc|Bcc|Date|MIME-Version|Content-Type|Message-ID|Return-Path):/i;
      const bodyLines = rawLines.filter(l => !KNOWN_HEADERS.test(l) && l.trim() !== '');
      // Strip any leading "Body: " label (non-standard but present in sample files)
      body = bodyLines
        .map(l => l.replace(/^Body:\s*/i, ''))
        .join('\n')
        .trim();
    }

    return { subject: parsed.subject ?? '', from, to, cc, body, raw_headers };
  }

  // Fallback: treat as raw text file (mirrors eml_parse.py behaviour)
  const text = raw.toString('utf-8');
  const lines = text.split('\n');
  const subject = lines.find((l: string) => l.startsWith('Subject:'))?.replace('Subject:', '').trim() ?? '';
  const from    = lines.find((l: string) => l.startsWith('From:'))?.replace('From:', '').trim() ?? '';
  const to      = lines.find((l: string) => l.startsWith('To:'))?.replace('To:', '').trim() ?? '';
  const cc      = lines.find((l: string) => l.startsWith('Cc:'))?.replace('Cc:', '').trim() ?? '';

  const blankIdx = lines.findIndex((l: string) => l.trim() === '');
  const body = blankIdx >= 0 ? lines.slice(blankIdx + 1).join('\n').trim() : text;

  return { subject, from, to, cc, body, raw_headers: {} };
}
