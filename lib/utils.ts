import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatYear(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export function mediaSrc(url?: string): string {
  if (!url) return "/placeholders/hero-bg.svg";
  return url;
}

// [자료 필요] 마커가 붙은 값은 아직 사용자가 확정하지 않은 자리표시자다.
// 관리자 화면에서는 그대로 보여 다음 작업을 알 수 있게 하되, 공개 화면에는
// 노출하지 않는다.
export function isPlaceholder(text?: string | null): boolean {
  // "[자료 필요]" 뿐 아니라 "[자료 필요 - 세부 내용...]"처럼 대괄호 안에
  // 추가 설명이 붙은 변형도 모두 잡아내야 하므로, 닫는 대괄호까지 정확히
  // 일치시키지 않고 "자료 필요"라는 핵심 문구만 포함되어 있는지 확인한다.
  return typeof text === "string" && text.includes("자료 필요");
}

/** 공개 화면 전용: 자리표시자면 빈 값으로 대체한다. */
export function safeText(text?: string | null): string {
  return isPlaceholder(text) ? "" : text ?? "";
}

// §71 — 일부 프로젝트는 "기획 및 제작 [자료 필요 - 세부 역할 구분]"처럼
// 실제로 채워진 문장 뒤에 참고용 대괄호 메모만 덧붙어 있었다. 예전
// isPlaceholder()는 문자열 전체에 "자료 필요"가 한 글자라도 섞여 있으면
// 통째로 공개 화면에서 숨겨버려서, 이미 채워진 본문까지 같이 사라지는
// 문제가 있었다(예: 치과 프로젝트의 "기여도" 섹션). 이제는 대괄호 메모
// 부분만 제거하고 실제 작성된 문장은 그대로 살린다.
export function stripPlaceholder(text?: string | null): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/\[[^\]]*자료\s*필요[^\]]*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
