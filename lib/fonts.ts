// ============================================================================
// 폰트 커스터마이징 설정 (10라운드 명세서 §3)
//
// 폰트를 바꾸고 싶으면 이 파일에서 ACTIVE_FONT 값 하나만 바꾸면 된다.
// 코드 안에서 폰트 이름을 직접 하드코딩하는 곳이 없도록, layout.tsx가 여기서
// CSS 링크 URL을 읽어와 <head>에 넣고, --font-main / --font-title CSS
// 변수도 여기 값으로 채운다. globals.css와 tailwind.config.ts는 항상
// var(--font-main) / var(--font-title)만 참조한다.
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

/** 지금 사이트 전체에 적용할 폰트. 이 값만 바꾸면 전체 반영된다. */
export const ACTIVE_FONT: FontKey = "pretendard";

/** 제목류에 쓸 폰트. 본문과 다른 폰트를 쓰고 싶지 않으면 ACTIVE_FONT와 같은 값으로 둔다. */
export const ACTIVE_TITLE_FONT: FontKey = "pretendard";

export function getActiveFontConfig() {
  return {
    main: FONTS[ACTIVE_FONT],
    title: FONTS[ACTIVE_TITLE_FONT],
  };
}
