"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RepLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("rep@robertsautorental.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/rep/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password.");
        return;
      }

      router.push("/rep/dashboard");
      router.refresh();
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {message ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-bold text-white/80">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-lg text-[#07111f] outline-none focus:border-[#d4af37]"
          placeholder="rep@robertsautorental.com"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-white/80">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-lg text-[#07111f] outline-none focus:border-[#d4af37]"
          placeholder="Enter rep password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[#d4af37] px-6 py-4 text-lg font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}