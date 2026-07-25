"use client";

import { useState } from "react";

export function ConfirmButton({
  onConfirm, label, confirmLabel = "정말 삭제할까요?", className,
}: { onConfirm: () => void; label: string; confirmLabel?: string; className?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-neutral-400">{confirmLabel}</span>
        <button
          type="button"
          onClick={() => { onConfirm(); setConfirming(false); }}
          className="text-xs text-red-400 hover:text-red-300 font-medium"
        >
          예
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-xs text-neutral-500 hover:text-neutral-300">
          아니오
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={className ?? "text-xs text-red-400 hover:text-red-300"}>
      {label}
    </button>
  );
}
