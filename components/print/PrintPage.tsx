// §153 — Admin PDF Export 문서를 이루는 "페이지 한 장" 단위 래퍼.
// 화면 미리보기에서는 점선 테두리로 낱장을 구분해서 보여주고, 실제
// 인쇄/PDF 저장 시에는 globals.css의 .print-page 규칙이 이 경계를 그대로
// 페이지 나눔(page-break)으로 바꾼다 — 컴포넌트 쪽에서는 신경 쓸 게 없다.
export function PrintPage({
  children,
  className = "",
  center = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** true면 세로 가운데 정렬(표지·마지막 페이지처럼 내용이 짧은 페이지용) */
  center?: boolean;
}) {
  return (
    <section className={`print-page ${center ? "justify-center" : "justify-start"} ${className}`}>
      {children}
    </section>
  );
}
