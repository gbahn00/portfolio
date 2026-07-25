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
      <Image
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
