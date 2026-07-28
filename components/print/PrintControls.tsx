"use client";

import Link from "next/link";

// §153 — 관리자가 실제로 PDF를 받는 지점. 서버가 파일을 만들어주는 대신,
// 브라우저 자체의 "인쇄 → PDF로 저장" 기능을 그대로 이용한다(사이트
// CSS를 그대로 재사용해 디자인이 100% 동일하고, 무거운 서버 헤드리스
// 브라우저를 배포에 추가할 필요가 없다). no-print 클래스가 있어 이
// 툴바 자체는 실제 인쇄/PDF 결과물에는 나오지 않는다.
export function PrintControls() {
  return (
    <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-neutral-900 border-b border-neutral-800 px-5 py-3 text-sm text-neutral-200">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
          ← 관리자 홈
        </Link>
        <span className="text-neutral-500">
          아래 버튼을 누르면 인쇄 대화상자가 열립니다. 대상(프린터)을{" "}
          <strong className="text-neutral-200">PDF로 저장</strong>으로 선택하면 PDF 파일로 저장됩니다. 방향은{" "}
          <strong className="text-neutral-200">가로(Landscape)</strong>로 자동 지정되어 있습니다 — 혹시 세로로
          바뀌어 있다면 인쇄 설정의 "방향"을 가로로 바꿔주세요.
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="shrink-0 rounded-md px-4 py-2 font-medium text-white transition-colors"
        style={{ background: "var(--accent, #EB613B)" }}
      >
        PDF로 저장 / 인쇄
      </button>
    </div>
  );
}
