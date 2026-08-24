import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PickupRow = {
  id: number;
  booking_number: string | null;
  pickup_date: string | Date | null;
  pickup_date_key: string;
  pickup_time: string | null;
  return_date: string | Date | null;
  status: string;
  full_name: string | null;
  phone: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
  vehicle_photo: string | null;
};

export default async function RepPickupsPage() {
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

  const today = new Date().toISOString().slice(0, 10);

  const [rows] = await db.query(
    `
      SELECT
        bookings.id,
        bookings.booking_number,
        bookings.pickup_date,
        DATE_FORMAT(bookings.pickup_date, '%Y-%m-%d') AS pickup_date_key,
        bookings.pickup_time,
        bookings.return_date,
        bookings.status,
        customers.full_name,
        customers.phone,
        vehicles.vehicle_name,
        vehicles.plate_number,
        vehicles.vehicle_photo
      FROM bookings
      LEFT JOIN customers ON customers.id = bookings.customer_id
      LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE DATE(bookings.pickup_date) >= ?
        AND LOWER(bookings.status) IN ('reserved', 'confirmed', 'pending')
      ORDER BY
        bookings.pickup_date ASC,
        bookings.pickup_time ASC,
        bookings.created_at DESC
    `,
    [today]
  );

  const pickups = rows as PickupRow[];
  const todaysPickups = pickups.filter(
    (booking) => booking.pickup_date_key === today
  );
  const upcomingPickups = pickups
    .filter((booking) => booking.pickup_date_key > today)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-28 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Pickups
            </h1>
          </div>

          <Link
            href="/rep"
            className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
        <section className="overflow-hidden rounded-[2rem] bg-[#111111] text-white shadow-xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.35),transparent_42%)] p-6 md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e4c45b]">
              Vehicle Release Schedule
            </p>

            <h2 className="mt-3 font-serif text-4xl font-black md:text-5xl">
              Today and upcoming
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">
              Today&apos;s rentals are ready for vehicle check-out. Confirmed
              future bookings remain visible below until their pickup date.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
              <ScheduleStat
                value={String(todaysPickups.length)}
                label="Ready Today"
              />
              <ScheduleStat
                value={String(upcomingPickups.length)}
                label="Upcoming"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Ready for release"
            title="Today’s Pickups"
            count={todaysPickups.length}
          />

          {todaysPickups.length === 0 ? (
            <EmptyState
              title="No pickups ready today"
              text="Bookings scheduled for today will automatically move into this section."
            />
          ) : (
            <div className="space-y-4">
              {todaysPickups.map((booking) => (
                <PickupCard key={booking.id} booking={booking} ready />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Confirmed schedule"
            title="Upcoming Pickups"
            count={upcomingPickups.length}
          />

          {upcomingPickups.length === 0 ? (
            <EmptyState
              title="No upcoming pickups"
              text="Converted website requests and future bookings will appear here immediately."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {upcomingPickups.map((booking) => (
                <PickupCard key={booking.id} booking={booking} ready={false} />
              ))}
            </div>
          )}
        </section>
      </section>

      <BottomNav active="pickups" />
    </main>
  );
}

function PickupCard({
  booking,
  ready,
}: {
  booking: PickupRow;
  ready: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
      <div className={ready ? "md:grid md:grid-cols-[240px_1fr]" : ""}>
        {booking.vehicle_photo ? (
          <img
            src={booking.vehicle_photo}
            alt={booking.vehicle_name || "Vehicle"}
            className={
              ready
                ? "h-52 w-full object-cover md:h-full"
                : "h-44 w-full object-cover"
            }
          />
        ) : (
          <div
            className={
              ready
                ? "flex h-52 items-center justify-center bg-[#111111] text-5xl md:h-full"
                : "flex h-44 items-center justify-center bg-[#111111] text-5xl"
            }
          >
            🚗
          </div>
        )}

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
                {ready ? "Ready Today" : formatLongDate(booking.pickup_date)}
              </p>

              <h3 className="mt-2 font-serif text-3xl font-black">
                {booking.vehicle_name || "Vehicle not set"}
              </h3>

              <p className="mt-1 text-sm font-bold text-[#7a7168]">
                {booking.plate_number || "No plate"} • {" "}
                {booking.booking_number || `#${booking.id}`}
              </p>
            </div>

            <StatusPill status={booking.status} />
          </div>

          <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
            <p className="text-sm font-black text-[#1d1d1f]">
              {booking.full_name || "Customer not set"}
            </p>

            <p className="mt-1 text-sm font-semibold text-[#7a7168]">
              {booking.phone || "No phone"}
            </p>
          </div>

          <div className="grid gap-2 text-sm font-bold text-[#5f554c] sm:grid-cols-3">
            <p>Pickup: {formatDate(booking.pickup_date)}</p>
            <p>Time: {formatTime(booking.pickup_time)}</p>
            <p>Return: {formatDate(booking.return_date)}</p>
          </div>

          {ready ? (
            <Link
              href={`/rep/workflow/${booking.id}`}
              className="block rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-center text-base font-black text-white shadow-lg"
            >
              Start Check-Out
            </Link>
          ) : (
            <div className="rounded-2xl border border-[#d4af37]/30 bg-[#fff9e8] px-5 py-4 text-center text-sm font-black text-[#8a6713]">
              Check-Out Opens on {formatLongDate(booking.pickup_date)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-3xl font-black">{title}</h2>
      </div>

      <span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-[#111111] px-3 text-sm font-black text-white">
        {count}
      </span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#d8d0c4] bg-white p-7 text-center shadow-sm">
      <h3 className="font-serif text-2xl font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#7a7168]">
        {text}
      </p>
    </div>
  );
}

function ScheduleStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reserved: "bg-purple-100 text-purple-800",
    confirmed: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      {String(status || "").replaceAll("_", " ")}
    </span>
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

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(dateValue: string | Date | null) {
  if (!dateValue) return "Scheduled";

  return new Date(dateValue).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";

  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) return value;

  const hourNumber = Number(hours);
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}
