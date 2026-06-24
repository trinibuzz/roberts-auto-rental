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
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto min-h-screen max-w-6xl bg-[radial-gradient(circle_at_90%_5%,rgba(212,175,55,0.20),transparent_30%),linear-gradient(180deg,#121212_0%,#050505_38%,#0b0b0c_100%)]">
        <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-[#050505]/90 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/rep" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-white p-2 shadow-lg shadow-black/30">
                <img
                  src="/images/roberts-logo.png"
                  alt="Roberts Auto Rental"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="font-serif text-lg font-black leading-tight text-white">
                  Roberts Auto Rental
                </p>

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d4af37]">
                  Tablet Rental App
                </p>
              </div>
            </Link>

            <div className="flex gap-2">
              <Link
                href="/rep/vehicles"
                className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-[11px] font-black text-[#d4af37]"
              >
                Vehicles
              </Link>

              <Link
                href="/admin/dashboard"
                className="rounded-full bg-[#d4af37] px-4 py-3 text-[11px] font-black text-[#070707]"
              >
                Office
              </Link>
            </div>
          </div>
        </header>

        <section className="px-4 py-5">
          <div className="overflow-hidden rounded-[2rem] border border-[#d4af37]/25 bg-[#080808] shadow-2xl shadow-black/40">
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(135deg,#050505_0%,#111111_58%,#3a250d_100%)]" />
              <div className="relative p-5 md:p-7">
                <div className="inline-flex rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#d4af37]">
                  Fast Rental Workflow
                </div>

                <h1 className="mt-5 font-serif text-4xl font-black leading-tight text-white md:text-5xl">
                  5 Step Easy Booking
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                  Built for tablet and phone use. Start with the customer,
                  confirm the vehicle, collect payment, complete checkout, and
                  capture signature.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                  <StepCard
                    number="01"
                    title="Customer"
                    text="Select booking"
                    href="/rep/pickups"
                    active
                  />

                  <StepCard
                    number="02"
                    title="Vehicle"
                    text="Check status"
                    href="/rep/vehicles"
                  />

                  <StepCard
                    number="03"
                    title="Payment"
                    text="Collect balance"
                    href="/rep/pickups"
                  />

                  <StepCard
                    number="04"
                    title="Checkout"
                    text="Inspect & release"
                    href="/rep/pickups"
                  />

                  <StepCard
                    number="05"
                    title="Signature"
                    text="Customer signs"
                    href="/rep/pickups"
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Link
                    href="/rep/pickups"
                    className="rounded-2xl bg-[#d4af37] px-5 py-4 text-center text-sm font-black text-[#070707] shadow-lg shadow-black/30"
                  >
                    Start Fast Booking
                  </Link>

                  <Link
                    href="/rep/returns"
                    className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center text-sm font-black text-white backdrop-blur"
                  >
                    Process Return
                  </Link>

                  <Link
                    href="/rep/vehicles"
                    className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-4 text-center text-sm font-black text-[#d4af37]"
                  >
                    View Fleet
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4">
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
            title="Available"
            value={String(availableVehicles)}
            href="/rep/vehicles"
            tone="green"
          />

          <MiniStat
            title="Reserved"
            value={String(reservedVehicles)}
            href="/rep/vehicles"
            tone="blue"
          />
        </section>

        <section className="grid gap-4 px-4 py-5 lg:grid-cols-3">
          <MobileAction
            title="Customer Pickup"
            text="Open today's pickups and continue through customer, vehicle, payment, checkout, and signature."
            href="/rep/pickups"
            button="Open Pickups"
          />

          <MobileAction
            title="Vehicle Return"
            text="Process returns, verify condition, and prepare the vehicle for the next rental."
            href="/rep/returns"
            button="Open Returns"
          />

          <MobileAction
            title="Fleet View"
            text="View vehicle availability and current vehicle status in the mobile portal."
            href="/rep/vehicles"
            button="Open Vehicles"
          />
        </section>

        <section className="grid gap-4 px-4 pb-8 lg:grid-cols-2">
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
      </div>
    </main>
  );
}

function StepCard({
  number,
  title,
  text,
  href,
  active = false,
}: {
  number: string;
  title: string;
  text: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl border border-[#d4af37] bg-[#d4af37] p-3 text-[#070707] shadow-lg shadow-black/30"
          : "rounded-2xl border border-[#d4af37]/20 bg-black/35 p-3 text-white shadow-lg shadow-black/20 backdrop-blur transition hover:border-[#d4af37]/50"
      }
    >
      <p
        className={
          active
            ? "text-[10px] font-black uppercase tracking-[0.2em] text-[#070707]/70"
            : "text-[10px] font-black uppercase tracking-[0.2em] text-[#d4af37]"
        }
      >
        Step {number}
      </p>

      <p className="mt-2 text-lg font-black leading-tight">{title}</p>

      <p
        className={
          active
            ? "mt-1 text-[11px] font-bold text-[#070707]/70"
            : "mt-1 text-[11px] font-bold text-white/55"
        }
      >
        {text}
      </p>
    </Link>
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
      className={`rounded-2xl border p-4 shadow-xl shadow-black/25 ${styles[tone]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">
        {title}
      </p>

      <p className="mt-2 text-4xl font-black">{value}</p>
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
    <div className="rounded-[1.75rem] border border-[#d4af37]/20 bg-[#0f0f10] p-5 shadow-xl shadow-black/30">
      <h2 className="font-serif text-2xl font-black text-white">{title}</h2>

      <p className="mt-3 min-h-[70px] text-sm font-semibold leading-6 text-white/60">
        {text}
      </p>

      <Link
        href={href}
        className="mt-4 block rounded-2xl bg-[#d4af37] px-5 py-4 text-center text-sm font-black text-[#070707]"
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
    <section className="overflow-hidden rounded-[1.75rem] border border-[#d4af37]/20 bg-[#0f0f10] shadow-xl shadow-black/30">
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
                <TinyProgress label="V" active />
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
