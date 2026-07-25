import { cn } from "@/lib/utils";

/**
 * 줄바꿈(\n) 단위로 문장을 나눠 각 줄을 overflow-hidden 가림막 안에 넣습니다.
 * 단어/글자 단위로 쪼개 inline-block 처리하지 않으므로 한글 줄바꿈이
 * 부자연스러워지지 않습니다. 실제 애니메이션은 부모 컴포넌트가
 * [data-mask-line] 요소를 GSAP로 제어합니다.
 * accentLines: 강조색을 적용할 줄 번호(0부터 시작) 목록
 */
export function MaskLines({
  text, className, lineClassName, accentLines = [],
}: { text: string; className?: string; lineClassName?: string; accentLines?: number[] }) {
  const lines = text.split("\n");
  return (
    <span className={cn("block text-korean", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <span
            data-mask-line
            className={cn("block will-change-transform", accentLines.includes(i) && "accent-text", lineClassName)}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
