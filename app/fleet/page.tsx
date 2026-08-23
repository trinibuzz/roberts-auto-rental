import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type VehicleRow = {
  id: number;
  vehicle_name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string | null;
  status: string | null;
  daily_rate: number | string | null;
  current_mileage: number | null;
  vehicle_photo: string | null;
};

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function PublicFleetPage() {
  const [rows] = await db.query(
    `
      SELECT
        id,
        vehicle_name,
        make,
        model,
        year,
        plate_number,
        status,
        daily_rate,
        current_mileage,
        vehicle_photo
      FROM vehicles
      WHERE LOWER(status) = 'available'
      ORDER BY vehicle_name ASC, plate_number ASC
    `
  );

  const vehicles = rows as VehicleRow[];

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-[#171717]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/60 bg-white p-2 shadow-md sm:h-16 sm:w-16">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="font-serif text-lg font-black leading-tight sm:text-2xl">
                Roberts Auto Rental
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#a87416] sm:text-xs">
                Premium Fleet
              </p>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-4 py-3 text-xs font-black shadow-sm transition hover:border-[#d4af37] hover:text-[#9a6a12] sm:px-6 sm:text-sm"
            >
              Home
            </Link>
            <Link
              href="/book"
              className="flex min-h-12 items-center justify-center rounded-full border-2 border-[#d4af37] bg-[#111111] px-4 py-3 text-center text-xs font-black text-white shadow-lg shadow-black/15 transition hover:bg-[#d4af37] hover:text-black sm:px-7 sm:text-sm"
            >
              Book Now
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#080808] px-5 py-16 text-white sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_20%,rgba(212,175,55,0.24),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(185,131,32,0.18),transparent_34%),linear-gradient(120deg,#050505_0%,#111111_58%,#241708_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-40 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.05)_45%,transparent_46%)]" />

        <div className="mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#d4af37] sm:text-sm">
              Available Fleet
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl font-black leading-[0.94] sm:text-6xl lg:text-8xl">
              Choose your
              <span className="block text-[#d4af37]">next ride.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/70 sm:text-lg">
              Browse our rental-ready vehicles, select the right fit for your
              trip, and send your request directly to the Roberts team.
            </p>
          </div>

          <div className="grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-3xl font-black text-[#d4af37]">
                {vehicles.length}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Available now
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-3xl font-black text-[#d4af37]">24/7</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Request online
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#a87416]">
              Rental ready
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black sm:text-4xl">
              Available vehicles
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-[#6f655b]">
            Rates shown are daily. Final availability and rental details are
            confirmed by our office.
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-3xl">
              🚗
            </div>
            <h2 className="mt-6 font-serif text-3xl font-black sm:text-4xl">
              No vehicles available online
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[#7a7168]">
              Once vehicles are marked available in the office system, they
              will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative overflow-hidden bg-[#111111]">
                  {vehicle.vehicle_photo ? (
                    <img
                      src={vehicle.vehicle_photo}
                      alt={vehicle.vehicle_name || "Vehicle"}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-[radial-gradient(circle_at_top,#3b2a10,#111111_55%)] text-6xl">
                      🚗
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f4cc64] backdrop-blur">
                    Available
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div>
                    <h3 className="font-serif text-3xl font-black leading-tight">
                      {vehicle.vehicle_name || "Vehicle"}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-[#766c62]">
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "Available rental vehicle"}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-black/5 bg-[#f8f4ec] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a6a12]">
                        Daily rate
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {formatMoney(vehicle.daily_rate)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-black/5 bg-[#f8f4ec] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a6a12]">
                        Mileage
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {vehicle.current_mileage
                          ? `${vehicle.current_mileage.toLocaleString()} km`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/book?vehicle_id=${vehicle.id}`}
                    className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-[#b98320]/20 transition hover:brightness-105"
                  >
                    Request This Vehicle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#111111] p-7 text-white shadow-2xl sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4af37]">
              Ready to travel?
            </p>
            <h2 className="mt-3 font-serif text-3xl font-black sm:text-4xl">
              Let us help you choose.
            </h2>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/65">
              Submit your preferred vehicle and dates. Our team will contact
              you to confirm the booking.
            </p>
          </div>
          <Link
            href="/book"
            className="w-full shrink-0 rounded-2xl border-2 border-[#d4af37] bg-[#d4af37] px-8 py-5 text-center text-sm font-black text-black shadow-lg transition hover:bg-transparent hover:text-white sm:w-auto"
          >
            Start Booking
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#080808] px-5 py-8 text-center text-white">
        <p className="font-serif text-xl font-black">Roberts Auto Rental</p>
        <p className="mt-2 text-xs font-semibold text-white/50">
          © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
          rights reserved.
        </p>
      </footer>
    </main>
  );
}