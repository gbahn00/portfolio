"use client";

export default function BackupAdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">백업</h1>
      <p className="text-sm text-neutral-500 mb-8">전체 콘텐츠, 수정 이력, 휴지통 데이터를 JSON 파일로 내려받습니다.</p>

      <a
        href="/api/admin/backup"
        className="inline-block rounded-md bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
      >
        전체 콘텐츠 내려받기 (JSON)
      </a>

      <div className="mt-8 rounded-md border border-neutral-800 p-4 text-sm text-neutral-400 leading-relaxed">
        <p className="mb-2 text-neutral-300 font-medium">복원 방법</p>
        <p>
          내려받은 JSON 파일의 <code className="text-orange-400">content</code> 항목을{" "}
          <code className="text-orange-400">content/site-content.json</code> 파일 내용으로 그대로 교체한 뒤
          서버를 다시 시작하면 이전 상태로 복원됩니다. Supabase 모드에서는 각 테이블에 맞게 데이터를 가져오세요.
        </p>
      </div>
    </div>
  );
}
