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
    [rentedRows],
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
        LIMIT 5
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
        LIMIT 5
      `,
      [today]
    ),
  ]);

  const todayPickups = getFirstTotal(pickupCountRows);
  const todayReturns = getFirstTotal(returnCountRows);
  const availableVehicles = getFirstTotal(availableRows);
  const rentedVehicles = getFirstTotal(rentedRows);
  const pickupList = pickupRows as BookingRow[];
  const returnList = returnRows as BookingRow[];

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#151515]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/rep" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/10">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-serif text-xl font-black leading-tight">
                Rep Portal
              </p>

              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
                Mobile Workflow
              </p>
            </div>
          </Link>

          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-black/10 bg-white px-4 py-3 text-xs font-black shadow-sm"
            >
              Office
            </Link>

            <Link
              href="/rep/vehicles"
              className="rounded-full bg-[#111111] px-4 py-3 text-xs font-black text-white shadow-lg"
            >
              Vehicles
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#080808] px-5 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.3),transparent_35%),linear-gradient(135deg,#111111,#050505)] p-7 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4af37]">
              Roberts Auto Rental
            </p>

            <h1 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              Today&apos;s road work,
              <br />
              ready on tablet.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">
              Pickups, returns, vehicle checks, payments, inspections, and
              signatures are grouped for fast mobile work.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RepStat
            title="Pickups Today"
            value={String(todayPickups)}
            href="/rep/pickups"
            tone="gold"
          />

          <RepStat
            title="Returns Today"
            value={String(todayReturns)}
            href="/rep/returns"
            tone="black"
          />

          <RepStat
            title="Available"
            value={String(availableVehicles)}
            href="/rep/vehicles"
            tone="green"
          />

          <RepStat
            title="Reserved / Out"
            value={String(rentedVehicles)}
            href="/rep/vehicles"
            tone="blue"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <ActionCard
            title="Pickup Workflow"
            text="Start customer pickup, collect payment, complete inspection, and capture signature."
            href="/rep/pickups"
            button="Open Pickups"
          />

          <ActionCard
            title="Return Workflow"
            text="Check returning vehicles, review condition, and prepare vehicle for the next booking."
            href="/rep/returns"
            button="Open Returns"
          />

          <ActionCard
            title="Vehicle Status"
            text="View available, reserved, rented, and active vehicles from the mobile side."
            href="/rep/vehicles"
            button="View Vehicles"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SchedulePanel title="Pickup List" bookings={pickupList} empty="No pickups scheduled for today." />
          <SchedulePanel title="Return List" bookings={returnList} empty="No returns scheduled for today." />
        </section>
      </section>
    </main>
  );
}

function RepStat({
  title,
  value,
  href,
  tone,
}: {
  title: string;
  value: string;
  href: string;
  tone: "gold" | "black" | "green" | "blue";
}) {
  const styles = {
    gold: "bg-[#fff5d6] text-[#b98320]",
    black: "bg-[#111111] text-white",
    green: "bg-green-50 text-green-800",
    blue: "bg-blue-50 text-blue-800",
  };

  return (
    <Link
      href={href}
      className={`rounded-[2rem] p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 ${styles[tone]}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
        {title}
      </p>

      <p className="mt-4 text-5xl font-black">{value}</p>
    </Link>
  );
}

function ActionCard({
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
    <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
      <h2 className="font-serif text-3xl font-black">{title}</h2>

      <p className="mt-3 min-h-[72px] text-sm font-semibold leading-6 text-[#7a7168]">
        {text}
      </p>

      <Link
        href={href}
        className="mt-5 block rounded-2xl bg-[#111111] px-5 py-4 text-center text-sm font-black text-white shadow-lg"
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
}: {
  title: string;
  bookings: BookingRow[];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-xl shadow-black/5">
      <div className="border-b border-black/10 px-6 py-5">
        <h2 className="font-serif text-2xl font-black">{title}</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="p-6 text-sm font-semibold text-[#7a7168]">{empty}</div>
      ) : (
        <div className="divide-y divide-black/10">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/rep/workflow/${booking.id}`}
              className="block px-6 py-5 transition hover:bg-[#fbfaf8]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-[#151515]">
                    {booking.booking_number || `Booking #${booking.id}`}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#7a7168]">
                    {booking.customer_name || "Customer not set"}
                  </p>

                  <p className="mt-2 text-sm font-black text-[#4b443d]">
                    {booking.vehicle_name || "Vehicle"} —{" "}
                    {booking.plate_number || "No plate"}
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
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
