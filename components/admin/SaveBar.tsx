"use client";

export function SaveBar({
  onSave, saving, savedAt, error,
}: { onSave: () => void; saving: boolean; savedAt: string | null; error: string | null }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 mt-10 flex items-center justify-between border-t border-neutral-800 bg-neutral-950/95 backdrop-blur px-6 py-4 -mx-6">
      <div className="text-xs text-neutral-500">
        {error && <span className="text-red-400">{error}</span>}
        {!error && savedAt && <span>마지막 저장: {savedAt}</span>}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}
