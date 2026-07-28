"use client";

import { useEffect, useRef, useState } from "react";
import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §124 — 상세 페이지에 "상세 이미지(갤러리)"와는 별도로, 영상만 모아서
// 보여주는 "Contents" 영역을 새로 만들었다. 여러 편이 있을 때 기존
// 갤러리처럼 가로로 자동/화살표 슬라이드하는 대신, 마우스(또는 터치)로
// 직접 드래그해서 넘겨보는 방식으로 요청받았다 — PointerEvent 하나로
// 마우스 드래그와 터치 스와이프를 동시에 처리한다.
//
// §125 — 두 가지를 더 손봤다.
// 1) 처음엔 영상 한 편이 화면 폭을 꽉 채우는 큰 슬라이드로 만들었는데,
//    "상세 이미지처럼 크기를 좀 줄이고 여러 개가 동시에 보이면 좋겠다"는
//    요청으로, GalleryGrid(§69)와 똑같이 "높이만 고정, 폭은 원본 비율"인
//    작은 박스를 가로로 늘어놓는 방식으로 바꿨다. 인덱스 단위로 한 장씩
//    스냅 전환하던 방식 대신, 드래그한 만큼 트랙이 그대로 따라오는
//    자유 드래그-스크롤(팬) 방식으로 바꿨다 — 잡아 끄는 동안 여러 영상이
//    자연스럽게 옆에서 나타난다.
// 2) 드래그 가능함을 알려주는 "Drag" 배지 배경을 bg-accent(존재하지 않는
//    클래스라 아무 색도 안 나가고 있었다)에서 globals.css의 .accent-bg
//    (사이트 강조색 CSS 변수 --accent)로 바꿔 실제로 강조색이 나오게
//    했다.
//
// §126 — 영상이 몇 개 안 돼서 트랙 전체 폭이 보이는 영역보다 좁으면(=
// 끌어도 움직일 게 없으면) "Drag" 배지도, 커서를 숨기는 것도 의미가
// 없다. minOffset(끌 수 있는 최대 거리)이 0이면(=넘치는 폭이 없으면)
// canDrag를 false로 두어 배지 자체를 아예 렌더링하지 않는다.
// ============================================================================

const ITEM_HEIGHT_CLASS = "h-72 sm:h-80 md:h-96"; // GalleryGrid와 동일한 높이 기준
const GAP_PX = 16;

export function ContentsCarousel({ items }: { items: MediaRef[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [minOffset, setMinOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [canHover, setCanHover] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // §125 — 트랙(영상들)의 실제 폭과 보이는 영역의 폭 차이만큼만 드래그로
  // 움직일 수 있게 한다(그 이상 끌면 빈 배경만 보이므로 막는다). 영상
  // 로드 후 폭이 늦게 확정되는 경우를 대비해 ResizeObserver로 계속
  // 다시 잰다.
  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;
    function measure() {
      const max = Math.max(0, (track as HTMLDivElement).scrollWidth - (container as HTMLDivElement).clientWidth);
      setMinOffset(-max);
      setOffset((o) => Math.min(0, Math.max(-max, o)));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(container);
    return () => ro.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  const canDrag = minOffset < 0;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offset;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (canHover && canDrag) setHoverPos({ x: e.clientX, y: e.clientY });
    if (!dragging) return;
    const delta = e.clientX - dragStartXRef.current;
    const next = Math.min(0, Math.max(minOffset, dragStartOffsetRef.current + delta));
    setOffset(next);
  }

  // §149 — "Drag 배지가 떠 있을 때 영상 아무 곳이나 누르면 재생/일시정지"
  // 요청. 이 컨테이너는 이미 드래그(팬) 제스처를 pointerdown~up으로
  // 처리하고 있어서, 진짜로 끌지 않고 살짝 눌렀다 뗀 경우(=클릭/탭)만
  // "재생 토글"로 취급해야 드래그 동작과 충돌하지 않는다. 포인터를 뗀
  // 위치가 처음 누른 위치에서 6px 이상 움직이지 않았으면 클릭으로 본다.
  // 네이티브 컨트롤 바(탐색바·음량·전체화면 버튼)를 누른 경우까지 이
  // 토글이 가로채면 그 버튼들이 안 먹으므로, 영상 하단 컨트롤 바 높이만큼은
  // 제외하고 그 위쪽(영상 화면 부분)을 눌렀을 때만 토글한다.
  const CONTROL_BAR_H = 40;

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const moved = Math.abs(e.clientX - dragStartXRef.current);
    setDragging(false);
    if (!canHover || !canDrag || moved >= 6) return;
    const video = (e.target as HTMLElement).closest("video") as HTMLVideoElement | null;
    if (!video) return;
    const rect = video.getBoundingClientRect();
    if (e.clientY > rect.bottom - CONTROL_BAR_H) return; // 컨트롤 바 영역은 그대로 둔다
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function endDrag() {
    setDragging(false);
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden touch-pan-y"
        style={{ cursor: canHover && canDrag ? "none" : undefined }}
        onPointerDown={canDrag ? handlePointerDown : undefined}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={endDrag}
        onMouseEnter={(e) => canHover && canDrag && setHoverPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHoverPos(null)}
      >
        <div
          ref={trackRef}
          className={`flex ${ITEM_HEIGHT_CLASS} w-max select-none`}
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? "none" : "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {items.map((m, i) => (
            <div
              key={i}
              className="h-full flex-shrink-0 rounded-sm overflow-hidden bg-bg-soft"
              style={{ marginRight: i === items.length - 1 ? 0 : GAP_PX }}
            >
              {/* §148 — 캐러셀 안의 모든 영상이 한 번에 DOM에 올라오는 데다
                  w-auto라 가로세로 비율을 알아야 폭이 올바르게 정해진다.
                  preload="metadata"로 본문 데이터는 미루면서도 비율 정보만
                  가볍게 먼저 받아 레이아웃이 튀지 않게 한다. */}
              <video
                src={mediaSrc(m.url)}
                poster={m.poster}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                playsInline
                preload="metadata"
                onLoadedMetadata={refreshScrollTrigger}
                className="h-full w-auto pointer-events-auto"
              />
            </div>
          ))}
        </div>

        {/* §125 — 드래그 가능함을 알려주는 커서 추종 배지. 배경은
            globals.css의 .accent-bg(사이트 강조색 --accent)를 쓴다. */}
        {canHover && canDrag && hoverPos && (
          <div
            className="accent-bg pointer-events-none fixed z-50 flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold tracking-wide text-white shadow-lg"
            style={{ left: hoverPos.x, top: hoverPos.y, transform: "translate(-50%, -50%)" }}
          >
            Drag
          </div>
        )}
      </div>
    </div>
  );
}
