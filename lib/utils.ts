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

// §102 — "사진이 전체적으로 보여지는 게 느리다"는 신고. components/ui/
// MediaFrame.tsx(next/image 사용)를 거치는 사진은 이미 Next.js가 알아서
// 화면 크기에 맞게 리사이즈·압축해서 내려주는데, 갤러리/보정전후/히어로/
// 대표사진처럼 "높이만 고정하고 폭은 원본 비율대로"처럼 자유로운 크기가
// 필요해서 next/image 대신 평범한 <img> 태그를 쓰는 곳들은 이 최적화를
// 전혀 거치지 않고 관리자가 올린 원본 파일(카메라 원본이면 수 MB~수십
// MB)을 그대로 내려받고 있었다 — 이게 "느리다"의 실제 원인일 가능성이
// 크다. <img> 태그 구조·CSS는 그대로 두면서, 이 함수로 감싼 URL만
// Next.js의 내장 이미지 최적화 API(/_next/image)를 거치도록 바꿔
// 리사이즈·압축된 버전을 받게 한다.
//
// MediaFrame(next/image)에는 쓰지 않는다 — 거기서 또 이 URL을 다시
// next/image에 넣으면 이미 한 번 최적화된 이미지를 다시 최적화하는
// 이중 처리가 된다. 영상 파일(mp4 등)도 이미지 최적화 API 대상이
// 아니므로 원본 URL을 그대로 반환한다.
// next.config.js에서 images.deviceSizes/imageSizes를 따로 지정하지 않아
// Next.js 기본값을 쓴다 — /_next/image는 w 파라미터가 이 두 목록을 합친
// 값 중 하나가 아니면 400을 반환하므로, 여기서도 그대로 맞춰둔다.
const NEXT_IMAGE_VALID_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

export function optimizedImageSrc(url?: string, width = 1200): string {
  const src = mediaSrc(url);
  // 로컬 정적 파일(placeholder svg 등)이나 영상 파일은 최적화 대상이
  // 아니므로 그대로 반환한다. §120 — gif도 제외한다. Next.js 이미지
  // 최적화를 거치면 움직이는 gif가 첫 프레임만 남은 정지 이미지로
  // 바뀌어버리기 때문이다.
  if (src.endsWith(".svg") || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src) || /\.gif(\?.*)?$/i.test(src)) return src;
  const w = NEXT_IMAGE_VALID_WIDTHS.reduce((best, cur) =>
    Math.abs(cur - width) < Math.abs(best - width) ? cur : best
  );
  // 사진/영상 포트폴리오라 화질이 중요해서 압축 강도는 보수적으로(q=82)
  // 잡았다 — 용량은 원본 대비 크게 줄이면서도 화질 저하가 눈에 띄지
  // 않는 선이다.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=82`;
}

// §148 — "화면 크기에 맞는 적절한 이미지 크기를 자동으로 제공, 불필요하게
// 큰 이미지를 다운로드하지 않도록"라는 성능 최적화 요청. optimizedImageSrc()
// 하나만 쓰면 <img src>는 항상 같은(가장 큰) 폭 하나만 받아오므로, 실제로는
// 작게 표시되는 화면(예: 모바일)에서도 데스크톱용 큰 파일을 그대로
// 내려받는다. 이 함수는 여러 폭의 후보를 만들어 <img srcSet>으로 넘기면,
// 브라우저가 실제 표시 크기·화면 배율(DPR)에 맞는 가장 작은 후보를 알아서
// 골라 받는다 — 화질/원본 비율은 그대로 유지된 채 전송량만 줄어든다.
// next/image(MediaFrame)는 이미 내부적으로 이 일을 자동으로 해주므로 이
// 함수는 쓰지 않는다 — raw <img> 태그를 쓰는 곳(히어로, 갤러리, 보정 전후,
// 대표 이미지 등)에서만 사용한다.
export function optimizedImageSrcSet(url?: string, widths: number[] = [640, 828, 1080, 1200, 1920]): string {
  const src = mediaSrc(url);
  if (src.endsWith(".svg") || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src) || /\.gif(\?.*)?$/i.test(src)) return "";
  return widths
    .map((w) => {
      const snapped = NEXT_IMAGE_VALID_WIDTHS.reduce((best, cur) => (Math.abs(cur - w) < Math.abs(best - w) ? cur : best));
      return `/_next/image?url=${encodeURIComponent(src)}&w=${snapped}&q=82 ${snapped}w`;
    })
    .join(", ");
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
