import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

export const dynamic = "force-dynamic";

type VehicleStatsRow = RowDataPacket & {
  totalVehicles: number | string | null;
  availableVehicles: number | string | null;
};

type CountRow = RowDataPacket & {
  activeRentals?: number | string | null;
  todaysPickups?: number | string | null;
  todaysReturns?: number | string | null;
};

type MoneyRow = RowDataPacket & {
  monthlyRevenue?: number | string | null;
  outstandingBalance?: number | string | null;
};

type DashboardStats = {
  totalVehicles: number;
  availableVehicles: number;
  activeRentals: number;
  todaysPickups: number;
  todaysReturns: number;
  monthlyRevenue: number;
  outstandingBalance: number;
};

type RecentBooking = RowDataPacket & {
  id: number;
  booking_number: string;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string | Date;
  return_date: string | Date;
  total_amount: number | string | null;
  amount_paid: number | string | null;
  balance: number | string | null;
  status: string;
};

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-TT", {
    style: "currency",
    currency: "TTD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(status: string) {
  return String(status || "").split("_").join(" ");
}

function getStatusClass(status: string) {
  const cleanStatus = String(status || "").toLowerCase();

  if (cleanStatus === "pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (cleanStatus === "confirmed") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (cleanStatus === "active") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (cleanStatus === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (cleanStatus === "cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (cleanStatus === "overdue") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

async function getDashboardData() {
  const [vehicleRows] = await db.query<VehicleStatsRow[]>(`
    SELECT 
      COUNT(*) AS totalVehicles,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS availableVehicles
    FROM vehicles
  `);

  const [activeRows] = await db.query<CountRow[]>(`
    SELECT COUNT(*) AS activeRentals
    FROM bookings
    WHERE status = 'active'
  `);

  const [pickupRows] = await db.query<CountRow[]>(`
    SELECT COUNT(*) AS todaysPickups
    FROM bookings
    WHERE DATE(pickup_date) = CURDATE()
    AND status IN ('confirmed', 'active')
  `);

  const [returnRows] = await db.query<CountRow[]>(`
    SELECT COUNT(*) AS todaysReturns
    FROM bookings
    WHERE DATE(return_date) = CURDATE()
    AND status IN ('active', 'overdue')
  `);

  const [revenueRows] = await db.query<MoneyRow[]>(`
    SELECT COALESCE(SUM(amount_paid), 0) AS monthlyRevenue
    FROM bookings
    WHERE MONTH(created_at) = MONTH(CURDATE())
    AND YEAR(created_at) = YEAR(CURDATE())
  `);

  const [balanceRows] = await db.query<MoneyRow[]>(`
    SELECT COALESCE(SUM(balance), 0) AS outstandingBalance
    FROM bookings
    WHERE balance > 0
    AND status IN ('pending', 'confirmed', 'active', 'overdue')
  `);

  const [recentBookings] = await db.query<RecentBooking[]>(`
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.total_amount,
      bookings.amount_paid,
      bookings.balance,
      bookings.status,
      customers.full_name AS customer_name,
      customers.phone,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    INNER JOIN customers ON customers.id = bookings.customer_id
    INNER JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.id DESC
    LIMIT 8
  `);

  const stats: DashboardStats = {
    totalVehicles: Number(vehicleRows[0]?.totalVehicles || 0),
    availableVehicles: Number(vehicleRows[0]?.availableVehicles || 0),
    activeRentals: Number(activeRows[0]?.activeRentals || 0),
    todaysPickups: Number(pickupRows[0]?.todaysPickups || 0),
    todaysReturns: Number(returnRows[0]?.todaysReturns || 0),
    monthlyRevenue: Number(revenueRows[0]?.monthlyRevenue || 0),
    outstandingBalance: Number(balanceRows[0]?.outstandingBalance || 0),
  };

  return {
    stats,
    recentBookings,
  };
}

export default async function AdminDashboardPage() {
  const token =
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

  const { stats, recentBookings } = await getDashboardData();

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="dashboard" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero
            variant="dashboard"
            label="Admin Overview"
            title="Dashboard"
            subtitle="Monitor bookings, fleet activity, customers, payments, and business performance for Roberts Auto Rental."
          />

          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/bookings/new"
              className="rounded-3xl bg-[#d4af37] px-5 py-4 text-center text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
            >
              New Booking
            </Link>

            <Link
              href="/admin/customers/new"
              className="rounded-3xl border border-[#ead7a2] bg-white px-5 py-4 text-center text-sm font-black text-slate-950 shadow-sm transition hover:border-[#d4af37] hover:bg-[#fff9e8]"
            >
              Add Customer
            </Link>

            <Link
              href="/admin/vehicles/new"
              className="rounded-3xl border border-[#ead7a2] bg-white px-5 py-4 text-center text-sm font-black text-slate-950 shadow-sm transition hover:border-[#d4af37] hover:bg-[#fff9e8]"
            >
              Add Vehicle
            </Link>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Vehicles"
              value={String(stats.totalVehicles)}
              helper="Fleet vehicles"
              tone="dark"
            />

            <DashboardCard
              title="Available Vehicles"
              value={String(stats.availableVehicles)}
              helper="Ready to rent"
              tone="green"
            />

            <DashboardCard
              title="Active Rentals"
              value={String(stats.activeRentals)}
              helper="Currently checked out"
              tone="blue"
            />

            <DashboardCard
              title="Today’s Pickups"
              value={String(stats.todaysPickups)}
              helper="Scheduled for today"
              tone="gold"
            />

            <DashboardCard
              title="Today’s Returns"
              value={String(stats.todaysReturns)}
              helper="Due back today"
              tone="orange"
            />

            <DashboardCard
              title="Monthly Revenue"
              value={formatMoney(stats.monthlyRevenue)}
              helper="Collected this month"
              tone="green"
            />

            <DashboardCard
              title="Outstanding Balance"
              value={formatMoney(stats.outstandingBalance)}
              helper="Unpaid customer balances"
              tone="red"
            />

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Quick Access
              </p>

              <div className="mt-4 grid gap-2">
                <Link
                  href="/admin/bookings"
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-[#fff9e8] hover:text-slate-950"
                >
                  View Bookings
                </Link>

                <Link
                  href="/admin/calendar"
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-[#fff9e8] hover:text-slate-950"
                >
                  Fleet Calendar
                </Link>

                <Link
                  href="/admin/reports"
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-[#fff9e8] hover:text-slate-950"
                >
                  Reports
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Recent Activity
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Recent Bookings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review the latest customer bookings, vehicles, rental dates,
                  balances, and booking status.
                </p>
              </div>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
              >
                View All Bookings
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-slate-950">
                  No bookings yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  New bookings will appear here once they are created.
                </p>

                <Link
                  href="/admin/bookings/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
                >
                  Create First Booking
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-100 md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Booking
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Customer
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Vehicle
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Dates
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Balance
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Status
                          </th>
                          <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {recentBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="transition hover:bg-[#fbf7ef]"
                          >
                            <td className="px-5 py-5 align-top">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="font-black text-[#8b0000] transition hover:text-[#b8860b]"
                              >
                                {booking.booking_number}
                              </Link>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {booking.customer_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {booking.phone}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-bold text-slate-800">
                                {booking.vehicle_name}
                              </p>
                              <p className="mt-1 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-bold text-slate-800">
                                {formatDate(booking.pickup_date)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Return: {formatDate(booking.return_date)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {formatMoney(booking.balance)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Remaining
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <StatusBadge status={booking.status} />
                            </td>

                            <td className="px-5 py-5 text-right align-top">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="inline-flex rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-[#c9a227]"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:hidden">
                  {recentBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}`}
                      className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:bg-[#fff9e8]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#8b0000]">
                            {booking.booking_number}
                          </p>
                          <p className="mt-1 font-black text-slate-950">
                            {booking.customer_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {booking.phone}
                          </p>
                        </div>

                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600">
                        <p>
                          <span className="font-black text-slate-950">
                            Vehicle:
                          </span>{" "}
                          {booking.vehicle_name} — {booking.plate_number}
                        </p>

                        <p>
                          <span className="font-black text-slate-950">
                            Dates:
                          </span>{" "}
                          {formatDate(booking.pickup_date)} to{" "}
                          {formatDate(booking.return_date)}
                        </p>

                        <p>
                          <span className="font-black text-slate-950">
                            Balance:
                          </span>{" "}
                          {formatMoney(booking.balance)}
                        </p>
                      </div>

                      <div className="mt-4 inline-flex rounded-2xl bg-[#d4af37] px-4 py-3 text-sm font-black text-slate-950">
                        View Booking
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-[#ead7a2] bg-[#fff9e8] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Dashboard Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  This dashboard depends on accurate bookings, vehicle statuses,
                  payments, and customer records. Keep daily activity updated so
                  the Roberts Auto Rental team can make faster office decisions.
                </p>
              </div>

              <span className="rounded-full bg-[#d4af37] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                Roberts Auto Rental
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: "dark" | "green" | "blue" | "gold" | "orange" | "red";
}) {
  const toneClass = {
    dark: "text-slate-950",
    green: "text-emerald-700",
    blue: "text-blue-700",
    gold: "text-[#b8860b]",
    orange: "text-orange-700",
    red: "text-red-700",
  }[tone];

  return (
    <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusClass(
        status
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}