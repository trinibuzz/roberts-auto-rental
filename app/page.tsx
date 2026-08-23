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
  vehicle_photo: string | null;
};

type CountRow = {
  total: number;
};

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getFirstTotal(rows: unknown) {
  const data = rows as CountRow[];
  return Number(data[0]?.total || 0);
}

export default async function PublicHomePage() {
  const [[vehicleRows], [availableRows], [requestRows]] = await Promise.all([
    db.query(
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
          vehicle_photo
        FROM vehicles
        WHERE LOWER(status) = 'available'
        ORDER BY vehicle_name ASC
        LIMIT 3
      `
    ),
    db.query(
      `
        SELECT COUNT(*) AS total
        FROM vehicles
        WHERE LOWER(status) = 'available'
      `
    ),
    db.query(
      `
        SELECT COUNT(*) AS total
        FROM public_booking_requests
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    ),
  ]);

  const featuredVehicles = vehicleRows as VehicleRow[];
  const availableVehicles = getFirstTotal(availableRows);
  const recentRequests = getFirstTotal(requestRows);

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#151515]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/10">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-serif text-xl font-black leading-tight">
                Roberts Auto Rental
              </p>

              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
                Drive With Confidence
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-black text-[#4b443d] md:flex">
            <Link href="/fleet" className="transition hover:text-[#b98320]">
              Fleet
            </Link>

            <Link href="/book" className="transition hover:text-[#b98320]">
              Book Online
            </Link>

            <Link href="/admin/login" className="transition hover:text-[#b98320]">
              Staff Login
            </Link>
          </nav>

          <Link
            href="/book"
            className="rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
          >
            Book Now
          </Link>
        </div>
      </header>

      <section className="overflow-hidden bg-[#050505] text-white">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[1920px] overflow-hidden bg-black sm:aspect-video">
          <picture>
            <source
              media="(min-width: 640px)"
              srcSet="/images/roberts-customer-hero.png"
            />
            <img
              src="/images/roberts-customer-hero-mobile.png"
              alt="Roberts Auto Rental and Leasing - Drive in Style"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        <div className="border-t border-[#d4af37]/25 bg-[radial-gradient(circle_at_15%_0%,rgba(212,175,55,0.18),transparent_35%),#080808]">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[auto_1fr] lg:items-center lg:py-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="rounded-2xl bg-gradient-to-r from-[#f0ce72] via-[#d4af37] to-[#b98320] px-8 py-5 text-center text-sm font-black text-black shadow-xl shadow-black/30 transition hover:-translate-y-0.5"
              >
                Start Booking Request
              </Link>

              <Link
                href="/fleet"
                className="rounded-2xl border border-[#d4af37]/35 bg-white/5 px-8 py-5 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                View Available Fleet
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:justify-self-end">
              <HeroStat value={String(availableVehicles)} label="Available" />
              <HeroStat value={String(recentRequests)} label="Requests" />
              <HeroStat value="24/7" label="Online" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#b98320]">
              Featured Vehicles
            </p>

            <h2 className="mt-3 font-serif text-4xl font-black">
              Available for your next trip
            </h2>
          </div>

          <Link
            href="/fleet"
            className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-center text-sm font-black shadow-sm"
          >
            View Full Fleet
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredVehicles.length === 0 ? (
            <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl shadow-black/5 md:col-span-3">
              <h3 className="font-serif text-3xl font-black">
                Fleet coming soon
              </h3>

              <p className="mt-2 text-sm font-semibold text-[#7a7168]">
                Vehicles marked available in the office system will show here.
              </p>
            </div>
          ) : (
            featuredVehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="group overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                {vehicle.vehicle_photo ? (
                  <img
                    src={vehicle.vehicle_photo}
                    alt={vehicle.vehicle_name || "Vehicle"}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-[#111111] text-5xl">
                    🚗
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-serif text-3xl font-black">
                    {vehicle.vehicle_name || "Vehicle"}
                  </h3>

                  <p className="mt-2 text-sm font-bold text-[#7a7168]">
                    {[vehicle.year, vehicle.make, vehicle.model]
                      .filter(Boolean)
                      .join(" ") || "Available rental vehicle"}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-[#b98320]">
                      {formatMoney(vehicle.daily_rate)} / day
                    </p>

                    <Link
                      href={`/book?vehicle_id=${vehicle.id}`}
                      className="rounded-xl bg-[#111111] px-4 py-3 text-sm font-black text-white"
                    >
                      Request
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-3">
          <Feature
            title="Fast Request"
            text="Customers send booking requests online without waiting for office hours."
          />
          <Feature
            title="Office Control"
            text="Staff confirm every booking before it becomes a real rental."
          />
          <Feature
            title="Professional System"
            text="Customer, office, and rep workflow now work together cleanly."
          />
        </div>
      </section>

      <footer className="bg-[#0b0b0c] px-5 py-10 text-center text-white">
        <p className="font-serif text-2xl font-black">Roberts Auto Rental</p>

        <p className="mt-2 text-sm font-semibold text-white/60">
          © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
          rights reserved.
        </p>
      </footer>
    </main>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">
        {label}
      </p>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-[#fbfaf8] p-6 shadow-sm">
      <h3 className="font-serif text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#7a7168]">
        {text}
      </p>
    </div>
  );
}