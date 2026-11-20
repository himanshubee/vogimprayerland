"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

const fieldClass =
  "w-full bg-transparent border-b border-white/40 focus:border-gold outline-none py-3 text-white placeholder:text-white/40 transition-colors";
const labelClass = "block text-[11px] tracking-[0.28em] uppercase text-gold/80 mb-2";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
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
        body: JSON.stringify({ username, password, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.needsCode) setNeedsCode(true);
        throw new Error(data.error || "Sign-in failed");
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight text-white px-5 relative overflow-hidden">
      <div className="absolute inset-0 starfield opacity-40" />
      <main className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gold/50 text-gold">
            <Lock size={20} aria-hidden="true" />
          </div>
          <p className="eyebrow text-gold">Staff sign-in</p>
          <h1 className="font-display text-3xl mt-2">VOGIM Prayer Land</h1>
          <p className="text-white/70 text-sm mt-2">Sign in with your own staff account.</p>
        </div>

        <form onSubmit={onSubmit} className="border border-gold/20 bg-maroon/40 backdrop-blur p-8 space-y-6">
          <label className="block">
            <span className={labelClass}>Username</span>
            <input
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div>
            <label htmlFor="admin-password" className={labelClass}>Password</label>
            <div className="flex items-center gap-2">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="flex h-12 w-12 shrink-0 items-center justify-center text-white/80 hover:text-gold"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {needsCode && (
            <label className="block">
              <span className={labelClass}>Authenticator code</span>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={fieldClass}
              />
            </label>
          )}

          <p role="alert" aria-live="assertive" className="min-h-0">
            {error && <span className="block text-sm text-gold-soft border-l-2 border-gold pl-3">{error}</span>}
          </p>

          <button type="submit" disabled={loading} className="btn-gold w-full justify-center disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </main>
    </div>
  );
}
