import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type VehicleRow = {
  id: number;
  vehicle_name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  daily_rate: number | string | null;
  vehicle_photo: string | null;
};

type CountRow = { total: number };

async function requireRepUser() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) redirect("/admin/login");

  const user = await verifyToken(token);
  if (!user) redirect("/admin/login");

  return user;
}

function getFirstTotal(rows: unknown) {
  const data = rows as CountRow[];
  return Number(data[0]?.total || 0);
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(0)}`;
}

export default async function RepBookingHomePage() {
  await requireRepUser();

  const today = new Date().toISOString().slice(0, 10);

  const [[vehicleRows], [pickupCountRows], [returnCountRows], [availableRows]] =
    await Promise.all([
      db.query(
        `
          SELECT id, vehicle_name, make, model, year, daily_rate, vehicle_photo
          FROM vehicles
          WHERE LOWER(status) = 'available'
          ORDER BY daily_rate DESC, vehicle_name ASC
          LIMIT 2
        `
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE DATE(pickup_date) = ?
          AND LOWER(status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        `,
        [today]
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM bookings
          WHERE DATE(return_date) = ?
          AND LOWER(status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        `,
        [today]
      ),
      db.query(
        `
          SELECT COUNT(*) AS total
          FROM vehicles
          WHERE LOWER(status) = 'available'
        `
      ),
    ]);

  const vehicles = vehicleRows as VehicleRow[];
  const todayBookings = getFirstTotal(pickupCountRows);
  const todayReturns = getFirstTotal(returnCountRows);
  const availableCars = getFirstTotal(availableRows);

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <div className="mx-auto min-h-screen max-w-5xl overflow-hidden bg-[#090909] pb-28">
        <section className="relative min-h-[730px] overflow-hidden">
          <img
            src="/images/rep-booking-hero.svg"
            alt="Premium rental vehicles"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/8 to-[#090909]" />

          <div className="relative px-4 pb-6 pt-5">
            <button
              type="button"
              className="absolute left-5 top-5 z-10 text-4xl leading-none text-[#d4af37]"
              aria-label="Menu"
            >
              ≡
            </button>

            <div className="flex justify-center pt-2">
              <img
                src="/images/roberts-logo-wide.jpg"
                alt="Roberts Auto Rental and Leasing"
                className="h-auto w-full max-w-[420px] object-contain drop-shadow-2xl"
              />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-4xl font-light uppercase tracking-[0.24em] text-white md:text-6xl">
                Drive In <span className="font-semibold text-[#d4af37]">Style</span>
              </h1>

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                Premium vehicles. Exceptional service.
              </p>
            </div>

            <div className="mt-[230px] rounded-[1.75rem] border border-[#d4af37]/35 bg-[#101010]/88 p-4 shadow-2xl shadow-black/50 backdrop-blur-md md:mt-[260px]">
              <div className="border-b border-[#d4af37]/25 pb-3 text-center">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d4af37]">
                  ▣ Book A Vehicle
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <BookingField label="Pick-Up Location" value="Select location" icon="⌖" />
                <BookingField label="Pick-Up Date & Time" value="Today • 10:00 AM" icon="▣" />
                <BookingField label="Return Date & Time" value="Select return time" icon="▣" />
                <BookingField label="Vehicle Type" value="All Vehicles" icon="▱" />
              </div>

              <Link
                href="/rep/pickups"
                className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f2cf72] via-[#d4af37] to-[#b88725] px-6 py-5 text-base font-black uppercase tracking-[0.12em] text-black shadow-xl"
              >
                Book Now <span className="text-2xl leading-none">›</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-7 px-4">
          <SectionHeader title="Featured Vehicles" href="/rep/vehicles" />

          <div className="grid gap-4 md:grid-cols-2">
            {(vehicles.length ? vehicles : [null, null]).slice(0, 2).map((vehicle, index) => (
              <FeaturedVehicle
                key={vehicle?.id || index}
                vehicle={vehicle}
                fallbackTitle={index === 0 ? "Premium SUV" : "Luxury Sedan"}
                fallbackRate={index === 0 ? "$129" : "$109"}
              />
            ))}
          </div>
        </section>

        <section className="mt-7 grid grid-cols-3 gap-3 px-4">
          <QuickStat title="Book" value={String(todayBookings)} href="/rep/pickups" />
          <QuickStat title="Return" value={String(todayReturns)} href="/rep/returns" />
          <QuickStat title="Cars" value={String(availableCars)} href="/rep/vehicles" />
        </section>

        <BottomNav />
      </div>
    </main>
  );
}

function BookingField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/58">
        {label}
      </p>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.08] px-4 py-4 text-sm font-semibold text-white/75">
        <span className="flex items-center gap-3">
          <span className="text-lg text-[#d4af37]">{icon}</span>
          {value}
        </span>

        <span className="text-white/45">⌄</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
        {title}
      </h2>

      <Link href={href} className="text-sm font-black text-[#d4af37]">
        View All →
      </Link>
    </div>
  );
}

function FeaturedVehicle({
  vehicle,
  fallbackTitle,
  fallbackRate,
}: {
  vehicle: VehicleRow | null;
  fallbackTitle: string;
  fallbackRate: string;
}) {
  const title =
    vehicle?.vehicle_name ||
    [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ") ||
    fallbackTitle;

  const rate = vehicle?.daily_rate ? `${formatMoney(vehicle.daily_rate)}` : fallbackRate;

  return (
    <Link
      href="/rep/vehicles"
      className="overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-[#111111] shadow-xl shadow-black/30"
    >
      <div className="relative h-36 overflow-hidden bg-black">
        {vehicle?.vehicle_photo ? (
          <img src={vehicle.vehicle_photo} alt={title} className="h-full w-full object-cover" />
        ) : (
          <img
            src="/images/rep-booking-hero.svg"
            alt={title}
            className="h-full w-full object-cover object-bottom"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <span className="absolute right-4 top-3 text-2xl text-[#d4af37]">♡</span>
      </div>

      <div className="flex items-end justify-between gap-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/55">Rental Vehicle</p>
        </div>

        <div className="text-right">
          <p className="text-lg font-black text-[#d4af37]">
            {rate} <span className="text-xs text-white/55">/day</span>
          </p>
          <p className="text-xs text-white/45">Automatic</p>
        </div>
      </div>
    </Link>
  );
}

function QuickStat({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#d4af37]/25 bg-[#111111] p-4 text-center"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4af37]">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </Link>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4af37]/20 bg-[#050505]/95 px-3 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2">
        <BottomLink href="/rep" label="Home" icon="⌂" active />
        <BottomLink href="/rep/vehicles" label="Fleet" icon="▱" />
        <BottomLink href="/rep/pickups" label="Bookings" icon="▣" />
        <BottomLink href="/rep/returns" label="Returns" icon="↙" />
      </div>
    </nav>
  );
}

function BottomLink({
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
      className={
        active
          ? "rounded-2xl bg-[#d4af37] px-3 py-2 text-center text-[#070707]"
          : "rounded-2xl px-3 py-2 text-center text-white/55"
      }
    >
      <p className="text-lg leading-none">{icon}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em]">
        {label}
      </p>
    </Link>
  );
}
