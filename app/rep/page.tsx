import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type CountRow = { total: number };

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

  if (!token) redirect("/admin/login");

  const user = await verifyToken(token);
  if (!user) redirect("/admin/login");

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
  ]);

  const todayPickups = getFirstTotal(pickupCountRows);
  const todayReturns = getFirstTotal(returnCountRows);
  const availableVehicles = getFirstTotal(availableRows);
  const reservedVehicles = getFirstTotal(reservedRows);
  const pickupList = pickupRows as BookingRow[];

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto min-h-screen max-w-5xl bg-[#030303] pb-28">
        <section className="relative min-h-[760px] overflow-hidden border-b border-[#d4af37]/20 bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(212,175,55,0.26),transparent_28%),linear-gradient(180deg,#121212_0%,#050505_36%,#030303_100%)]" />

          <div className="relative flex min-h-[760px] flex-col px-4 pb-6 pt-4">
            <div className="flex justify-center">
              <img
                src="/images/roberts-logo-wide.jpg"
                alt="Roberts Auto Rental and Leasing"
                className="h-auto w-full max-w-[430px] object-contain"
              />
            </div>

            <div className="mt-5 rounded-[2rem] border border-[#d4af37]/25 bg-black/55 p-5 shadow-2xl shadow-black/50 backdrop-blur">
              <div className="inline-flex rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#d4af37]">
                Vehicle Booking App
              </div>

              <h1 className="mt-5 font-serif text-5xl font-black leading-[0.92] text-white md:text-6xl">
                Book
                <br />
                A Vehicle
              </h1>

              <p className="mt-4 max-w-[430px] text-sm font-semibold leading-7 text-white/68">
                Simple rep workflow for customer booking, vehicle selection,
                payment, checkout, and signature.
              </p>

              <Link
                href="/rep/pickups"
                className="mt-6 block rounded-2xl bg-[#d4af37] px-5 py-5 text-center text-base font-black text-[#070707] shadow-xl shadow-black/40"
              >
                Start Booking
              </Link>
            </div>

            <div className="mt-5 rounded-[2rem] border border-[#d4af37]/20 bg-[#0d0d0e]/95 p-4 shadow-xl shadow-black/40">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#d4af37]">
                    Quick Booking
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-black text-white">
                    5 Step Flow
                  </h2>
                </div>

                <span className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-2 text-[10px] font-black text-[#d4af37]">
                  REP
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                <FlowStep number="1" label="Customer" active />
                <FlowStep number="2" label="Vehicle" />
                <FlowStep number="3" label="Payment" />
                <FlowStep number="4" label="Checkout" />
                <FlowStep number="5" label="Sign" />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[20%] rounded-full bg-[#d4af37]" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/rep/vehicles"
                className="rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-4 text-center text-sm font-black text-[#d4af37]"
              >
                Choose Vehicle
              </Link>

              <Link
                href="/rep/returns"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center text-sm font-black text-white"
              >
                Vehicle Return
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2 px-4 py-5">
          <MiniStat title="Book" value={String(todayPickups)} href="/rep/pickups" tone="gold" />
          <MiniStat title="Return" value={String(todayReturns)} href="/rep/returns" tone="white" />
          <MiniStat title="Cars" value={String(availableVehicles)} href="/rep/vehicles" tone="green" />
          <MiniStat title="Out" value={String(reservedVehicles)} href="/rep/vehicles" tone="blue" />
        </section>

        <section className="grid gap-3 px-4 md:grid-cols-3">
          <MobileAction
            title="Start Booking"
            text="Open today's customer bookings and begin the vehicle checkout flow."
            href="/rep/pickups"
            button="Start"
          />

          <MobileAction
            title="Select Vehicle"
            text="View available vehicles and current rental status."
            href="/rep/vehicles"
            button="Vehicles"
          />

          <MobileAction
            title="Complete Return"
            text="Receive a returning vehicle and prepare it for the next rental."
            href="/rep/returns"
            button="Returns"
          />
        </section>

        <section className="px-4 py-5">
          <SchedulePanel
            title="Ready To Book"
            bookings={pickupList}
            empty="No vehicle bookings waiting for pickup today."
          />
        </section>

        <BottomNav />
      </div>
    </main>
  );
}

function FlowStep({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
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
    <Link href={href} className={`rounded-2xl border p-3 text-center shadow-xl shadow-black/25 ${styles[tone]}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-75">{title}</p>
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
      <p className="mt-2 min-h-[48px] text-xs font-semibold leading-5 text-white/60">{text}</p>
      <Link href={href} className="mt-4 block rounded-2xl bg-[#d4af37] px-4 py-3 text-center text-xs font-black text-[#070707]">
        {button}
      </Link>
    </div>
  );
}

function SchedulePanel({
  title,
  bookings,
  empty,
}: {
  title: string;
  bookings: BookingRow[];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d4af37]/20 bg-[#0f0f10] shadow-xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-[#d4af37]/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d4af37]">
            Vehicle Booking
          </p>
          <h2 className="mt-1 font-serif text-2xl font-black text-white">{title}</h2>
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
            <Link key={booking.id} href={`/rep/workflow/${booking.id}`} className="block px-5 py-4 transition hover:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-white">{booking.booking_number || `Booking #${booking.id}`}</p>
                  <p className="mt-1 text-sm font-semibold text-white/55">{booking.customer_name || "Customer not set"}</p>
                  <p className="mt-2 text-sm font-black text-[#d4af37]">
                    {booking.vehicle_name || "Vehicle"} — {booking.plate_number || "No plate"}
                  </p>
                </div>

                <StatusBadge status={booking.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4af37]/20 bg-[#050505]/95 px-3 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2">
        <BottomLink href="/rep" label="Home" icon="⌂" active />
        <BottomLink href="/rep/pickups" label="Book" icon="+" />
        <BottomLink href="/rep/vehicles" label="Cars" icon="▣" />
        <BottomLink href="/rep/returns" label="Return" icon="↙" />
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
    <Link href={href} className={active ? "rounded-2xl bg-[#d4af37] px-3 py-2 text-center text-[#070707]" : "rounded-2xl px-3 py-2 text-center text-white/60"}>
      <p className="text-lg leading-none">{icon}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em]">{label}</p>
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
    <span className={`inline-flex w-fit items-center rounded-full px-3 py-2 text-[10px] font-black uppercase ${styles[cleanStatus] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
