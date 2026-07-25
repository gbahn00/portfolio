import fs from "node:fs/promises";
import path from "node:path";
import { SiteContent, RevisionEntry, TrashEntry } from "../types";

// ============================================================================
// 로컬 파일 기반 콘텐츠 저장소 (DATA_MODE=local)
// Supabase 없이 바로 실행할 수 있도록 content/site-content.json 파일에
// 전체 콘텐츠를 저장합니다. 구조는 supabase/schema.sql 과 동일한 개념을 따르므로
// 이후 Supabase로 전환할 때 데이터를 그대로 옮길 수 있습니다.
//
// 주의: Vercel 등 서버리스 배포 환경은 배포된 파일시스템이 read-only 입니다.
// 파일이 이미 존재하면 정상적으로 읽을 수 있지만, 파일이 없어서 새로 만들어야
// 하는 상황(ensureFile의 쓰기)은 실패할 수 있습니다. 이런 환경에서도 사이트가
// 죽지 않도록, 쓰기가 실패하면 메모리상의 대체 콘텐츠로 조용히 폴백합니다.
// (읽기 전용 배포에서는 관리자 편집 내용이 영구 저장되지 않는다는 한계는
// 여전히 남아있습니다 — 영구 저장이 필요하면 DATA_MODE=supabase로 전환하세요.)
// ============================================================================

const CONTENT_DIR = path.join(process.cwd(), "content");
const DATA_FILE = path.join(CONTENT_DIR, "site-content.json");
const REVISIONS_FILE = path.join(CONTENT_DIR, "revisions.json");
const TRASH_FILE = path.join(CONTENT_DIR, "trash.json");
const SEED_FILE = path.join(CONTENT_DIR, "seed.json");

async function ensureFile(file: string, fallback: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, fallback, "utf-8");
      return true;
    } catch {
      // 읽기 전용 파일시스템(예: Vercel 서버리스) — 디스크에 만들 수 없으므로
      // 호출부에서 fallback 문자열을 그대로 메모리에서 사용하게 한다.
      return false;
    }
  }
}

export async function readContent(): Promise<SiteContent> {
  const seed = await seedFallback();
  const created = await ensureFile(DATA_FILE, seed);
  if (!created) {
    return JSON.parse(seed) as SiteContent;
  }
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch {
    return JSON.parse(seed) as SiteContent;
  }
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
  const created = await ensureFile(REVISIONS_FILE, "[]");
  if (!created) return [];
  try {
    const raw = await fs.readFile(REVISIONS_FILE, "utf-8");
    return JSON.parse(raw) as RevisionEntry[];
  } catch {
    return [];
  }
}

export async function appendRevision(entry: RevisionEntry): Promise<void> {
  const list = await readRevisions();
  list.unshift(entry);
  await fs.writeFile(REVISIONS_FILE, JSON.stringify(list.slice(0, 500), null, 2), "utf-8");
}

export async function readTrash(): Promise<TrashEntry[]> {
  const created = await ensureFile(TRASH_FILE, "[]");
  if (!created) return [];
  try {
    const raw = await fs.readFile(TRASH_FILE, "utf-8");
    return JSON.parse(raw) as TrashEntry[];
  } catch {
    return [];
  }
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
