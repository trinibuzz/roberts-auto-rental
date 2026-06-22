import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

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
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="calendar" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Fleet Calendar
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  See vehicle availability, reservations, rentals, and maintenance at a glance.
                </p>
              </div>

              <Link
                href="/admin/bookings/new"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                New Booking
              </Link>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <AdminPageHero
              variant="calendar"
              title="Fleet Calendar."
              subtitle="See availability, reservations, and returns at a glance."
            />

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Legend color="bg-green-50 border-green-200 text-green-800" label="Available" />
              <Legend color="bg-purple-50 border-purple-200 text-purple-800" label="Reserved" />
              <Legend color="bg-blue-50 border-blue-200 text-blue-800" label="Rented" />
              <Legend color="bg-red-50 border-red-200 text-red-800" label="Overdue" />
              <Legend color="bg-orange-50 border-orange-200 text-orange-800" label="Maintenance" />
              <Legend color="bg-gray-100 border-gray-200 text-gray-700" label="Out of Service" />
            </div>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="border-b border-[#eee9df] px-6 py-5">
                <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                  Next 14 Days
                </h3>

                <p className="mt-1 text-sm text-[#7a7168]">
                  Each row is a vehicle. Each column is a day.
                </p>
              </div>

              {vehicles.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No vehicles added yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Add your first vehicle to begin using the fleet calendar.
                  </p>

                  <Link
                    href="/admin/vehicles/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Add Vehicle
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
                    <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[230px] bg-[#fbfaf8] px-5 py-5">
                          Vehicle
                        </th>

                        {days.map((day) => (
                          <th
                            key={day.toISOString()}
                            className="min-w-[110px] border-l border-[#eee9df] px-3 py-5 text-center"
                          >
                            <div className="font-black">{shortDay(day)}</div>
                            <div className="mt-1">{shortDate(day)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#eee9df]">
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-[#fbfaf8]">
                          <td className="sticky left-0 z-10 bg-white px-5 py-5 align-top">
                            <div className="font-black text-[#1d1d1f]">
                              {vehicle.vehicle_name}
                            </div>

                            <div className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                              {vehicle.plate_number}
                            </div>

                            <div className="mt-3">
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black capitalize ${vehicleStatusClass(
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

                            const cellStatus = booking ? booking.status : vehicle.status;

                            return (
                              <td
                                key={`${vehicle.id}-${day.toISOString()}`}
                                className="border-l border-[#eee9df] px-2 py-4 align-top"
                              >
                                {booking ? (
                                  <div
                                    className={`min-h-[82px] rounded-2xl border p-3 text-xs shadow-sm ${calendarCellClass(
                                      booking.status
                                    )}`}
                                  >
                                    <div className="font-black">
                                      {booking.customer_name}
                                    </div>

                                    <div className="mt-1 font-semibold">
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
                                    className={`min-h-[82px] rounded-2xl border p-3 text-xs font-black capitalize shadow-sm ${calendarCellClass(
                                      cellStatus
                                    )}`}
                                  >
                                    {cellStatus.replaceAll("_", " ")}
                                  </div>
                                ) : (
                                  <div className="min-h-[82px] rounded-2xl border border-green-200 bg-green-50 p-3 text-xs font-black text-green-700 shadow-sm">
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
            </section>

            <footer className="pb-6 text-center text-sm text-[#9a9085]">
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
              © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All rights reserved.
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 text-xs font-black shadow-sm ${color}`}>
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
    return "bg-purple-50 border-purple-200 text-purple-800";
  }

  if (status === "active" || status === "rented") {
    return "bg-blue-50 border-blue-200 text-blue-800";
  }

  if (status === "overdue") {
    return "bg-red-50 border-red-200 text-red-800";
  }

  if (status === "maintenance") {
    return "bg-orange-50 border-orange-200 text-orange-800";
  }

  if (status === "out_of_service") {
    return "bg-gray-100 border-gray-200 text-gray-700";
  }

  return "bg-green-50 border-green-200 text-green-800";
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