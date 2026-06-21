import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import mysql from "mysql2/promise";
import AdminSidebar from "../components/AdminSidebar";
import AdminMobileHeader from "../components/AdminMobileHeader";

export const dynamic = "force-dynamic";

type DashboardStats = {
  totalVehicles: number;
  availableVehicles: number;
  activeRentals: number;
  todaysPickups: number;
  todaysReturns: number;
  monthlyRevenue: number;
  outstandingBalance: number;
};

type RecentBooking = {
  id: number;
  booking_number: string;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string;
  return_date: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string;
};

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function getDashboardData() {
  const pool = createPool();

  const [vehicleRows] = await pool.execute(
    `
      SELECT 
        COUNT(*) AS totalVehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS availableVehicles
      FROM vehicles
    `
  );

  const [activeRows] = await pool.execute(
    `
      SELECT COUNT(*) AS activeRentals
      FROM bookings
      WHERE status = 'active'
    `
  );

  const [pickupRows] = await pool.execute(
    `
      SELECT COUNT(*) AS todaysPickups
      FROM bookings
      WHERE DATE(pickup_date) = CURDATE()
      AND status IN ('confirmed', 'active')
    `
  );

  const [returnRows] = await pool.execute(
    `
      SELECT COUNT(*) AS todaysReturns
      FROM bookings
      WHERE DATE(return_date) = CURDATE()
      AND status IN ('active', 'overdue')
    `
  );

  const [revenueRows] = await pool.execute(
    `
      SELECT COALESCE(SUM(amount_paid), 0) AS monthlyRevenue
      FROM bookings
      WHERE MONTH(created_at) = MONTH(CURDATE())
      AND YEAR(created_at) = YEAR(CURDATE())
    `
  );

  const [balanceRows] = await pool.execute(
    `
      SELECT COALESCE(SUM(balance), 0) AS outstandingBalance
      FROM bookings
      WHERE balance > 0
      AND status IN ('pending', 'confirmed', 'active', 'overdue')
    `
  );

  const [bookingRows] = await pool.execute(
    `
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
    `
  );

  const vehicles = vehicleRows as Array<{
    totalVehicles: number;
    availableVehicles: number;
  }>;

  const active = activeRows as Array<{ activeRentals: number }>;
  const pickups = pickupRows as Array<{ todaysPickups: number }>;
  const returns = returnRows as Array<{ todaysReturns: number }>;
  const revenue = revenueRows as Array<{ monthlyRevenue: number }>;
  const balances = balanceRows as Array<{ outstandingBalance: number }>;

  const stats: DashboardStats = {
    totalVehicles: Number(vehicles[0]?.totalVehicles || 0),
    availableVehicles: Number(vehicles[0]?.availableVehicles || 0),
    activeRentals: Number(active[0]?.activeRentals || 0),
    todaysPickups: Number(pickups[0]?.todaysPickups || 0),
    todaysReturns: Number(returns[0]?.todaysReturns || 0),
    monthlyRevenue: Number(revenue[0]?.monthlyRevenue || 0),
    outstandingBalance: Number(balances[0]?.outstandingBalance || 0),
  };

  return {
    stats,
    recentBookings: bookingRows as RecentBooking[],
  };
}

export default async function AdminDashboardPage() {
  const cookieStore = cookies();

  const adminToken =
    cookieStore.get("robers_token")?.value ||
    cookieStore.get("roberts_token")?.value;

  if (!adminToken) {
    redirect("/admin/login");
  }

  const { stats, recentBookings } = await getDashboardData();

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#07111f]">
      <AdminMobileHeader />

      <div className="flex">
        <AdminSidebar active="dashboard" />

        <section className="min-h-screen flex-1 px-5 py-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#07111f] via-[#0b1f3a] to-[#26070a] p-6 text-white shadow-xl md:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Roberts Auto Rental
              </p>

              <h1 className="mt-3 text-4xl font-black md:text-6xl">
                Admin Dashboard
              </h1>

              <p className="mt-4 max-w-3xl text-white/70">
                Manage vehicles, customers, bookings, payments, inspections,
                maintenance, and reports from one office system.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admin/bookings/new"
                  className="rounded-xl bg-[#d4af37] px-5 py-4 text-center font-black text-[#07111f] hover:bg-[#c79f2f]"
                >
                  New Booking
                </Link>

                <Link
                  href="/admin/customers/new"
                  className="rounded-xl border border-white/20 px-5 py-4 text-center font-bold text-white hover:bg-white/10"
                >
                  Add Customer
                </Link>

                <Link
                  href="/admin/vehicles/new"
                  className="rounded-xl border border-white/20 px-5 py-4 text-center font-bold text-white hover:bg-white/10"
                >
                  Add Vehicle
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Vehicles"
                value={stats.totalVehicles}
                note="Fleet vehicles"
              />

              <StatCard
                title="Available Vehicles"
                value={stats.availableVehicles}
                note="Ready to rent"
              />

              <StatCard
                title="Active Rentals"
                value={stats.activeRentals}
                note="Currently out"
              />

              <StatCard
                title="Today's Pickups"
                value={stats.todaysPickups}
                note="Scheduled today"
              />

              <StatCard
                title="Today's Returns"
                value={stats.todaysReturns}
                note="Due back today"
              />

              <MoneyCard
                title="Monthly Revenue"
                value={stats.monthlyRevenue}
                note="Payments collected this month"
              />

              <MoneyCard
                title="Outstanding Balance"
                value={stats.outstandingBalance}
                note="Unpaid customer balance"
              />

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold text-gray-500">Quick Access</p>

                <div className="mt-4 grid gap-2">
                  <Link
                    href="/admin/bookings"
                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold hover:bg-gray-200"
                  >
                    View Bookings
                  </Link>

                  <Link
                    href="/admin/calendar"
                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold hover:bg-gray-200"
                  >
                    Fleet Calendar
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold hover:bg-gray-200"
                  >
                    Reports
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#8b0000]">
                    Recent Activity
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Recent Bookings
                  </h2>
                </div>

                <Link
                  href="/admin/bookings"
                  className="rounded-xl bg-[#07111f] px-5 py-3 text-center text-sm font-bold text-white hover:bg-[#0b1f3a]"
                >
                  View All Bookings
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <h3 className="text-xl font-black">No bookings yet</h3>
                  <p className="mt-2 text-gray-500">
                    New bookings will appear here once they are created.
                  </p>

                  <Link
                    href="/admin/bookings/new"
                    className="mt-5 inline-block rounded-xl bg-[#d4af37] px-5 py-3 font-black text-[#07111f] hover:bg-[#c79f2f]"
                  >
                    Create First Booking
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-600">
                        <tr>
                          <th className="px-4 py-3">Booking</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Vehicle</th>
                          <th className="px-4 py-3">Dates</th>
                          <th className="px-4 py-3">Balance</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {recentBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="font-black text-[#8b0000] hover:underline"
                              >
                                {booking.booking_number}
                              </Link>
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-bold">
                                {booking.customer_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.phone}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-bold">
                                {booking.vehicle_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-gray-600">
                              <p>{formatDate(booking.pickup_date)}</p>
                              <p>{formatDate(booking.return_date)}</p>
                            </td>

                            <td className="px-4 py-4 font-bold">
                              {formatMoney(booking.balance)}
                            </td>

                            <td className="px-4 py-4">
                              <StatusBadge status={booking.status} />
                            </td>

                            <td className="px-4 py-4 text-right">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="rounded-lg bg-[#d4af37] px-4 py-2 text-xs font-black text-[#07111f] hover:bg-[#c79f2f]"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 md:hidden">
                    {recentBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5 hover:bg-gray-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[#8b0000]">
                              {booking.booking_number}
                            </p>
                            <p className="mt-1 font-bold">
                              {booking.customer_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.phone}
                            </p>
                          </div>

                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-gray-600">
                          <p>
                            <span className="font-bold text-[#07111f]">
                              Vehicle:
                            </span>{" "}
                            {booking.vehicle_name} — {booking.plate_number}
                          </p>

                          <p>
                            <span className="font-bold text-[#07111f]">
                              Dates:
                            </span>{" "}
                            {formatDate(booking.pickup_date)} to{" "}
                            {formatDate(booking.return_date)}
                          </p>

                          <p>
                            <span className="font-bold text-[#07111f]">
                              Balance:
                            </span>{" "}
                            {formatMoney(booking.balance)}
                          </p>
                        </div>

                        <div className="mt-4 inline-block rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-black text-[#07111f]">
                          View Booking
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#07111f]">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{note}</p>
    </div>
  );
}

function MoneyCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#07111f]">
        {formatMoney(value)}
      </p>
      <p className="mt-2 text-sm text-gray-500">{note}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-purple-100 text-purple-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}