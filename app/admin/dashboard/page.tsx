import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Booking = {
  id: number;
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  pickup_date: string;
  pickup_time?: string | null;
  return_date: string;
  return_time?: string | null;
  status: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
};

export default async function BookingsPage() {
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

  const [rows] = await db.query(`
    SELECT 
      bookings.*,
      customers.full_name AS customer_name,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.created_at DESC
  `);

  const bookings = rows as Booking[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="bookings" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Bookings
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Manage reservations, rentals, balances, and vehicle status.
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
                      Premium Vehicles.
                      <br />
                      Premium Experience.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Drive with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="flex flex-col gap-4 border-b border-[#eee9df] px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl text-[#b98320]">
                    ▣
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                      Booking List
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      {bookings.length} booking{bookings.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-bold text-[#4b443d] shadow-sm">
                    Filters
                  </button>

                  <div className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm text-[#8a8178] shadow-sm">
                    Search bookings...
                  </div>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No bookings created yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Create your first rental booking to begin.
                  </p>

                  <Link
                    href="/admin/bookings/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Create First Booking
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                        <tr>
                          <th className="px-7 py-5">Booking #</th>
                          <th className="px-7 py-5">Customer</th>
                          <th className="px-7 py-5">Vehicle</th>
                          <th className="px-7 py-5">Pickup</th>
                          <th className="px-7 py-5">Return</th>
                          <th className="px-7 py-5">Status</th>
                          <th className="px-7 py-5">Total</th>
                          <th className="px-7 py-5">Paid</th>
                          <th className="px-7 py-5">Balance</th>
                          <th className="px-7 py-5 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#eee9df]">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="transition hover:bg-[#fbfaf8]">
                            <td className="px-7 py-6 align-top">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="font-black text-[#1d1d1f] hover:text-[#b98320] hover:underline"
                              >
                                {booking.booking_number}
                              </Link>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Booking ID
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {booking.customer_name}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {booking.vehicle_name}
                              </p>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                {booking.plate_number}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatDate(booking.pickup_date)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                {formatTime(booking.pickup_time)}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatDate(booking.return_date)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                {formatTime(booking.return_time)}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <StatusBadge status={booking.status} />
                            </td>

                            <td className="px-7 py-6 align-top font-semibold text-[#1d1d1f]">
                              {formatMoney(booking.total_amount)}
                            </td>

                            <td className="px-7 py-6 align-top font-semibold text-[#4b443d]">
                              {formatMoney(booking.amount_paid)}
                            </td>

                            <td className="px-7 py-6 align-top font-black text-[#1d1d1f]">
                              {formatMoney(booking.balance)}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <div className="ml-auto flex max-w-[160px] flex-col gap-2">
                                <Link
                                  href={`/admin/bookings/${booking.id}`}
                                  className="rounded-xl bg-[#0b0b0c] px-4 py-3 text-center text-xs font-black text-white shadow-sm hover:bg-[#1c1c1e]"
                                >
                                  View / Print
                                </Link>

                               
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-5 xl:hidden">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="text-lg font-black text-[#1d1d1f] hover:text-[#b98320]"
                            >
                              {booking.booking_number}
                            </Link>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {booking.customer_name}
                            </p>
                          </div>

                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Vehicle:
                            </span>{" "}
                            {booking.vehicle_name} — {booking.plate_number}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Pickup:
                            </span>{" "}
                            {formatDate(booking.pickup_date)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Return:
                            </span>{" "}
                            {formatDate(booking.return_date)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Balance:
                            </span>{" "}
                            {formatMoney(booking.balance)}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="rounded-xl bg-[#0b0b0c] px-4 py-3 text-center text-sm font-black text-white"
                          >
                            View / Print
                          </Link>

                          <BookingActionButtons
                            bookingId={booking.id}
                            status={booking.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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

function formatDate(dateValue: string) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "10:00 AM";

  const [hours, minutes] = value.split(":");

  if (!hours || !minutes) return value;

  const hourNumber = Number(hours);
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function formatMoney(value: string | number) {
  return `$${Number(value || 0).toFixed(2)}`;
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
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}