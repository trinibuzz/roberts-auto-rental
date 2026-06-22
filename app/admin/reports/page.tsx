import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

type SalesRow = RowDataPacket & {
  today_sales?: string | number;
  monthly_revenue?: string | number;
  outstanding_balance?: string | number;
  active_rentals?: string | number;
  overdue_rentals?: string | number;
};

type VehicleProfitRow = RowDataPacket & {
  vehicle_id: number;
  vehicle_name: string;
  plate_number: string;
  rental_revenue: string | number | null;
  maintenance_cost: string | number | null;
  vehicle_profit: string | number | null;
};

type OutstandingRow = RowDataPacket & {
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string | Date;
  return_date: string | Date;
  status: string;
  total_amount: string | number | null;
  amount_paid: string | number | null;
  balance: string | number | null;
};

type ActiveRentalRow = RowDataPacket & {
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string | Date;
  return_date: string | Date;
  balance: string | number | null;
};

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-TT", {
    style: "currency",
    currency: "TTD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateValue: string | Date) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadge(status: string) {
  const normalized = status?.toLowerCase();

  if (normalized === "active") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "overdue") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "reserved") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "cancelled") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatStatus(status: string) {
  return status.split("_").join(" ");
}

export default async function ReportsPage() {
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

  const [todaySalesRows] = await db.query<SalesRow[]>(`
    SELECT COALESCE(SUM(amount), 0) AS today_sales
    FROM payments
    WHERE DATE(created_at) = CURRENT_DATE()
  `);

  const todaySales = Number(todaySalesRows[0]?.today_sales || 0);

  const [monthlyRevenueRows] = await db.query<SalesRow[]>(`
    SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
    FROM payments
    WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
    AND YEAR(created_at) = YEAR(CURRENT_DATE())
  `);

  const monthlyRevenue = Number(
    monthlyRevenueRows[0]?.monthly_revenue || 0
  );

  const [outstandingRows] = await db.query<SalesRow[]>(`
    SELECT COALESCE(SUM(balance), 0) AS outstanding_balance
    FROM bookings
    WHERE status NOT IN ('cancelled', 'completed')
  `);

  const outstandingBalance = Number(
    outstandingRows[0]?.outstanding_balance || 0
  );

  const [activeRentalCountRows] = await db.query<SalesRow[]>(`
    SELECT COUNT(*) AS active_rentals
    FROM bookings
    WHERE status = 'active'
  `);

  const activeRentalsCount = Number(
    activeRentalCountRows[0]?.active_rentals || 0
  );

  const [overdueCountRows] = await db.query<SalesRow[]>(`
    SELECT COUNT(*) AS overdue_rentals
    FROM bookings
    WHERE status = 'overdue'
  `);

  const overdueRentalsCount = Number(
    overdueCountRows[0]?.overdue_rentals || 0
  );

  const [vehicleProfits] = await db.query<VehicleProfitRow[]>(`
    SELECT
      vehicles.id AS vehicle_id,
      vehicles.vehicle_name,
      vehicles.plate_number,
      COALESCE(SUM(CASE 
        WHEN bookings.status NOT IN ('cancelled') 
        THEN bookings.amount_paid 
        ELSE 0 
      END), 0) AS rental_revenue,
      COALESCE(maintenance_totals.maintenance_cost, 0) AS maintenance_cost,
      (
        COALESCE(SUM(CASE 
          WHEN bookings.status NOT IN ('cancelled') 
          THEN bookings.amount_paid 
          ELSE 0 
        END), 0) - COALESCE(maintenance_totals.maintenance_cost, 0)
      ) AS vehicle_profit
    FROM vehicles
    LEFT JOIN bookings ON bookings.vehicle_id = vehicles.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS maintenance_cost
      FROM maintenance_records
      GROUP BY vehicle_id
    ) AS maintenance_totals ON maintenance_totals.vehicle_id = vehicles.id
    GROUP BY 
      vehicles.id, 
      vehicles.vehicle_name, 
      vehicles.plate_number, 
      maintenance_totals.maintenance_cost
    ORDER BY vehicle_profit DESC
  `);

  const [outstandingBookings] = await db.query<OutstandingRow[]>(`
    SELECT
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.status,
      bookings.total_amount,
      bookings.amount_paid,
      bookings.balance,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.balance > 0
    AND bookings.status NOT IN ('cancelled', 'completed')
    ORDER BY bookings.balance DESC
    LIMIT 10
  `);

  const [activeRentals] = await db.query<ActiveRentalRow[]>(`
    SELECT
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.balance,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.status = 'active'
    ORDER BY bookings.return_date ASC
    LIMIT 10
  `);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="reports" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero
            variant="reports"
            label="Business Reports"
            title="Reports"
            subtitle="Review daily sales, monthly revenue, outstanding balances, active rentals, overdue rentals, and vehicle profitability for Roberts Auto Rental."
          />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ReportCard
              title="Today’s Sales"
              value={formatMoney(todaySales)}
              helper="Payments received today"
              tone="gold"
            />

            <ReportCard
              title="Monthly Revenue"
              value={formatMoney(monthlyRevenue)}
              helper="Current month collected"
              tone="green"
            />

            <ReportCard
              title="Outstanding Balances"
              value={formatMoney(outstandingBalance)}
              helper="Open booking balances"
              tone="red"
            />

            <ReportCard
              title="Active Rentals"
              value={String(activeRentalsCount)}
              helper="Vehicles currently out"
              tone="blue"
            />

            <ReportCard
              title="Overdue Rentals"
              value={String(overdueRentalsCount)}
              helper="Needs follow-up"
              tone="orange"
            />
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                Profit by Vehicle
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Vehicle Profitability
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vehicle profit is calculated from rental revenue collected minus
                recorded maintenance cost.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Vehicle
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Plate
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Rental Revenue
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Maintenance Cost
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Profit
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {vehicleProfits.length === 0 ? (
                      <tr>
                        <td
                          className="px-5 py-8 text-center text-sm text-slate-500"
                          colSpan={5}
                        >
                          No vehicle profit data yet.
                        </td>
                      </tr>
                    ) : (
                      vehicleProfits.map((row) => {
                        const profit = Number(row.vehicle_profit || 0);

                        return (
                          <tr
                            key={row.vehicle_id}
                            className="transition hover:bg-[#fbf7ef]"
                          >
                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {row.vehicle_name}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                                {row.plate_number}
                              </span>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-emerald-700">
                                {formatMoney(row.rental_revenue)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-red-700">
                                {formatMoney(row.maintenance_cost)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p
                                className={`font-black ${
                                  profit >= 0
                                    ? "text-slate-950"
                                    : "text-red-700"
                                }`}
                              >
                                {formatMoney(row.vehicle_profit)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Net performance
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Outstanding Balances
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Top Open Balances
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bookings that still have money owing.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
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
                          Balance
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {outstandingBookings.length === 0 ? (
                        <tr>
                          <td
                            className="px-5 py-8 text-center text-sm text-slate-500"
                            colSpan={4}
                          >
                            No outstanding balances.
                          </td>
                        </tr>
                      ) : (
                        outstandingBookings.map((booking) => (
                          <tr
                            key={booking.booking_number}
                            className="transition hover:bg-[#fbf7ef]"
                          >
                            <td className="px-5 py-5 align-top">
                              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                                {booking.booking_number}
                              </span>

                              <div className="mt-3">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusBadge(
                                    booking.status
                                  )}`}
                                >
                                  {formatStatus(booking.status)}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {booking.customer_name}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-bold text-slate-800">
                                {booking.vehicle_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-red-700">
                                {formatMoney(booking.balance)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Amount owing
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Active Rentals
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Vehicles Checked Out
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vehicles currently rented and ordered by return date.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
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
                          Return
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activeRentals.length === 0 ? (
                        <tr>
                          <td
                            className="px-5 py-8 text-center text-sm text-slate-500"
                            colSpan={4}
                          >
                            No active rentals right now.
                          </td>
                        </tr>
                      ) : (
                        activeRentals.map((booking) => (
                          <tr
                            key={booking.booking_number}
                            className="transition hover:bg-[#fbf7ef]"
                          >
                            <td className="px-5 py-5 align-top">
                              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                                {booking.booking_number}
                              </span>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {booking.customer_name}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-bold text-slate-800">
                                {booking.vehicle_name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-bold text-slate-800">
                                {formatDate(booking.return_date)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Scheduled return
                              </p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-[#ead7a2] bg-[#fff9e8] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Reports Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  These reports depend on accurate payment, booking, and
                  maintenance records. Keep payments and vehicle costs updated so
                  the business numbers remain useful for decision making.
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

function ReportCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: "gold" | "green" | "red" | "blue" | "orange";
}) {
  const toneClass = {
    gold: "text-[#b8860b]",
    green: "text-emerald-700",
    red: "text-red-700",
    blue: "text-blue-700",
    orange: "text-orange-700",
  }[tone];

  return (
    <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}