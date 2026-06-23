import Link from "next/link";

export const dynamic = "force-dynamic";

export default function MobileInspectionPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const bookingId = params.bookingId;

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Vehicle Inspection
            </h1>
          </div>

          <Link
            href={`/rep/workflow/${bookingId}`}
            className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
          >
            Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-white shadow-xl shadow-black/5">
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white">
            <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase text-white">
              Booking #{bookingId}
            </div>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              Inspection Coming Next
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
              This mobile inspection page is connected. Next we will add mileage,
              fuel level, damage notes, photos, and videos here.
            </p>
          </div>

          <div className="grid gap-3 p-5">
            <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#b98320]">
                Ready To Build
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#7a7168]">
                This page is now part of the phone/tablet workflow, so it will no
                longer break the build or jump to a 404 page.
              </p>
            </div>

            <Link
              href={`/rep/workflow/${bookingId}`}
              className="rounded-2xl bg-[#111111] px-5 py-5 text-center text-sm font-black text-white shadow-lg"
            >
              Back to Workflow
            </Link>
          </div>
        </section>
      </section>

      <BottomNav active="pickups" />
    </main>
  );
}

function BottomNav({
  active,
}: {
  active: "home" | "book" | "pickups" | "returns" | "vehicles";
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d9] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-2">
        <BottomNavLink href="/rep" label="Home" icon="⌂" active={active === "home"} />
        <BottomNavLink href="/rep/bookings/new" label="Book" icon="+" active={active === "book"} />
        <BottomNavLink href="/rep/pickups" label="Pickups" icon="↗" active={active === "pickups"} />
        <BottomNavLink href="/rep/returns" label="Returns" icon="↙" active={active === "returns"} />
        <BottomNavLink href="/rep/vehicles" label="Cars" icon="🚗" active={active === "vehicles"} />
      </div>
    </nav>
  );
}

function BottomNavLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-2 py-2 text-center text-[11px] font-black ${
        active ? "bg-[#111111] text-white" : "text-[#6b6257]"
      }`}
    >
      <span className="block text-base leading-none">{icon}</span>
      <span className="mt-1 block">{label}</span>
    </Link>
  );
}
