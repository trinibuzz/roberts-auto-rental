import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type Vehicle = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  status: string;
};

type Booking = {
  id: number;
  vehicle_id: number;
  booking_number: string;
  customer_name: string;
  pickup_date: string;
  return_date: string;
  status: string;
};

export default async function CalendarPage() {
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

  const days = getNextDays(14);

  const [vehicleRows] = await db.query(`
    SELECT id, vehicle_name, plate_number, status
    FROM vehicles
    ORDER BY vehicle_name ASC
  `);

  const vehicles = vehicleRows as Vehicle[];

  const startDate = formatDateForSql(days[0]);
  const endDate = formatDateForSql(days[days.length - 1]);

  const [bookingRows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.vehicle_id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.status,
      customers.full_name AS customer_name
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    WHERE bookings.status NOT IN ('cancelled', 'completed')
    AND DATE(bookings.pickup_date) <= DATE(?)
    AND DATE(bookings.return_date) >= DATE(?)
    ORDER BY bookings.pickup_date ASC
    `,
    [endDate, startDate]
  );

  const bookings = bookingRows as Booking[];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link
              href="/admin/dashboard"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/vehicles"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Vehicles
            </Link>

            <Link
              href="/admin/customers"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Customers
            </Link>

            <Link
              href="/admin/bookings"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Bookings
            </Link>

            <Link
              href="/admin/calendar"
              className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
            >
              Calendar View
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Fleet Calendar
              </h2>
              <p className="text-sm text-gray-500">
                See vehicle availability, reservations, rentals, and maintenance
                at a glance.
              </p>
            </div>

            <Link
              href="/admin/bookings/new"
              className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              New Booking
            </Link>
          </header>

          <div className="p-6">
            <div className="mb-5 grid gap-3 md:grid-cols-6">
              <Legend color="bg-green-100 border-green-300" label="Available" />
              <Legend color="bg-purple-100 border-purple-300" label="Reserved" />
              <Legend color="bg-blue-100 border-blue-300" label="Rented" />
              <Legend color="bg-red-100 border-red-300" label="Overdue" />
              <Legend color="bg-orange-100 border-orange-300" label="Maintenance" />
              <Legend color="bg-gray-200 border-gray-300" label="Out of Service" />
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Next 14 Days
                </h3>
                <p className="text-sm text-gray-500">
                  Each row is a vehicle. Each column is a day.
                </p>
              </div>

              {vehicles.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">No vehicles added yet.</p>
                  <Link
                    href="/admin/vehicles/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Add Vehicle
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="sticky left-0 z-10 bg-gray-50 px-4 py-4 min-w-[230px]">
                          Vehicle
                        </th>

                        {days.map((day) => (
                          <th
                            key={day.toISOString()}
                            className="border-l px-3 py-4 text-center min-w-[105px]"
                          >
                            <div className="font-bold">{shortDay(day)}</div>
                            <div>{shortDate(day)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <td className="sticky left-0 z-10 bg-white px-4 py-4">
                            <div className="font-bold text-gray-900">
                              {vehicle.vehicle_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {vehicle.plate_number}
                            </div>
                            <div className="mt-2">
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${vehicleStatusClass(
                                  vehicle.status
                                )}`}
                              >
                                {vehicle.status.replaceAll("_", " ")}
                              </span>
                            </div>
                          </td>

                          {days.map((day) => {
                            const booking = findBookingForDay(
                              bookings,
                              vehicle.id,
                              day
                            );

                            const cellStatus = booking
                              ? booking.status
                              : vehicle.status;

                            return (
                              <td
                                key={`${vehicle.id}-${day.toISOString()}`}
                                className="border-l px-2 py-3 align-top"
                              >
                                {booking ? (
                                  <div
                                    className={`min-h-[76px] rounded-xl border p-2 text-xs ${calendarCellClass(
                                      booking.status
                                    )}`}
                                  >
                                    <div className="font-bold">
                                      {booking.customer_name}
                                    </div>
                                    <div className="mt-1">
                                      {booking.booking_number}
                                    </div>
                                    <div className="mt-1 capitalize">
                                      {booking.status}
                                    </div>
                                  </div>
                                ) : vehicle.status === "maintenance" ||
                                  vehicle.status === "out_of_service" ||
                                  vehicle.status === "overdue" ? (
                                  <div
                                    className={`min-h-[76px] rounded-xl border p-2 text-xs font-semibold ${calendarCellClass(
                                      cellStatus
                                    )}`}
                                  >
                                    {cellStatus.replaceAll("_", " ")}
                                  </div>
                                ) : (
                                  <div className="min-h-[76px] rounded-xl border border-green-200 bg-green-50 p-2 text-xs font-semibold text-green-700">
                                    Available
                                  </div>
                                )}
                              </td>
                            );
                          })}
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-xs font-semibold ${color}`}>
      {label}
    </div>
  );
}

function getNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    days.push(day);
  }

  return days;
}

function findBookingForDay(
  bookings: Booking[],
  vehicleId: number,
  day: Date
) {
  const dayString = formatDateForSql(day);

  return bookings.find((booking) => {
    const pickup = formatDateForSql(new Date(booking.pickup_date));
    const returned = formatDateForSql(new Date(booking.return_date));

    return (
      booking.vehicle_id === vehicleId &&
      pickup <= dayString &&
      returned >= dayString
    );
  });
}

function formatDateForSql(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function shortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calendarCellClass(status: string) {
  if (status === "confirmed" || status === "pending") {
    return "bg-purple-100 border-purple-300 text-purple-800";
  }

  if (status === "active" || status === "rented") {
    return "bg-blue-100 border-blue-300 text-blue-800";
  }

  if (status === "overdue") {
    return "bg-red-100 border-red-300 text-red-800";
  }

  if (status === "maintenance") {
    return "bg-orange-100 border-orange-300 text-orange-800";
  }

  if (status === "out_of_service") {
    return "bg-gray-200 border-gray-300 text-gray-700";
  }

  return "bg-green-100 border-green-300 text-green-800";
}

function vehicleStatusClass(status: string) {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "reserved") return "bg-purple-100 text-purple-700";
  if (status === "rented") return "bg-blue-100 text-blue-700";
  if (status === "maintenance") return "bg-orange-100 text-orange-700";
  if (status === "overdue") return "bg-red-100 text-red-700";
  if (status === "out_of_service") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}