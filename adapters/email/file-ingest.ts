import * as fs from 'fs/promises';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const INBOUND_DIR = process.env.INBOUND_EMAIL_DIR
  ? path.resolve(process.env.INBOUND_EMAIL_DIR)
  : path.join(PROJECT_ROOT, 'inbound_emails');

/** Returns absolute paths to all .eml and .txt files in the drop zone. */
export async function listInboundEmails(): Promise<string[]> {
  try {
    const entries = await fs.readdir(INBOUND_DIR);
    return entries
      .filter((f: string) => f.endsWith('.eml') || f.endsWith('.txt'))
      .map((f: string) => path.join(INBOUND_DIR, f));
  } catch {
    return [];
  }
}

/**
 * Resolve an email file path safely.
 * Accepts:
 *   - Absolute paths
 *   - Filenames relative to inbound_emails/
 *   - Filenames relative to samples/emails/
 */
export async function getEmailPath(filePathOrName: string): Promise<string> {
  if (path.isAbsolute(filePathOrName)) {
    await fs.access(filePathOrName);
    return filePathOrName;
  }

  const inboundPath = path.join(INBOUND_DIR, filePathOrName);
  try {
    await fs.access(inboundPath);
    return inboundPath;
  } catch { /* fall through */ }

  const samplePath = path.join(PROJECT_ROOT, 'samples', 'emails', filePathOrName);
  await fs.access(samplePath);
  return samplePath;
}
