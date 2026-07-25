"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로그인에 실패했습니다.");
      router.push(params.get("next") || "/admin");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8">
        <p className="text-orange-500 text-sm font-medium mb-1">관리자 화면</p>
        <h1 className="text-xl font-bold text-white mb-6">이지은 포트폴리오 관리자</h1>
        <label className="block mb-4">
          <span className="block text-sm text-neutral-400 mb-1.5">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-orange-500"
            autoFocus
          />
        </label>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
