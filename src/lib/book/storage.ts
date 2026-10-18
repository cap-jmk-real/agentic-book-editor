import type { AuditState, BookState } from "./types";
import { AUDIT_STORAGE_KEY, BOOK_STORAGE_KEY, seedAudit, seedBook } from "./seed";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBook(): BookState {
  const stored = readJson<BookState>(BOOK_STORAGE_KEY);
  if (stored?.chapters?.length) return stored;
  const seed = seedBook();
  writeJson(BOOK_STORAGE_KEY, seed);
  return seed;
}

export function saveBook(book: BookState) {
  writeJson(BOOK_STORAGE_KEY, book);
}

export function loadAudit(): AuditState {
  const stored = readJson<AuditState>(AUDIT_STORAGE_KEY);
  if (stored?.findings) return stored;
  const seed: AuditState = { findings: seedAudit(), lastRunAt: null };
  writeJson(AUDIT_STORAGE_KEY, seed);
  return seed;
}

export function saveAudit(audit: AuditState) {
  writeJson(AUDIT_STORAGE_KEY, audit);
}
