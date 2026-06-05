"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight text-white px-5 relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-40" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gold/50 text-gold">
            <Lock size={20} />
          </div>
          <p className="eyebrow text-gold">Admin Access</p>
          <h1 className="font-display text-3xl mt-2">VOGIM Prayer Land</h1>
          <p className="text-white/60 text-sm mt-2">
            Sign in to view prayer &amp; request submissions.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="border border-gold/20 bg-maroon/40 backdrop-blur p-8"
        >
          <label className="block">
            <span className="block text-[11px] tracking-[0.28em] uppercase text-gold/70 mb-2">
              Password
            </span>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-white/25 focus:border-gold outline-none py-3 text-white placeholder:text-white/30 transition-colors"
            />
          </label>

          {error && (
            <p className="mt-4 text-sm text-gold-soft border-l-2 border-gold pl-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full justify-center mt-8 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
