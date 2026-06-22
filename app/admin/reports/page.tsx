import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type VehicleProfitRow = {
  vehicle_id: number;
  vehicle_name: string;
  plate_number: string;
  rental_revenue: string | number | null;
  maintenance_cost: string | number | null;
  vehicle_profit: string | number | null;
};

type OutstandingRow = {
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

type ActiveRentalRow = {
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string | Date;
  return_date: string | Date;
  balance: string | number | null;
};

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

  const [todaySalesRows] = await db.query(`
    SELECT COALESCE(SUM(amount), 0) AS today_sales
    FROM payments
    WHERE DATE(created_at) = CURRENT_DATE()
  `);

  const todaySales = Number((todaySalesRows as any[])[0]?.today_sales || 0);

  const [monthlyRevenueRows] = await db.query(`
    SELECT COALESCE(SUM(amount), 0) AS monthly_revenue
    FROM payments
    WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
    AND YEAR(created_at) = YEAR(CURRENT_DATE())
  `);

  const monthlyRevenue = Number(
    (monthlyRevenueRows as any[])[0]?.monthly_revenue || 0
  );

  const [outstandingRows] = await db.query(`
    SELECT COALESCE(SUM(balance), 0) AS outstanding_balance
    FROM bookings
    WHERE status NOT IN ('cancelled', 'completed')
  `);

  const outstandingBalance = Number(
    (outstandingRows as any[])[0]?.outstanding_balance || 0
  );

  const [activeRentalCountRows] = await db.query(`
    SELECT COUNT(*) AS active_rentals
    FROM bookings
    WHERE status = 'active'
  `);

  const activeRentalsCount = Number(
    (activeRentalCountRows as any[])[0]?.active_rentals || 0
  );

  const [overdueCountRows] = await db.query(`
    SELECT COUNT(*) AS overdue_rentals
    FROM bookings
    WHERE status = 'overdue'
  `);

  const overdueRentalsCount = Number(
    (overdueCountRows as any[])[0]?.overdue_rentals || 0
  );

  const [vehicleProfitRows] = await db.query(`
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
    GROUP BY vehicles.id, vehicles.vehicle_name, vehicles.plate_number, maintenance_totals.maintenance_cost
    ORDER BY vehicle_profit DESC
  `);

  const vehicleProfits = vehicleProfitRows as VehicleProfitRow[];

  const [outstandingBookingRows] = await db.query(`
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

  const outstandingBookings = outstandingBookingRows as OutstandingRow[];

  const [activeRentalRows] = await db.query(`
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

  const activeRentals = activeRentalRows as ActiveRentalRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="reports" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div>
              <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                Reports
              </h1>

              <p className="mt-2 text-sm text-[#6b6257]">
                Review sales, revenue, balances, active rentals, overdue
                rentals, and vehicle profitability.
              </p>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[230px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(90deg,#050505_0%,#111111_45%,#3a2410_100%)]" />

                <div className="absolute inset-0 opacity-25">
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_35%,rgba(212,175,55,0.12)_100%)]" />
                </div>

                <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
                  <div className="max-w-xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Roberts Auto Rental
                    </p>

                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
                      Business Reports.
                      <br />
                      Smarter Decisions.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Know what is moving the business.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Today’s Sales"
                value={formatMoney(todaySales)}
                note="Payments received today"
              />

              <StatCard
                title="Monthly Revenue"
                value={formatMoney(monthlyRevenue)}
                note="Current month collected"
              />

              <StatCard
                title="Outstanding"
                value={formatMoney(outstandingBalance)}
                note="Open booking balances"
              />

              <StatCard
                title="Active Rentals"
                value={String(activeRentalsCount)}
                note="Currently checked out"
              />

              <StatCard
                title="Overdue Rentals"
                value={String(overdueRentalsCount)}
                note="Needs follow-up"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="flex flex-col gap-4 border-b border-[#eee9df] px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl text-[#b98320]">
                    ▣
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                      Profit by Vehicle
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      Vehicle profit = rental revenue collected minus
                      maintenance cost.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                    <tr>
                      <th className="px-7 py-5">Vehicle</th>
                      <th className="px-7 py-5">Plate</th>
                      <th className="px-7 py-5">Rental Revenue</th>
                      <th className="px-7 py-5">Maintenance Cost</th>
                      <th className="px-7 py-5">Profit</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#eee9df]">
                    {vehicleProfits.length === 0 ? (
                      <tr>
                        <td className="px-7 py-8 text-[#7a7168]" colSpan={5}>
                          No vehicle profit data yet.
                        </td>
                      </tr>
                    ) : (
                      vehicleProfits.map((row) => (
                        <tr
                          key={row.vehicle_id}
                          className="transition hover:bg-[#fbfaf8]"
                        >
                          <td className="px-7 py-6 align-top">
                            <p className="font-black text-[#1d1d1f]">
                              {row.vehicle_name}
                            </p>
                          </td>

                          <td className="px-7 py-6 align-top">
                            <span className="rounded-xl border border-[#eee9df] bg-[#fbfaf8] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1d1d1f]">
                              {row.plate_number}
                            </span>
                          </td>

                          <td className="px-7 py-6 align-top font-black text-green-700">
                            {formatMoney(row.rental_revenue)}
                          </td>

                          <td className="px-7 py-6 align-top font-black text-red-700">
                            {formatMoney(row.maintenance_cost)}
                          </td>

                          <td className="px-7 py-6 align-top">
                            <p
                              className={`font-black ${
                                Number(row.vehicle_profit || 0) < 0
                                  ? "text-red-700"
                                  : "text-[#1d1d1f]"
                              }`}
                            >
                              {formatMoney(row.vehicle_profit)}
                            </p>

                            <p className="mt-1 text-xs text-[#8a8178]">
                              Net performance
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-5 xl:hidden">
                {vehicleProfits.length === 0 ? (
                  <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-[#7a7168]">
                    No vehicle profit data yet.
                  </div>
                ) : (
                  vehicleProfits.map((row) => (
                    <div
                      key={row.vehicle_id}
                      className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-[#1d1d1f]">
                            {row.vehicle_name}
                          </p>

                          <p className="mt-1 text-sm text-[#7a7168]">
                            {row.plate_number}
                          </p>
                        </div>

                        <p
                          className={`font-black ${
                            Number(row.vehicle_profit || 0) < 0
                              ? "text-red-700"
                              : "text-[#1d1d1f]"
                          }`}
                        >
                          {formatMoney(row.vehicle_profit)}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                        <p>
                          <span className="font-black text-[#1d1d1f]">
                            Revenue:
                          </span>{" "}
                          {formatMoney(row.rental_revenue)}
                        </p>

                        <p>
                          <span className="font-black text-[#1d1d1f]">
                            Maintenance:
                          </span>{" "}
                          {formatMoney(row.maintenance_cost)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ReportTableCard
                title="Outstanding Balances"
                subtitle="Bookings that still have money owing."
              >
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                      <tr>
                        <th className="px-6 py-5">Booking</th>
                        <th className="px-6 py-5">Customer</th>
                        <th className="px-6 py-5">Vehicle</th>
                        <th className="px-6 py-5">Balance</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#eee9df]">
                      {outstandingBookings.length === 0 ? (
                        <tr>
                          <td className="px-6 py-8 text-[#7a7168]" colSpan={4}>
                            No outstanding balances.
                          </td>
                        </tr>
                      ) : (
                        outstandingBookings.map((booking) => (
                          <tr
                            key={booking.booking_number}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-6 py-5 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {booking.booking_number}
                              </p>

                              <StatusBadge status={booking.status} />
                            </td>

                            <td className="px-6 py-5 align-top font-semibold text-[#1d1d1f]">
                              {booking.customer_name}
                            </td>

                            <td className="px-6 py-5 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {booking.vehicle_name}
                              </p>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-6 py-5 align-top font-black text-red-700">
                              {formatMoney(booking.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 p-5 xl:hidden">
                  {outstandingBookings.length === 0 ? (
                    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-[#7a7168]">
                      No outstanding balances.
                    </div>
                  ) : (
                    outstandingBookings.map((booking) => (
                      <div
                        key={booking.booking_number}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[#1d1d1f]">
                              {booking.booking_number}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {booking.customer_name}
                            </p>
                          </div>

                          <p className="font-black text-red-700">
                            {formatMoney(booking.balance)}
                          </p>
                        </div>

                        <p className="mt-4 text-sm text-[#5f554c]">
                          <span className="font-black text-[#1d1d1f]">
                            Vehicle:
                          </span>{" "}
                          {booking.vehicle_name} — {booking.plate_number}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ReportTableCard>

              <ReportTableCard
                title="Active Rentals"
                subtitle="Vehicles currently checked out."
              >
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                      <tr>
                        <th className="px-6 py-5">Booking</th>
                        <th className="px-6 py-5">Customer</th>
                        <th className="px-6 py-5">Vehicle</th>
                        <th className="px-6 py-5">Return</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#eee9df]">
                      {activeRentals.length === 0 ? (
                        <tr>
                          <td className="px-6 py-8 text-[#7a7168]" colSpan={4}>
                            No active rentals right now.
                          </td>
                        </tr>
                      ) : (
                        activeRentals.map((booking) => (
                          <tr
                            key={booking.booking_number}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-6 py-5 align-top font-black text-[#1d1d1f]">
                              {booking.booking_number}
                            </td>

                            <td className="px-6 py-5 align-top font-semibold text-[#1d1d1f]">
                              {booking.customer_name}
                            </td>

                            <td className="px-6 py-5 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {booking.vehicle_name}
                              </p>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-6 py-5 align-top font-semibold text-[#1d1d1f]">
                              {formatDate(booking.return_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 p-5 xl:hidden">
                  {activeRentals.length === 0 ? (
                    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-[#7a7168]">
                      No active rentals right now.
                    </div>
                  ) : (
                    activeRentals.map((booking) => (
                      <div
                        key={booking.booking_number}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[#1d1d1f]">
                              {booking.booking_number}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {booking.customer_name}
                            </p>
                          </div>

                          <p className="text-sm font-black text-[#b98320]">
                            {formatDate(booking.return_date)}
                          </p>
                        </div>

                        <p className="mt-4 text-sm text-[#5f554c]">
                          <span className="font-black text-[#1d1d1f]">
                            Vehicle:
                          </span>{" "}
                          {booking.vehicle_name} — {booking.plate_number}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ReportTableCard>
            </section>

            <section className="rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-6 shadow-xl shadow-black/5">
              <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                Reports Management Note
              </h3>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6b6257]">
                These reports depend on accurate payments, booking records, and
                maintenance entries. Keep daily records updated so the business
                numbers remain useful for decision making.
              </p>
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

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black text-[#1d1d1f]">{value}</p>

      <p className="mt-2 text-sm text-[#7a7168]">{note}</p>
    </div>
  );
}

function ReportTableCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
      <div className="border-b border-[#eee9df] px-6 py-5">
        <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[#7a7168]">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-purple-100 text-purple-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-700",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {String(status || "").replaceAll("_", " ")}
    </span>
  );
}

function formatMoney(value: string | number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}