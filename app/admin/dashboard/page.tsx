import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type PickupReturnRow = {
  id: number;
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string;
  pickup_time: string | null;
  return_date: string;
  return_time: string | null;
  status: string;
  balance: string;
};

export default async function AdminDashboardPage() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  const [vehicleStatusRows] = await db.query(`
    SELECT status, COUNT(*) AS total
    FROM vehicles
    GROUP BY status
  `);

  const vehicleStatusCounts = vehicleStatusRows as {
    status: string;
    total: number;
  }[];

  const availableVehicles = getVehicleCount(vehicleStatusCounts, "available");
  const rentedVehicles = getVehicleCount(vehicleStatusCounts, "rented");
  const reservedVehicles = getVehicleCount(vehicleStatusCounts, "reserved");
  const overdueVehicles = getVehicleCount(vehicleStatusCounts, "overdue");
  const maintenanceVehicles = getVehicleCount(
    vehicleStatusCounts,
    "maintenance"
  );

  const [pickupRows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.pickup_time,
      bookings.return_date,
      bookings.return_time,
      bookings.status,
      bookings.balance,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.pickup_date = ?
    AND bookings.status IN ('pending', 'confirmed')
    ORDER BY bookings.pickup_time ASC
    `,
    [today]
  );

  const todaysPickups = pickupRows as PickupReturnRow[];

  const [returnRows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.pickup_time,
      bookings.return_date,
      bookings.return_time,
      bookings.status,
      bookings.balance,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.return_date = ?
    AND bookings.status = 'active'
    ORDER BY bookings.return_time ASC
    `,
    [today]
  );

  const todaysReturns = returnRows as PickupReturnRow[];

  const [revenueRows] = await db.query(`
    SELECT COALESCE(SUM(amount_paid), 0) AS monthly_revenue
    FROM bookings
    WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
    AND YEAR(created_at) = YEAR(CURRENT_DATE())
    AND status NOT IN ('cancelled')
  `);

  const monthlyRevenue = Number(
    (revenueRows as any[])[0]?.monthly_revenue || 0
  );

  const [balanceRows] = await db.query(`
    SELECT COALESCE(SUM(balance), 0) AS outstanding_balance
    FROM bookings
    WHERE status NOT IN ('cancelled', 'completed')
  `);

  const outstandingBalance = Number(
    (balanceRows as any[])[0]?.outstanding_balance || 0
  );

  const [latestBookingRows] = await db.query(`
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.status,
      bookings.balance,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.created_at DESC
    LIMIT 5
  `);

  const latestBookings = latestBookingRows as PickupReturnRow[];

  return (
    <main className="min-h-screen bg-gray-100">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="dashboard" />

        <section className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500">
                Welcome back, {user.name}. Here is today’s rental activity.
              </p>
            </div>
          </header>

          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="Available Vehicles"
                value={String(availableVehicles)}
                note="Ready to rent"
              />

              <DashboardCard
                title="Rented Vehicles"
                value={String(rentedVehicles)}
                note="Currently out"
              />

              <DashboardCard
                title="Reserved Vehicles"
                value={String(reservedVehicles)}
                note="Upcoming bookings"
              />

              <DashboardCard
                title="Overdue Vehicles"
                value={String(overdueVehicles)}
                note="Needs attention"
              />

              <DashboardCard
                title="Maintenance"
                value={String(maintenanceVehicles)}
                note="Unavailable"
              />

              <DashboardCard
                title="Today’s Pickups"
                value={String(todaysPickups.length)}
                note="Going out today"
              />

              <DashboardCard
                title="Today’s Returns"
                value={String(todaysReturns.length)}
                note="Due back today"
              />

              <DashboardCard
                title="Outstanding Balances"
                value={`$${outstandingBalance.toFixed(2)}`}
                note="Money still owing"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-[#07111f] p-6 text-white shadow-sm">
              <p className="text-sm text-white/60">Monthly Revenue</p>
              <p className="mt-2 text-4xl font-bold">
                ${monthlyRevenue.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-[#d4af37]">
                Based on amount paid from bookings this month.
              </p>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <DashboardTable
                title="Today’s Pickups"
                emptyText="No pickups scheduled for today."
                rows={todaysPickups}
                dateType="pickup"
              />

              <DashboardTable
                title="Today’s Returns"
                emptyText="No active returns scheduled for today."
                rows={todaysReturns}
                dateType="return"
              />
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Latest Bookings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Most recent reservations and rentals.
                  </p>
                </div>

                <Link
                  href="/admin/bookings"
                  className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white"
                >
                  View All
                </Link>
              </div>

              {latestBookings.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No bookings have been created yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Pickup</th>
                        <th className="px-4 py-3">Return</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Balance</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {latestBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-4 py-3 font-semibold">
                            {booking.booking_number}
                          </td>
                          <td className="px-4 py-3">
                            {booking.customer_name}
                          </td>
                          <td className="px-4 py-3">
                            {booking.vehicle_name} / {booking.plate_number}
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(booking.pickup_date)}
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(booking.return_date)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ${Number(booking.balance || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-[#07111f]">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{note}</p>
    </div>
  );
}

function DashboardTable({
  title,
  emptyText,
  rows,
  dateType,
}: {
  title: string;
  emptyText: string;
  rows: PickupReturnRow[];
  dateType: "pickup" | "return";
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">
                    {row.customer_name}
                  </td>
                  <td className="px-4 py-3">
                    {row.vehicle_name} / {row.plate_number}
                  </td>
                  <td className="px-4 py-3">
                    {dateType === "pickup"
                      ? row.pickup_time || "-"
                      : row.return_time || "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${Number(row.balance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function statusClass(status: string) {
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "confirmed") return "bg-purple-100 text-purple-700";
  if (status === "active") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-gray-100 text-gray-700";
  if (status === "overdue") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function getVehicleCount(
  rows: { status: string; total: number }[],
  status: string
) {
  const row = rows.find((item) => item.status === status);
  return Number(row?.total || 0);
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}