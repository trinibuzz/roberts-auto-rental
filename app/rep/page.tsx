import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type CountRow = {
  total: number;
};

type BookingRow = {
  id: number;
  booking_number: string | null;
  status: string;
  pickup_date: string | Date | null;
  pickup_time: string | null;
  return_date: string | Date | null;
  return_time: string | null;
  customer_name: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
};

async function requireRepUser() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

function getFirstTotal(rows: unknown) {
  const data = rows as CountRow[];
  return Number(data[0]?.total || 0);
}

export default async function RepDashboardPage() {
  await requireRepUser();

  const today = new Date().toISOString().slice(0, 10);

  const [
    [pickupCountRows],
    [returnCountRows],
    [availableRows],
    [reservedRows],
    [pickupRows],
    [returnRows],
  ] = await Promise.all([
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
    db.query(
      `
        SELECT COUNT(*) AS total
        FROM vehicles
        WHERE LOWER(status) IN ('reserved', 'rented', 'active')
      `
    ),
    db.query(
      `
        SELECT
          bookings.id,
          bookings.booking_number,
          bookings.status,
          bookings.pickup_date,
          bookings.pickup_time,
          bookings.return_date,
          bookings.return_time,
          customers.full_name AS customer_name,
          vehicles.vehicle_name,
          vehicles.plate_number
        FROM bookings
        LEFT JOIN customers ON customers.id = bookings.customer_id
        LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
        WHERE DATE(bookings.pickup_date) = ?
        AND LOWER(bookings.status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        ORDER BY bookings.pickup_time ASC, bookings.created_at DESC
        LIMIT 6
      `,
      [today]
    ),
    db.query(
      `
        SELECT
          bookings.id,
          bookings.booking_number,
          bookings.status,
          bookings.pickup_date,
          bookings.pickup_time,
          bookings.return_date,
          bookings.return_time,
          customers.full_name AS customer_name,
          vehicles.vehicle_name,
          vehicles.plate_number
        FROM bookings
        LEFT JOIN customers ON customers.id = bookings.customer_id
        LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
        WHERE DATE(bookings.return_date) = ?
        AND LOWER(bookings.status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        ORDER BY bookings.return_time ASC, bookings.created_at DESC
        LIMIT 6
      `,
      [today]
    ),
  ]);

  const todayPickups = getFirstTotal(pickupCountRows);
  const todayReturns = getFirstTotal(returnCountRows);
  const availableVehicles = getFirstTotal(availableRows);
  const reservedVehicles = getFirstTotal(reservedRows);
  const pickupList = pickupRows as BookingRow[];
  const returnList = returnRows as BookingRow[];

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto min-h-screen max-w-5xl bg-[#030303] pb-28">
        <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-[#050505]/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/rep" className="block min-w-0">
              <img
                src="/images/roberts-logo-wide.jpg"
                alt="Roberts Auto Rental and Leasing"
                className="h-20 w-auto max-w-[270px] object-contain"
              />
            </Link>

            <Link
              href="/rep/vehicles"
              className="shrink-0 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-5 py-3 text-xs font-black text-[#d4af37] shadow-lg shadow-black/30"
            >
              Fleet
            </Link>
          </div>

          <p className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.34em] text-[#d4af37]">
            Rep Mobile App
          </p>
        </header>

        <section className="relative overflow-hidden border-b border-[#d4af37]/20 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(212,175,55,0.26),transparent_32%),linear-gradient(135deg,#050505_0%,#111111_60%,#3a240c_100%)]" />

          <img
            src="/images/roberts-rep-hero-car.svg"
            alt="Roberts Auto Rental vehicle"
            className="absolute bottom-8 right-[-42px] w-[112%] max-w-none opacity-80 md:right-[-10px] md:w-[78%]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent" />

          <div className="relative min-h-[470px] px-4 pb-6 pt-6">
            <div className="inline-flex rounded-full border border-[#d4af37]/35 bg-black/55 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#d4af37] backdrop-blur">
              Fast Rental Workflow
            </div>

            <h1 className="mt-5 max-w-[430px] font-serif text-5xl font-black leading-[0.94] text-white md:text-6xl">
              Pickup
              <br />
              Return
              <br />
              Rent Faster
            </h1>

            <p className="mt-4 max-w-[390px] text-sm font-semibold leading-7 text-white/72">
              Customer checkout, vehicle release, payment, inspection, and
              signature in one rep app.
            </p>

            <div className="mt-6 grid grid-cols-5 gap-2 rounded-2xl border border-[#d4af37]/25 bg-black/58 p-3 backdrop-blur-md">
              <FlowStep number="1" label="Customer" active />
              <FlowStep number="2" label="Vehicle" />
              <FlowStep number="3" label="Payment" />
              <FlowStep number="4" label="Checkout" />
              <FlowStep number="5" label="Sign" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
              <Link
                href="/rep/pickups"
                className="rounded-2xl bg-[#d4af37] px-4 py-4 text-center text-sm font-black text-[#070707] shadow-xl shadow-black/40"
              >
                Start Pickup
              </Link>

              <Link
                href="/rep/returns"
                className="rounded-2xl border border-white/10 bg-white/12 px-4 py-4 text-center text-sm font-black text-white backdrop-blur"
              >
                Process Return
              </Link>

              <Link
                href="/rep/vehicles"
                className="col-span-2 rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-4 text-center text-sm font-black text-[#d4af37] sm:col-span-1"
              >
                View Fleet
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2 px-4 py-5">
          <MiniStat
            title="Pickups"
            value={String(todayPickups)}
            href="/rep/pickups"
            tone="gold"
          />

          <MiniStat
            title="Returns"
            value={String(todayReturns)}
            href="/rep/returns"
            tone="white"
          />

          <MiniStat
            title="Cars"
            value={String(availableVehicles)}
            href="/rep/vehicles"
            tone="green"
          />

          <MiniStat
            title="Out"
            value={String(reservedVehicles)}
            href="/rep/vehicles"
            tone="blue"
          />
        </section>

        <section className="grid gap-3 px-4 md:grid-cols-3">
          <MobileAction
            title="Customer Pickup"
            text="Begin the five-step pickup process for today's rentals."
            href="/rep/pickups"
            button="Open Pickups"
          />

          <MobileAction
            title="Vehicle Return"
            text="Inspect and receive returning vehicles quickly."
            href="/rep/returns"
            button="Open Returns"
          />

          <MobileAction
            title="Rental Fleet"
            text="View vehicle availability and current status from the tablet."
            href="/rep/vehicles"
            button="View Fleet"
          />
        </section>

        <section className="grid gap-4 px-4 py-5 lg:grid-cols-2">
          <SchedulePanel
            title="Today Pickups"
            bookings={pickupList}
            empty="No pickups scheduled for today."
            mode="pickup"
          />

          <SchedulePanel
            title="Today Returns"
            bookings={returnList}
            empty="No returns scheduled for today."
            mode="return"
          />
        </section>

        <BottomNav />
      </div>
    </main>
  );
}

function FlowStep({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={
          active
            ? "mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4af37] text-sm font-black text-[#070707]"
            : "mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/25 bg-black/45 text-sm font-black text-[#d4af37]"
        }
      >
        {number}
      </div>

      <p
        className={
          active
            ? "mt-2 text-[9px] font-black uppercase tracking-[0.03em] text-[#d4af37]"
            : "mt-2 text-[9px] font-black uppercase tracking-[0.03em] text-white/55"
        }
      >
        {label}
      </p>
    </div>
  );
}

function MiniStat({
  title,
  value,
  href,
  tone,
}: {
  title: string;
  value: string;
  href: string;
  tone: "gold" | "white" | "green" | "blue";
}) {
  const styles = {
    gold: "border-[#d4af37]/40 bg-[#d4af37] text-[#070707]",
    white: "border-white/10 bg-white/10 text-white",
    green: "border-green-400/20 bg-green-400/10 text-green-200",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl border p-3 text-center shadow-xl shadow-black/25 ${styles[tone]}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-75">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black">{value}</p>
    </Link>
  );
}

function MobileAction({
  title,
  text,
  href,
  button,
}: {
  title: string;
  text: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d4af37]/20 bg-[#0f0f10] p-4 shadow-xl shadow-black/30">
      <h2 className="font-serif text-xl font-black text-white">{title}</h2>

      <p className="mt-2 min-h-[48px] text-xs font-semibold leading-5 text-white/60">
        {text}
      </p>

      <Link
        href={href}
        className="mt-4 block rounded-2xl bg-[#d4af37] px-4 py-3 text-center text-xs font-black text-[#070707]"
      >
        {button}
      </Link>
    </div>
  );
}

function SchedulePanel({
  title,
  bookings,
  empty,
  mode,
}: {
  title: string;
  bookings: BookingRow[];
  empty: string;
  mode: "pickup" | "return";
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d4af37]/20 bg-[#0f0f10] shadow-xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-[#d4af37]/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d4af37]">
            {mode === "pickup" ? "Rental Release" : "Vehicle Return"}
          </p>

          <h2 className="mt-1 font-serif text-2xl font-black text-white">
            {title}
          </h2>
        </div>

        <span className="rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-2 text-xs font-black text-[#d4af37]">
          {bookings.length}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="p-5 text-sm font-semibold text-white/55">{empty}</div>
      ) : (
        <div className="divide-y divide-white/10">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/rep/workflow/${booking.id}`}
              className="block px-5 py-4 transition hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-white">
                    {booking.booking_number || `Booking #${booking.id}`}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/55">
                    {booking.customer_name || "Customer not set"}
                  </p>

                  <p className="mt-2 text-sm font-black text-[#d4af37]">
                    {booking.vehicle_name || "Vehicle"} —{" "}
                    {booking.plate_number || "No plate"}
                  </p>
                </div>

                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-4 grid grid-cols-5 gap-1">
                <TinyProgress label="C" active />
                <TinyProgress label="V" />
                <TinyProgress label="P" />
                <TinyProgress label="O" />
                <TinyProgress label="S" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function TinyProgress({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "rounded-full bg-[#d4af37] py-1 text-center text-[10px] font-black text-[#070707]"
          : "rounded-full bg-white/10 py-1 text-center text-[10px] font-black text-white/45"
      }
    >
      {label}
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4af37]/20 bg-[#050505]/95 px-3 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2">
        <BottomLink href="/rep" label="Home" icon="⌂" active />
        <BottomLink href="/rep/pickups" label="Pickups" icon="↗" />
        <BottomLink href="/rep/returns" label="Returns" icon="↙" />
        <BottomLink href="/rep/vehicles" label="Fleet" icon="▣" />
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
          : "rounded-2xl px-3 py-2 text-center text-white/60"
      }
    >
      <p className="text-lg leading-none">{icon}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em]">
        {label}
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-purple-100 text-purple-800",
    reserved: "bg-purple-100 text-purple-800",
    active: "bg-blue-100 text-blue-800",
    rented: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-700",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-2 text-[10px] font-black uppercase ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
