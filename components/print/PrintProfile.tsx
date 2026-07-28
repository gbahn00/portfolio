import { Profile, PhilosophySection, Competency } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { TOOL_ICON_MAP, TOOL_ICON_ORDER } from "@/lib/tool-icons";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §153 — 웹의 "02.프로필" 섹션은 소개/핵심 수치/업무 역량 3개 탭으로
// 나뉘어 한 번에 하나씩만 보이지만, 인쇄물은 탭을 넘길 수 없으므로 세
// 탭의 내용을 전부 세로로 이어서 보여준다(데이터는 동일, 화면 표시
// 방식만 인쇄물에 맞게 바꿨다).
export function PrintProfile({
  profile,
  philosophy,
  competencies,
}: {
  profile: Profile;
  philosophy: PhilosophySection;
  competencies: Competency[];
}) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);
  const facts = [...profile.keyFacts].sort((a, b) => a.order - b.order);
  const skills = [...(profile.toolSkills ?? [])]
    .filter((s) => s.name)
    .sort((a, b) => {
      const ai = TOOL_ICON_ORDER.indexOf(a.name);
      const bi = TOOL_ICON_ORDER.indexOf(b.name);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  const skillList = competencies.slice(0, 5);

  return (
    <PrintPage>
      <PrintHeading kicker="Profile" title={profile.representativePhrase || "프로필"} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-10 mb-10 print-avoid-break">
        {profile.profilePhoto?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedImageSrc(profile.profilePhoto.url, 1080)}
            alt={profile.profilePhoto.alt || ""}
            className="w-full h-auto rounded-sm object-contain"
          />
        )}
        <div className="min-w-0">
          {paragraphs.length > 0 && (
            <div className="space-y-2 mb-4">
              {paragraphs.map((p) => (
                <p key={p.id} className="body-large text-ink-secondary text-korean whitespace-pre-line">
                  {p.text}
                </p>
              ))}
            </div>
          )}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {keywords.map((k) => (
                <span key={k.id} className="text-xs rounded-full border border-line px-3 py-1 text-ink-muted text-korean">
                  #{k.text}
                </span>
              ))}
            </div>
          )}
          {facts.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-4">
                  <span className="block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                  <p className="text-korean text-sm text-ink-secondary font-semibold shrink-0 w-24">{f.label}</p>
                  <p className="text-korean text-ink text-sm">{f.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mb-10 print-avoid-break">
          <p className="font-en text-sm text-ink-muted mb-4 tracking-wide">Skills</p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                {TOOL_ICON_MAP[s.name] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={TOOL_ICON_MAP[s.name]} alt={s.name} className="h-9 w-9 rounded-md object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-korean text-xs text-ink-secondary font-semibold truncate">{s.name}</span>
                    <span className="font-en text-xs tabular-nums font-semibold text-ink shrink-0">{s.percentage}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, s.percentage))}%`, background: "var(--accent)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skillList.length > 0 && (
        <div className="print-avoid-break">
          <p className="font-en text-sm text-ink-muted mb-4 tracking-wide">업무 역량</p>
          <div className="flex flex-col gap-4">
            {skillList.map((c, i) => (
              <div key={c.id} className="flex gap-4">
                <span className="font-en text-sm tabular-nums shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold mb-1 text-korean whitespace-pre-line">{c.title}</h3>
                  <p className="text-ink-secondary text-sm leading-relaxed text-korean whitespace-pre-line">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PrintPage>
  );
}
