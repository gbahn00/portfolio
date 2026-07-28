// ============================================================================
// 폰트 커스터마이징 설정 (전체 구조 개편 명세서 §8)
//
// 폰트를 바꾸고 싶으면 이 파일에서 ACTIVE_* 값만 바꾸면 된다. 역할을 3가지로
// 나눴다 — 제목(title) / 본문(body) / 포인트(point, 숫자·강조 문구 등에 쓰는
// 포인트 폰트). 하나의 폰트만 쓰고 싶다면 세 값을 모두 같은 키로 두면 된다.
// layout.tsx가 여기서 CSS 링크 URL을 읽어와 <head>에 넣고, --font-title /
// --font-body / --font-point CSS 변수도 여기 값으로 채운다. globals.css와
// tailwind.config.ts는 항상 var(--font-title) 등만 참조한다.
// (--font-main은 이전 버전과의 호환을 위해 --font-body와 같은 값으로 유지한다.)
// ============================================================================

export type FontKey = "pretendard" | "suit" | "wantedSans" | "paperlogy";

interface FontConfig {
  /** 폰트를 불러올 stylesheet 링크 (CDN). 직접 폰트 파일을 /public/fonts 에 두고
   *  @font-face 로 선언하는 방식으로 바꾸고 싶다면 이 값을 빈 문자열로 두고
   *  globals.css에 @font-face를 추가하면 된다. */
  cssUrl: string;
  /** CSS font-family 값. 실제 폰트가 로드되기 전/실패 시를 위해 폴백도 함께 적는다. */
  family: string;
}

export const FONTS: Record<FontKey, FontConfig> = {
  pretendard: {
    cssUrl: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css",
    family: '"Pretendard", "SUIT", sans-serif',
  },
  suit: {
    cssUrl: "https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css",
    family: '"SUIT Variable", "Pretendard", sans-serif',
  },
  wantedSans: {
    cssUrl: "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css",
    family: '"Wanted Sans Variable", "Pretendard", sans-serif',
  },
  paperlogy: {
    cssUrl: "https://cdn.jsdelivr.net/gh/webfontworld/paperlogy@main/Paperlogy.css",
    family: '"Paperlogy", "Pretendard", sans-serif',
  },
};

/** 큰 제목류(hero-title, section-title 등)에 쓸 폰트. */
export const ACTIVE_TITLE_FONT: FontKey = "pretendard";
/** 본문/문단에 쓸 폰트. */
export const ACTIVE_BODY_FONT: FontKey = "pretendard";
/** 숫자·강조 문구(CountUp, accent-text 등)에 쓸 포인트 폰트. */
export const ACTIVE_POINT_FONT: FontKey = "pretendard";

/** 관리자 화면 "사이트 설정 > 타이포그래피"에서 고를 수 있는 목록에 쓰는
 *  한글 라벨. FONTS의 키와 1:1로 맞춰둔다. */
export const FONT_LABELS: Record<FontKey, string> = {
  pretendard: "Pretendard",
  suit: "SUIT",
  wantedSans: "Wanted Sans",
  paperlogy: "Paperlogy",
};

// §133 — "폰트를 관리자 화면에서 고를 수 있게 해달라"는 요청으로, 코드에
// 고정된 ACTIVE_TITLE_FONT/ACTIVE_BODY_FONT 대신 사이트 설정(content.
// settings.typography)에서 넘어온 값을 우선 쓰도록 바꿨다. 설정값이
// 없거나 목록에 없는 값이면 기존 ACTIVE_* 상수로 안전하게 되돌아간다 —
// 그래서 관리자가 아직 아무것도 고르지 않은 프로젝트(기존 데이터)는
// 예전과 똑같이 동작한다.
export function getActiveFontConfig(titleKey?: string, bodyKey?: string) {
  const resolvedTitleKey = titleKey && titleKey in FONTS ? (titleKey as FontKey) : ACTIVE_TITLE_FONT;
  const resolvedBodyKey = bodyKey && bodyKey in FONTS ? (bodyKey as FontKey) : ACTIVE_BODY_FONT;
  const title = FONTS[resolvedTitleKey];
  const body = FONTS[resolvedBodyKey];
  const point = FONTS[ACTIVE_POINT_FONT];
  // 서로 다른 CDN 링크만 중복 없이 모아서 <head>에 넣는다.
  const cssUrls = Array.from(new Set([title.cssUrl, body.cssUrl, point.cssUrl]));
  return { title, body, point, cssUrls };
}
