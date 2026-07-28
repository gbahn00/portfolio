// §153 — 웹 사이트 각 섹션이 공통으로 쓰는 "작은 강조색 라벨 + 큰 제목"
// 패턴(예: SelectedWork.tsx, FuturePlans.tsx, Faq.tsx)을 PDF에도 그대로
// 재사용한다. accent-text/section-title은 globals.css에 이미 정의된
// 사이트 공통 클래스라, 관리자가 나중에 강조색이나 폰트를 바꾸면 PDF도
// 자동으로 같이 바뀐다.
export function PrintHeading({ kicker, title }: { kicker: string; title: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="accent-text text-sm font-medium mb-3 tracking-wide">{kicker}</p>
      <h2 className="text-3xl md:text-4xl font-bold text-korean leading-tight">{title}</h2>
    </div>
  );
}
