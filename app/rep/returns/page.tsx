import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ReturnRow = {
  id: number;
  booking_number: string | null;
  pickup_date: string | Date | null;
  return_date: string | Date | null;
  return_time: string | null;
  status: string;
  balance: number | string | null;
  full_name: string | null;
  phone: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
  vehicle_photo: string | null;
};

async function requireRepAccess() {
  const cookieStore = cookies();

  const token =
    cookieStore.get("roberts_rep_token")?.value ||
    cookieStore.get("roberts_token")?.value ||
    cookieStore.get("robers_token")?.value ||
    cookieStore.get("admin_token")?.value ||
    cookieStore.get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function RepReturnsPage() {
  await requireRepAccess();

  const today = new Date().toISOString().slice(0, 10);

  const [rows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.return_time,
      bookings.status,
      bookings.balance,
      customers.full_name,
      customers.phone,
      vehicles.vehicle_name,
      vehicles.plate_number,
      vehicles.vehicle_photo
    FROM bookings
    LEFT JOIN customers ON customers.id = bookings.customer_id
    LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE DATE(bookings.return_date) = ?
    AND LOWER(bookings.status) NOT IN ('cancelled', 'completed')
    ORDER BY bookings.return_time ASC, bookings.created_at DESC
    `,
    [today]
  );

  const returns = rows as ReturnRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Today&apos;s Returns
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

      <section className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
            Vehicles Coming Back
          </p>

          <h2 className="mt-3 font-serif text-4xl font-black">
            {returns.length} return{returns.length === 1 ? "" : "s"} today
          </h2>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
            Open the return inspection to record mileage, fuel level, damage
            notes, photos, videos, and any remaining balance.
          </p>
        </section>

        {returns.length === 0 ? (
          <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-8 text-center shadow-xl shadow-black/5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              ↙
            </div>

            <h2 className="mt-5 font-serif text-3xl font-black">
              No returns for today
            </h2>

            <p className="mt-2 text-sm font-semibold text-[#7a7168]">
              When a booking has today as the return date, it will show here.
            </p>

            <Link
              href="/rep"
              className="mt-6 inline-flex rounded-2xl bg-[#111111] px-6 py-4 text-sm font-black text-white"
            >
              Back to Rep Home
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            {returns.map((booking) => (
              <article
                key={booking.id}
                className="overflow-hidden rounded-[2rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5"
              >
                {booking.vehicle_photo ? (
                  <img
                    src={booking.vehicle_photo}
                    alt={booking.vehicle_name || "Vehicle"}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-[#111111] text-5xl">
                    🚗
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-3xl font-black">
                        {booking.vehicle_name || "Vehicle not set"}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-[#7a7168]">
                        {booking.plate_number || "No plate"} •{" "}
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

                  <div className="grid gap-3 text-sm font-bold text-[#5f554c] sm:grid-cols-4">
                    <p>Pickup: {formatDate(booking.pickup_date)}</p>
                    <p>Return: {formatDate(booking.return_date)}</p>
                    <p>Time: {booking.return_time || "-"}</p>
                    <p>Balance: {formatMoney(booking.balance)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/rep/mobile/inspections/${booking.id}`}
                      className="block rounded-2xl bg-blue-700 px-5 py-5 text-center text-base font-black text-white shadow-lg"
                    >
                      Start Return Inspection
                    </Link>

                    <Link
                      href={`/rep/mobile/payments/${booking.id}`}
                      className="block rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-center text-base font-black text-white shadow-lg"
                    >
                      Add / View Payment
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <BottomNav active="returns" />
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reserved: "bg-purple-100 text-purple-800",
    confirmed: "bg-purple-100 text-purple-800",
    active: "bg-blue-100 text-blue-800",
    rented: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-700",
    overdue: "bg-red-100 text-red-800",
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
