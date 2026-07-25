import { v4 as uuid } from "uuid";
import {
  SiteContent,
  Project,
  TimelineEntry,
  Competency,
  Achievement,
  Collaboration,
  FuturePlan,
  RevisionEntry,
  TrashEntry,
} from "../types";
import * as localStore from "./local-store";

// ============================================================================
// 콘텐츠 저장소 공통 인터페이스
// DATA_MODE=local (기본값) : content/site-content.json 파일 기반, 설치 즉시 동작
// DATA_MODE=supabase       : Supabase 프로젝트 연결 시 사용 (supabase/schema.sql 참고)
//
// 지금은 계정이 없는 상태이므로 local 모드로 전체 기능이 동작하도록 구현했습니다.
// 이후 Supabase 계정이 준비되면 .env 의 DATA_MODE 와 키 값만 채우면 되도록
// 함수 시그니처를 동일하게 유지했습니다. (supabase-store.ts 는 스키마와 함께
// 준비되어 있으나, 실제 프로젝트 연결 후 동작 확인이 필요합니다.)
// ============================================================================

function isLocalMode() {
  return (process.env.DATA_MODE ?? "local") !== "supabase";
}

export async function getContent(): Promise<SiteContent> {
  if (isLocalMode()) return localStore.readContent();
  const { getContentSupabase } = await import("./supabase-store");
  return getContentSupabase();
}

async function saveContent(content: SiteContent) {
  if (isLocalMode()) {
    await localStore.writeContent(content);
    return;
  }
  const { saveContentSupabase } = await import("./supabase-store");
  await saveContentSupabase(content);
}

export async function logRevision(entity: string, field: string, before: unknown, after: unknown, editor = "admin") {
  const entry: RevisionEntry = {
    id: uuid(),
    entity,
    field,
    before,
    after,
    editor,
    editedAt: new Date().toISOString(),
  };
  await localStore.appendRevision(entry);
}

export async function getRevisions() {
  return localStore.readRevisions();
}

export async function getTrash() {
  return localStore.readTrash();
}

// --------------------------------------------------------------------------
// 단일(싱글턴) 섹션 업데이트: settings, profile, hero, philosophy, ai, contributions, fitness, closing
// --------------------------------------------------------------------------
export async function updateSection<K extends keyof SiteContent>(
  key: K,
  patch: Partial<SiteContent[K]>,
  editor = "admin"
): Promise<SiteContent[K]> {
  const content = await getContent();
  const before = content[key];
  // 관리자 화면의 각 섹션 편집기는 항상 "현재 화면에 있는 전체 상태"를 그대로
  // 보낸다(부분 patch가 아니다). 그런데 이미지를 제거하면 그 필드 값이
  // undefined가 되고, JSON.stringify는 undefined 값을 가진 키를 요청 본문에서
  // 아예 빼버린다. 예전처럼 {...before, ...patch}로 얕은 병합을 하면 그렇게
  // 빠진 키는 "값이 없다"가 아니라 "이전 값을 유지"로 해석되어 삭제가
  // 저장되지 않았다. 편집기가 항상 전체 상태를 보낸다는 전제하에, patch를
  // 부분 병합하지 않고 그대로 최종 값으로 사용해 이 문제를 근본적으로 없앤다.
  const after = patch as SiteContent[K];
  content[key] = after;
  await saveContent(content);
  await logRevision(String(key), "전체", before, after, editor);
  return after;
}

// --------------------------------------------------------------------------
// 목록형 엔티티 공통 CRUD 헬퍼
// --------------------------------------------------------------------------
type ListKey = "timeline" | "projects" | "competencies" | "achievements" | "collaborations" | "futurePlans" | "faq";

function getList(content: SiteContent, key: ListKey): any[] {
  return content[key] as any[];
}

export async function listAdd<T extends { id: string; order: number }>(
  key: ListKey,
  item: Omit<T, "id" | "order"> & Partial<Pick<T, "id" | "order">>,
  editor = "admin"
): Promise<T> {
  const content = await getContent();
  const list = getList(content, key);
  const newItem = {
    ...item,
    id: item.id ?? uuid(),
    order: item.order ?? list.length,
  } as T;
  list.push(newItem);
  (content as any)[key] = list;
  await saveContent(content);
  await logRevision(`${key}:${newItem.id}`, "추가", null, newItem, editor);
  return newItem;
}

export async function listUpdate<T extends { id: string }>(
  key: ListKey,
  id: string,
  patch: Partial<T>,
  editor = "admin"
): Promise<T | null> {
  const content = await getContent();
  const list = getList(content, key);
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const before = list[idx];
  // updateSection과 동일한 이유로 부분 병합 대신 patch를 그대로 사용한다.
  // 목록 편집기(타임라인/프로젝트/역량/성과/협업/향후계획/FAQ)도 항상
  // 해당 항목의 전체 상태를 보내므로, 이미지 등 제거된 필드가 undefined ->
  // JSON 직렬화 시 키 자체가 사라지는 문제로 "이전 값 유지"가 되지 않게 한다.
  const after = { id, ...patch } as T;
  list[idx] = after;
  (content as any)[key] = list;
  await saveContent(content);
  await logRevision(`${key}:${id}`, "수정", before, after, editor);
  return after;
}

export async function listRemove(key: ListKey, id: string, editor = "admin"): Promise<boolean> {
  const content = await getContent();
  const list = getList(content, key);
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const [removed] = list.splice(idx, 1);
  (content as any)[key] = list;
  await saveContent(content);

  const trashEntry: TrashEntry = {
    id: uuid(),
    entity: key,
    originalId: id,
    data: removed,
    deletedAt: new Date().toISOString(),
    deletedBy: editor,
  };
  await localStore.moveToTrash(trashEntry);
  await logRevision(`${key}:${id}`, "삭제(휴지통 이동)", removed, null, editor);
  return true;
}

export async function listDuplicate<T extends { id: string; order: number }>(
  key: ListKey,
  id: string,
  editor = "admin"
): Promise<T | null> {
  const content = await getContent();
  const list = getList(content, key);
  const original = list.find((i) => i.id === id);
  if (!original) return null;
  const copy = { ...original, id: uuid(), order: list.length, title: original.title ? `${original.title} (복사본)` : undefined };
  list.push(copy);
  (content as any)[key] = list;
  await saveContent(content);
  await logRevision(`${key}:${copy.id}`, "복제", null, copy, editor);
  return copy;
}

export async function listReorder(key: ListKey, orderedIds: string[], editor = "admin"): Promise<void> {
  const content = await getContent();
  const list = getList(content, key);
  const map = new Map(list.map((i) => [i.id, i]));
  const reordered = orderedIds.map((id, idx) => {
    const item = map.get(id);
    if (item) item.order = idx;
    return item;
  }).filter(Boolean);
  // 목록에 없는 항목(방어)
  list.forEach((i) => {
    if (!orderedIds.includes(i.id)) reordered.push(i);
  });
  (content as any)[key] = reordered;
  await saveContent(content);
  await logRevision(key, "순서 변경", null, orderedIds, editor);
}

export async function restoreTrashItem(trashId: string, editor = "admin"): Promise<boolean> {
  const item = await localStore.restoreFromTrash(trashId);
  if (!item) return false;
  const content = await getContent();
  const key = item.entity as ListKey;
  const list = getList(content, key);
  list.push(item.data);
  (content as any)[key] = list;
  await saveContent(content);
  await logRevision(`${key}:${item.originalId}`, "휴지통 복구", null, item.data, editor);
  return true;
}

export async function purgeTrashItem(trashId: string): Promise<void> {
  await localStore.purgeTrashItem(trashId);
}

export async function exportBackup() {
  return localStore.exportBackup();
}

// 편의 타입 export
export type { Project, TimelineEntry, Competency, Achievement, Collaboration, FuturePlan };
