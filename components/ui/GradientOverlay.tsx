// §156 — "모든 프로젝트 상세페이지 대표화면에 동일한 검정색 그라데이션을
// 적용" 요청. 프로젝트마다 그라데이션 코드를 새로 쓰지 않도록 공통
// 컴포넌트로 뒀다(현재는 ProjectCover에서 사용).
//
// 요청된 명암 기준(위→아래로 갈수록 진해짐)을 그대로 옮겼다:
//   상단 0~35%   : 검정 불투명도 0~5%
//   중간 35~65%  : 검정 불투명도 10~35%
//   하단 65~100% : 검정 불투명도 60~90%
// 이미지/영상 원본은 건드리지 않고 이 오버레이 레이어만 위에 얹는다.
export function GradientOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background:
          "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.02) 100%)",
      }}
    />
  );
}
