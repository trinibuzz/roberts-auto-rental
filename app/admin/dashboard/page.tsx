import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

export const dynamic = "force-dynamic";

type CountRow = {
  total: number;
};

type MoneyRow = {
  total: string | number | null;
};

type BookingRow = {
  id: number;
  booking_number: string | null;
  status: string;
  pickup_date: string | Date | null;
  return_date: string | Date | null;
  customer_name: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
  total_amount: string | number | null;
  amount_paid: string | number | null;
  balance: string | number | null;
};

async function requireAdminAccess() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

function getFirstTotal(rows: unknown) {
  const data = rows as CountRow[];
  return Number(data[0]?.total || 0);
}

function getFirstMoney(rows: unknown) {
  const data = rows as MoneyRow[];
  return Number(data[0]?.total || 0);
}

export default async function AdminDashboardPage() {
  await requireAdminAccess();

  const today = new Date().toISOString().slice(0, 10);

  const [
    [bookingRows],
    [customerRows],
    [availableRows],
    [rentedRows],
    [pickupRows],
    [returnRows],
    [balanceRows],
    [recentRows],
  ] = await Promise.all([
    db.query(
      `
        SELECT COUNT(*) AS total
        FROM bookings
      `
    ),
    db.query(
      `
        SELECT COUNT(*) AS total
        FROM customers
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
        FROM vehicles
        WHERE LOWER(status) IN ('rented', 'active')
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
        SELECT COALESCE(SUM(balance), 0) AS total
        FROM bookings
        WHERE LOWER(status) NOT IN ('cancelled', 'completed')
      `
    ),
    db.query(
      `
        SELECT
          bookings.id,
          bookings.booking_number,
          bookings.status,
          bookings.pickup_date,
          bookings.return_date,
          bookings.total_amount,
          bookings.amount_paid,
          bookings.balance,
          customers.full_name AS customer_name,
          vehicles.vehicle_name,
          vehicles.plate_number
        FROM bookings
        LEFT JOIN customers ON customers.id = bookings.customer_id
        LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
        ORDER BY bookings.created_at DESC
        LIMIT 6
      `
    ),
  ]);

  const totalBookings = getFirstTotal(bookingRows);
  const totalCustomers = getFirstTotal(customerRows);
  const availableVehicles = getFirstTotal(availableRows);
  const rentedVehicles = getFirstTotal(rentedRows);
  const todayPickups = getFirstTotal(pickupRows);
  const todayReturns = getFirstTotal(returnRows);
  const outstandingBalance = getFirstMoney(balanceRows);
  const recentBookings = recentRows as BookingRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="dashboard" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b98320]">
                  Roberts Auto Rental
                </p>

                <h1 className="mt-2 font-serif text-4xl font-black text-[#1d1d1f]">
                  Admin Dashboard
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Quick overview of bookings, vehicles, payments, staff, and
                  today&apos;s rental activity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/bookings/new"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <span className="mr-2 text-xl leading-none">+</span>
                  New Booking
                </Link>

                <Link
                  href="/admin/users"
                  className="inline-flex items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#111111] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Employee Manager
                </Link>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[260px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(212,175,55,0.32),transparent_34%),linear-gradient(90deg,#050505_0%,#111111_48%,#3a2410_100%)]" />

                <div className="absolute inset-0 opacity-30">
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_35%,rgba(212,175,55,0.12)_100%)]" />
                </div>

                <div className="relative grid min-h-[260px] gap-8 px-8 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10">
                  <div className="max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Fleet Command Center
                    </p>

                    <h2 className="mt-4 text-4xl font-black uppercase leading-tight text-white md:text-5xl">
                      Premium Control.
                      <br />
                      Better Operations.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 max-w-xl text-sm font-semibold leading-7 text-white/75">
                      Manage bookings, employees, vehicles, payments, pickup
                      workflows, return workflows, inspections, and signatures
                      from one clean office system.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d4af37]">
                      Outstanding Balance
                    </p>

                    <p className="mt-3 text-5xl font-black text-white">
                      {formatMoney(outstandingBalance)}
                    </p>

                    <p className="mt-3 text-sm font-semibold text-white/65">
                      Current open booking balances.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="Bookings"
                value={String(totalBookings)}
                note="All rental bookings"
                href="/admin/bookings"
                tone="gold"
              />

              <DashboardCard
                title="Customers"
                value={String(totalCustomers)}
                note="Customer records"
                href="/admin/customers"
                tone="black"
              />

              <DashboardCard
                title="Available Cars"
                value={String(availableVehicles)}
                note="Ready to rent"
                href="/admin/vehicles"
                tone="green"
              />

              <DashboardCard
                title="Rented Cars"
                value={String(rentedVehicles)}
                note="Currently out"
                href="/admin/vehicles"
                tone="blue"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <ActionPanel
                title="Today's Pickups"
                value={String(todayPickups)}
                note="Vehicles scheduled to go out today."
                href="/rep/pickups"
                button="Open Pickups"
              />

              <ActionPanel
                title="Today's Returns"
                value={String(todayReturns)}
                note="Vehicles expected to return today."
                href="/rep/returns"
                button="Open Returns"
              />

              <ActionPanel
                title="Employee Manager"
                value="Users"
                note="Add, edit, disable, and manage staff accounts."
                href="/admin/users"
                button="Manage Employees"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="flex flex-col gap-4 border-b border-[#eee9df] px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                    Recent Bookings
                  </h3>

                  <p className="mt-1 text-sm text-[#7a7168]">
                    Latest rental activity in the office system.
                  </p>
                </div>

                <Link
                  href="/admin/bookings"
                  className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black text-[#4b443d] shadow-sm"
                >
                  View All Bookings
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <h3 className="text-2xl font-black text-[#1d1d1f]">
                    No bookings created yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Create your first rental booking to begin.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#eee9df]">
                  {recentBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="grid gap-4 px-6 py-5 transition hover:bg-[#fbfaf8] md:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-black text-[#1d1d1f]">
                          {booking.booking_number || `#${booking.id}`}
                        </p>

                        <p className="mt-1 text-sm text-[#7a7168]">
                          {booking.customer_name || "Customer not set"}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-[#1d1d1f]">
                          {booking.vehicle_name || "Vehicle not set"}
                        </p>

                        <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                          {booking.plate_number || "No plate"}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-[#5f554c]">
                        <p>Pickup: {formatDate(booking.pickup_date)}</p>
                        <p>Return: {formatDate(booking.return_date)}</p>
                      </div>

                      <div className="text-sm font-semibold text-[#5f554c]">
                        <p>Balance</p>
                        <p className="font-black text-[#1d1d1f]">
                          {formatMoney(booking.balance)}
                        </p>
                      </div>

                      <StatusBadge status={booking.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <footer className="pb-6 text-center text-sm text-[#9a9085]">
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
              © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
              rights reserved.
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  note,
  href,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  href: string;
  tone: "gold" | "black" | "green" | "blue";
}) {
  const styles = {
    gold: "bg-[#fff9e8] text-[#b98320]",
    black: "bg-[#111111] text-white",
    green: "bg-green-50 text-green-800",
    blue: "bg-blue-50 text-blue-800",
  };

  return (
    <Link
      href={href}
      className={`rounded-3xl p-6 shadow-xl shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl ${styles[tone]}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
        {title}
      </p>

      <p className="mt-4 text-5xl font-black">{value}</p>

      <p className="mt-2 text-sm font-bold opacity-75">{note}</p>
    </Link>
  );
}

function ActionPanel({
  title,
  value,
  note,
  href,
  button,
}: {
  title: string;
  value: string;
  note: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#1d1d1f]">{value}</p>

      <p className="mt-2 min-h-[44px] text-sm font-semibold leading-6 text-[#7a7168]">
        {note}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-[#0b0b0c] px-5 py-4 text-sm font-black text-white shadow-sm hover:bg-[#1c1c1e]"
      >
        {button}
      </Link>
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
      className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: string | number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}
