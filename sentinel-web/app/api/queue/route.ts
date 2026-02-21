import * as fs from 'fs/promises';
import * as path from 'path';
import { NextResponse } from 'next/server';
import type { QueueRecord } from '@/lib/case-types';

const DATA_QUEUE = path.join(process.cwd(), '..', 'data', 'queue', 'queue.json');

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_QUEUE, 'utf-8');
    return NextResponse.json(JSON.parse(raw) as QueueRecord[]);
  } catch {
    return NextResponse.json([] as QueueRecord[]);
  }
}
