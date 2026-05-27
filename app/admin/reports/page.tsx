import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type VehicleProfitRow = {
  vehicle_id: number;
  vehicle_name: string;
  plate_number: string;
  rental_revenue: string;
  maintenance_cost: string;
  vehicle_profit: string;
};

type OutstandingRow = {
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string;
  return_date: string;
  status: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
};

type ActiveRentalRow = {
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string;
  return_date: string;
  balance: string;
};

export default async function ReportsPage() {
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
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <NavLink href="/admin/dashboard" label="Dashboard" />
            <NavLink href="/admin/vehicles" label="Vehicles" />
            <NavLink href="/admin/customers" label="Customers" />
            <NavLink href="/admin/bookings" label="Bookings" />
            <NavLink href="/admin/calendar" label="Calendar View" />
            <NavLink href="/admin/payments" label="Payments" />
            <NavLink href="/admin/maintenance" label="Maintenance" />

            <Link
              href="/admin/reports"
              className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
            >
              Reports
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b bg-white px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-500">
              Sales, balances, active rentals, and vehicle profitability.
            </p>
          </header>

          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <ReportCard title="Today’s Sales" value={`$${todaySales.toFixed(2)}`} />
              <ReportCard title="Monthly Revenue" value={`$${monthlyRevenue.toFixed(2)}`} />
              <ReportCard title="Outstanding Balances" value={`$${outstandingBalance.toFixed(2)}`} />
              <ReportCard title="Active Rentals" value={String(activeRentalsCount)} />
              <ReportCard title="Overdue Rentals" value={String(overdueRentalsCount)} />
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Profit by Vehicle
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Vehicle profit = rental revenue collected minus maintenance cost.
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Plate</th>
                      <th className="px-4 py-3">Rental Revenue</th>
                      <th className="px-4 py-3">Maintenance Cost</th>
                      <th className="px-4 py-3">Profit</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {vehicleProfits.length === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-gray-500" colSpan={5}>
                          No vehicle data yet.
                        </td>
                      </tr>
                    ) : (
                      vehicleProfits.map((row) => (
                        <tr key={row.vehicle_id}>
                          <td className="px-4 py-3 font-semibold">
                            {row.vehicle_name}
                          </td>
                          <td className="px-4 py-3">{row.plate_number}</td>
                          <td className="px-4 py-3">
                            ${Number(row.rental_revenue || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            ${Number(row.maintenance_cost || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            ${Number(row.vehicle_profit || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  Outstanding Balances
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Bookings that still have money owing.
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Balance</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {outstandingBookings.length === 0 ? (
                        <tr>
                          <td className="px-4 py-5 text-gray-500" colSpan={4}>
                            No outstanding balances.
                          </td>
                        </tr>
                      ) : (
                        outstandingBookings.map((booking) => (
                          <tr key={booking.booking_number}>
                            <td className="px-4 py-3 font-semibold">
                              {booking.booking_number}
                            </td>
                            <td className="px-4 py-3">
                              {booking.customer_name}
                            </td>
                            <td className="px-4 py-3">
                              {booking.vehicle_name} / {booking.plate_number}
                            </td>
                            <td className="px-4 py-3 font-bold text-red-600">
                              ${Number(booking.balance || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  Active Rentals
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vehicles currently checked out.
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Vehicle</th>
                        <th className="px-4 py-3">Return</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {activeRentals.length === 0 ? (
                        <tr>
                          <td className="px-4 py-5 text-gray-500" colSpan={4}>
                            No active rentals right now.
                          </td>
                        </tr>
                      ) : (
                        activeRentals.map((booking) => (
                          <tr key={booking.booking_number}>
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
                              {formatDate(booking.return_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-lg px-4 py-3 hover:bg-white/10">
      {label}
    </Link>
  );
}

function ReportCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-bold text-[#07111f]">{value}</p>
    </div>
  );
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}