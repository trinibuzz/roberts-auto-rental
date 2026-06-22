import Link from "next/link";

export default function RepComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] p-5 text-[#1d1d1f]">
      <section className="mx-auto flex min-h-[80vh] max-w-xl items-center">
        <div className="w-full rounded-3xl border border-[#e7e2d9] bg-white p-6 text-center shadow-xl shadow-black/5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
            Roberts Rep Mode
          </p>

          <h1 className="mt-4 font-serif text-3xl font-black">
            This mobile tool is next.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#7a7168]">
            The Rep dashboard is ready first. The quick workflow screens will be
            added one by one: booking, pickups, returns, and vehicle view.
          </p>

          <Link
            href="/rep"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white"
          >
            Back to Rep Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
