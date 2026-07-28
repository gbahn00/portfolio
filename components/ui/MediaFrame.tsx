import Image from "next/image";
import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MediaFrame({
  media,
  className,
  sizes = "100vw",
  priority = false,
}: {
  media?: MediaRef;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!media) return null;
  const isSvg = media.url.endsWith(".svg");
  return (
    <div className={cn("relative overflow-hidden bg-bg-soft", className)}>
      {/* §101 — 연도 탭(업무 성장과정)을 넘길 때 이전 연도 사진이 잠깐
          남아있다가 새 사진으로 바뀌는 문제가 있었다. 부모가 media를
          바꿔도 이 <Image>는 같은 DOM 요소를 재사용해 src만 바뀌는데,
          새 이미지가 다 로드되기 전까지 브라우저가 이전 이미지를 화면에
          계속 붙들고 있는 경우가 있었다. key를 URL에 연결해 매체가
          바뀔 때마다 요소를 완전히 새로 만들도록 해서, 이전 사진이
          남아있는 채로 다음 사진과 겹쳐 보이는 일이 없게 했다. */}
      <Image
        key={mediaSrc(media.url)}
        src={mediaSrc(media.url)}
        alt={media.alt || ""}
        fill
        unoptimized={isSvg}
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ filter: "brightness(0.9) contrast(1.05)" }}
      />
    </div>
  );
}
