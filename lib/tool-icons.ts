// ============================================================================
// §137 — "Tools는 자유 텍스트가 아니라 Skill 페이지에 등록된 아이콘을
// 선택하는 방식으로 바꿔달라"는 요청. 원래 components/sections/
// ProfileSection.tsx 안에만 있던 TOOL_ICON_MAP/SKILL_DISPLAY_ORDER를 이
// 공용 파일로 옮겨서, 프로필의 "핵심 수치 → Skills" 목록과 프로젝트
// 상세페이지의 "Tools" 아이콘 선택이 항상 같은 소스를 가리키게 했다 —
// 이름을 그대로 두면(예: 여기서 아이콘 경로를 바꾸면) 두 화면 모두에
// 자동으로 반영된다("Skill 페이지에서 수정된 아이콘은 상세페이지에도
// 자동으로 반영한다").
// ============================================================================
export const TOOL_ICON_MAP: Record<string, string> = {
  Photoshop: "/icons/tools/photoshop.png",
  "Premiere Pro": "/icons/tools/premiere.png",
  CapCut: "/icons/tools/capcut.png",
  "생성형 AI": "/icons/tools/ai-tool.png",
  Illustrator: "/icons/tools/illustrator.png",
  "After Effects": "/icons/tools/after-effects.png",
};

// §54 — 항상 "포토샵/프리미어프로 → 일러스트레이터/애프터이펙트 →
// 캡컷/생성형 AI" 순서로 보이도록 지정한 고정 우선순위 목록. 목록에 없는
// 새 이름은 맨 뒤로 간다.
export const TOOL_ICON_ORDER = ["Photoshop", "Premiere Pro", "Illustrator", "After Effects", "CapCut", "생성형 AI"];

export function sortByToolIconOrder(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ai = TOOL_ICON_ORDER.indexOf(a);
    const bi = TOOL_ICON_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}
