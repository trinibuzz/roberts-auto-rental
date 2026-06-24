"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b-4 border-[#d4af37] bg-gradient-to-br from-[#050b14] to-[#0b1f3a] px-8 py-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl">
            <img
              src="/images/roberts-logo.png"
              alt="Roberts Auto Rental"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-black text-white">
            Roberts Auto Rental
          </h1>

          <p className="mt-2 text-sm font-bold text-[#d4af37]">
            Fleet, Booking & Staff Manager
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 px-8 py-8">
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none focus:border-[#d4af37]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@robertsautorental.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Password
            </label>

            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none focus:border-[#d4af37]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0b1f3a] px-4 py-4 font-black text-white shadow-lg hover:bg-[#12345f] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs font-semibold text-gray-500">
            Internal office and rep access only
          </p>
        </form>
      </div>
    </main>
  );
}
