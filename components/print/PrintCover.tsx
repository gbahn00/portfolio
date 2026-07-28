import { HeroSection, MediaRef } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintPage } from "./PrintPage";

// §153 — PDF 1페이지 "메인 페이지". 영상은 인쇄물에 넣지 않고(스펙 5번)
// poster 이미지를, 없으면 배경 이미지를 대신 쓴다.
export function PrintCover({ hero, fallbackImage }: { hero: HeroSection; fallbackImage?: MediaRef }) {
  const coverImage = hero.backgroundVideo?.poster
    ? { url: hero.backgroundVideo.poster }
    : hero.backgroundImage || fallbackImage;

  return (
    <PrintPage center className="relative overflow-hidden">
      {coverImage?.url && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizedImageSrc(coverImage.url, 1920)}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.55) contrast(1.05)" }}
          />
        </div>
      )}
      <div className="relative z-10">
        <p className="accent-text text-sm font-medium mb-4 tracking-wide">{hero.badge}</p>
        <h1 className="hero-title font-bold text-korean whitespace-pre-line mb-6">{hero.headline}</h1>
        <p className="text-korean text-ink-secondary body-large max-w-md whitespace-pre-line mb-10">{hero.subline}</p>
        <p className="text-sm md:text-base text-ink-secondary text-korean">
          {hero.name} · {hero.role} · {hero.department}
        </p>
      </div>
    </PrintPage>
  );
}
