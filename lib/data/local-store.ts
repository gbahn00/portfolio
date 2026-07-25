import fs from "node:fs/promises";
import path from "node:path";
import { SiteContent, RevisionEntry, TrashEntry } from "../types";

// ============================================================================
// 로컬 파일 기반 콘텐츠 저장소 (DATA_MODE=local)
// Supabase 없이 바로 실행할 수 있도록 content/site-content.json 파일에
// 전체 콘텐츠를 저장합니다. 구조는 supabase/schema.sql 과 동일한 개념을 따르므로
// 이후 Supabase로 전환할 때 데이터를 그대로 옮길 수 있습니다.
// ============================================================================

const CONTENT_DIR = path.join(process.cwd(), "content");
const DATA_FILE = path.join(CONTENT_DIR, "site-content.json");
const REVISIONS_FILE = path.join(CONTENT_DIR, "revisions.json");
const TRASH_FILE = path.join(CONTENT_DIR, "trash.json");
const SEED_FILE = path.join(CONTENT_DIR, "seed.json");

async function ensureFile(file: string, fallback: string) {
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, fallback, "utf-8");
  }
}

export async function readContent(): Promise<SiteContent> {
  await ensureFile(DATA_FILE, await seedFallback());
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as SiteContent;
}

async function seedFallback(): Promise<string> {
  try {
    return await fs.readFile(SEED_FILE, "utf-8");
  } catch {
    return "{}";
  }
}

export async function writeContent(content: SiteContent): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(content, null, 2), "utf-8");
}

export async function readRevisions(): Promise<RevisionEntry[]> {
  await ensureFile(REVISIONS_FILE, "[]");
  const raw = await fs.readFile(REVISIONS_FILE, "utf-8");
  return JSON.parse(raw) as RevisionEntry[];
}

export async function appendRevision(entry: RevisionEntry): Promise<void> {
  const list = await readRevisions();
  list.unshift(entry);
  await fs.writeFile(REVISIONS_FILE, JSON.stringify(list.slice(0, 500), null, 2), "utf-8");
}

export async function readTrash(): Promise<TrashEntry[]> {
  await ensureFile(TRASH_FILE, "[]");
  const raw = await fs.readFile(TRASH_FILE, "utf-8");
  return JSON.parse(raw) as TrashEntry[];
}

export async function writeTrash(list: TrashEntry[]): Promise<void> {
  await fs.writeFile(TRASH_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export async function moveToTrash(entry: TrashEntry): Promise<void> {
  const list = await readTrash();
  list.unshift(entry);
  await writeTrash(list);
}

export async function restoreFromTrash(trashId: string): Promise<TrashEntry | null> {
  const list = await readTrash();
  const idx = list.findIndex((t) => t.id === trashId);
  if (idx === -1) return null;
  const [item] = list.splice(idx, 1);
  await writeTrash(list);
  return item;
}

export async function purgeTrashItem(trashId: string): Promise<void> {
  const list = await readTrash();
  await writeTrash(list.filter((t) => t.id !== trashId));
}

export async function exportBackup(): Promise<{ content: SiteContent; revisions: RevisionEntry[]; trash: TrashEntry[] }> {
  const [content, revisions, trash] = await Promise.all([readContent(), readRevisions(), readTrash()]);
  return { content, revisions, trash };
}
