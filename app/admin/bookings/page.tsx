import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import BookingActionButtons from "./BookingActionButtons";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Booking = {
  id: number;
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
    <main className="min-h-screen bg-gray-100">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="bookings" />

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
              <p className="text-sm text-gray-500">
                Manage reservations, rentals, balances, and vehicle status.
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
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Booking List
                </h3>
              </div>

              {bookings.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">No bookings created yet.</p>
                  <Link
                    href="/admin/bookings/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Create First Booking
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Booking #</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Pickup</th>
                        <th className="px-6 py-4">Return</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Paid</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {booking.booking_number}
                          </td>

                          <td className="px-6 py-4">
                            {booking.customer_name}
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {booking.vehicle_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.plate_number}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(booking.pickup_date)}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(booking.return_date)}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            ${Number(booking.total_amount || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            ${Number(booking.amount_paid || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            ${Number(booking.balance || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <Link
                                href={`/admin/bookings/${booking.id}`}
                                className="rounded-lg bg-[#07111f] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#12345f]"
                              >
                                View / Print
                              </Link>

                              <BookingActionButtons
                                bookingId={booking.id}
                                status={booking.status}
                              />
                            </div>
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

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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