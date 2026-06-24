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

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function PublicHomePage() {
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
        vehicle_photo
      FROM vehicles
      WHERE LOWER(status) = 'available'
      ORDER BY vehicle_name ASC
      LIMIT 3
    `
  );

  const featuredVehicles = rows as VehicleRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <header className="sticky top-0 z-30 border-b border-[#e7e2d9] bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-[#e7e2d9]">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-serif text-xl font-black">
                Roberts Auto Rental
              </p>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98320]">
                Drive With Confidence
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-black text-[#4b443d] md:flex">
            <Link href="/fleet" className="hover:text-[#b98320]">
              Fleet
            </Link>

            <Link href="/book" className="hover:text-[#b98320]">
              Book Online
            </Link>

            <Link href="/admin/login" className="hover:text-[#b98320]">
              Staff Login
            </Link>
          </nav>

          <Link
            href="/book"
            className="rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white shadow-lg"
          >
            Book Now
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(212,175,55,0.32),transparent_34%),linear-gradient(90deg,#050505_0%,#111111_48%,#3a2410_100%)]" />

        <div className="absolute inset-0 opacity-25">
          <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_35%,rgba(212,175,55,0.12)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.32em] text-[#d4af37]">
              Premium Rental Experience
            </p>

            <h1 className="mt-6 font-serif text-5xl font-black leading-tight text-white md:text-7xl">
              Reliable Cars.
              <br />
              Smooth Booking.
              <br />
              Better Service.
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/75">
              Book your rental online with Roberts Auto Rental. Choose your
              dates, request your vehicle, and let our office confirm your
              reservation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book"
                className="rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-7 py-5 text-center text-sm font-black text-white shadow-xl"
              >
                Start Booking Request
              </Link>

              <Link
                href="/fleet"
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-5 text-center text-sm font-black text-white backdrop-blur hover:bg-white/15"
              >
                View Available Fleet
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
                Online Booking
              </p>

              <h2 className="mt-3 font-serif text-4xl font-black text-[#111111]">
                Request A Vehicle
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#6b6257]">
                Your request goes straight to the office as pending. A staff
                member can confirm availability, documents, and deposit.
              </p>

              <div className="mt-6 grid gap-3">
                <MiniStep number="01" title="Choose dates" />
                <MiniStep number="02" title="Select vehicle" />
                <MiniStep number="03" title="Send request" />
                <MiniStep number="04" title="Office confirms" />
              </div>

              <Link
                href="/book"
                className="mt-6 block rounded-2xl bg-[#111111] px-6 py-5 text-center text-sm font-black text-white"
              >
                Continue To Booking
              </Link>
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
              Ready for the road
            </h2>
          </div>

          <Link
            href="/fleet"
            className="rounded-2xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black shadow-sm"
          >
            View Full Fleet
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featuredVehicles.length === 0 ? (
            <div className="rounded-[2rem] border border-[#e7e2d9] bg-white p-8 text-center shadow-xl shadow-black/5 md:col-span-3">
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
                className="overflow-hidden rounded-[2rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5"
              >
                {vehicle.vehicle_photo ? (
                  <img
                    src={vehicle.vehicle_photo}
                    alt={vehicle.vehicle_name || "Vehicle"}
                    className="h-56 w-full object-cover"
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

      <section className="border-y border-[#e7e2d9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-3">
          <Feature title="Easy booking" text="Customers can send rental requests online anytime." />
          <Feature title="Office approval" text="Bookings stay pending until your team confirms them." />
          <Feature title="Professional flow" text="Office, rep tablet, and public booking all work together." />
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

function MiniStep({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37] text-xs font-black text-white">
        {number}
      </span>

      <span className="font-black text-[#111111]">{title}</span>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-[#e7e2d9] bg-[#fbfaf8] p-6">
      <h3 className="font-serif text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#7a7168]">
        {text}
      </p>
    </div>
  );
}
