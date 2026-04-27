import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

export function normalizeQuotesArray(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { quotes?: unknown }).quotes)) {
    return (raw as { quotes: any[] }).quotes;
  }
  return [];
}

export async function readQuotesArray() {
  const raw = await readDataFile<unknown>('quotes.json', []);
  return normalizeQuotesArray(raw);
}

export async function writeQuotesArray(quotes: any[]) {
  await writeDataFile('quotes.json', quotes);
}

export async function readQuoteRequestsArray() {
  const raw = await readDataFile<unknown>('quote-requests.json', []);
  return Array.isArray(raw) ? (raw as any[]) : [];
}

export async function writeQuoteRequestsArray(requests: any[]) {
  await writeDataFile('quote-requests.json', requests);
}
