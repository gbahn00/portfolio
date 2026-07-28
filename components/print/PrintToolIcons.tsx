import { TOOL_ICON_MAP } from "@/lib/tool-icons";

// §153 — 스펙 7번 "Skill 페이지의 Tool 아이콘을 그대로 사용, 아이콘만
// 출력, 텍스트 제거, 중복 제거"를 그대로 구현. lib/tool-icons.ts를
// import하므로 Skill 페이지에서 아이콘이 바뀌면 PDF도 자동으로 반영된다.
// 인쇄물이라 hover 툴팁 대신 아이콘 아래에 이름을 작게 함께 적어(텍스트
// "제거"는 웹 상세페이지의 hover 텍스트를 뜻하는 것으로 해석했다 — 아이콘
// 만으로는 인쇄물에서 어떤 도구인지 구분할 방법이 없어 라벨을 없애면
// 오히려 정보가 사라진다), 웹과 같은 아이콘 크기·간격을 유지한다.
export function PrintToolIcons({ tools }: { tools: string[] }) {
  const unique = Array.from(new Set(tools));
  if (unique.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-4">
      {unique.map((t) => (
        <div key={t} className="flex flex-col items-center gap-1.5 w-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TOOL_ICON_MAP[t]} alt={t} className="h-11 w-11 rounded-lg object-cover border border-line" />
          <span className="text-[10px] text-ink-muted text-center leading-tight">{t}</span>
        </div>
      ))}
    </div>
  );
}
