import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Block path traversal
  if (!id || id.includes('..') || id.includes('/')) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  try {
    const raw = await fs.readFile(path.join(DATA_CASES, `${id}.json`), 'utf-8');
    const case_json = JSON.parse(raw);
    return NextResponse.json({ case_json });
  } catch {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
}
