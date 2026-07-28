import Image from "next/image";
import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MediaFrame({
  media,
  className,
  sizes = "100vw",
  priority = false,
  fit = "cover",
}: {
  media?: MediaRef;
  className?: string;
  sizes?: string;
  priority?: boolean;
  // §142 — "상세페이지 본문 이미지(프로젝트 개요·제작 의도·기여도·Tools에
  // 곁들이는 사진)의 중요한 영역이 잘리지 않도록 해달라"는 요청. 이
  // 컴포넌트는 히어로/카드/썸네일 등 사이트 전반에서 두루 쓰여서
  // object-cover(고정 비율 박스를 꽉 채우며 필요하면 자르는 방식)가
  // 대부분 맞는 기본값이지만(예: 대표 커버, 목록 카드), 본문에 곁들이는
  // 사진은 잘리면 안 되므로 그 호출부만 fit="contain"으로 넘겨쓴다.
  fit?: "cover" | "contain";
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
        className={fit === "contain" ? "object-contain" : "object-cover"}
        style={{ filter: "brightness(0.9) contrast(1.05)" }}
      />
    </div>
  );
}
