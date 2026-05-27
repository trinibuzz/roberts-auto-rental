import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type Payment = {
  id: number;
  booking_number: string;
  customer_name: string;
  amount: string;
  payment_method: string;
  payment_reference: string | null;
  balance: string;
  created_at: string;
};

export default async function PaymentsPage() {
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
      payments.*,
      customers.full_name AS customer_name,
      bookings.booking_number,
      bookings.balance
    FROM payments
    JOIN customers ON customers.id = payments.customer_id
    JOIN bookings ON bookings.id = payments.booking_id
    ORDER BY payments.created_at DESC
  `);

  const payments = rows as Payment[];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link href="/admin/dashboard" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Dashboard
            </Link>

            <Link href="/admin/vehicles" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Vehicles
            </Link>

            <Link href="/admin/customers" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Customers
            </Link>

            <Link href="/admin/bookings" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Bookings
            </Link>

            <Link href="/admin/calendar" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Calendar View
            </Link>

            <Link href="/admin/payments" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Payments
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
              <p className="text-sm text-gray-500">
                Record customer payments and update booking balances.
              </p>
            </div>

            <Link
              href="/admin/payments/new"
              className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              Record Payment
            </Link>
          </header>

          <div className="p-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Payment History
                </h3>
              </div>

              {payments.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">No payments recorded yet.</p>
                  <Link
                    href="/admin/payments/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Record First Payment
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Booking #</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Booking Balance</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {formatDate(payment.created_at)}
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            {payment.customer_name}
                          </td>

                          <td className="px-6 py-4">
                            {payment.booking_number}
                          </td>

                          <td className="px-6 py-4 font-bold text-green-700">
                            ${Number(payment.amount || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4 capitalize">
                            {payment.payment_method.replaceAll("_", " ")}
                          </td>

                          <td className="px-6 py-4">
                            {payment.payment_reference || "-"}
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            ${Number(payment.balance || 0).toFixed(2)}
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