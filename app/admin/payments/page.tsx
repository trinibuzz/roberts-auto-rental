import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

type Payment = RowDataPacket & {
  id: number;
  booking_number: string;
  customer_name: string;
  amount: string | number | null;
  payment_method: string;
  payment_reference: string | null;
  balance: string | number | null;
  created_at: string | Date;
};

function formatDate(dateValue: string | Date) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: string | number | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-TT", {
    style: "currency",
    currency: "TTD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPaymentMethod(method: string) {
  return method.split("_").join(" ");
}

export default async function PaymentsPage() {
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

  const [payments] = await db.query<Payment[]>(`
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

  const totalPayments = payments.length;

  const totalCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const paymentMethods = new Set(
    payments.map((payment) => payment.payment_method).filter(Boolean)
  ).size;

  const bookingBalanceMap = new Map<string, number>();

  payments.forEach((payment) => {
    bookingBalanceMap.set(
      payment.booking_number,
      Number(payment.balance || 0)
    );
  });

  const outstandingBalance = Array.from(bookingBalanceMap.values()).reduce(
    (sum, balance) => sum + balance,
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="payments" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero
            variant="payments"
            label="Payment Management"
            title="Payments"
            subtitle="Track customer payments, booking balances, payment methods, references, and collection history for Roberts Auto Rental."
          />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Payments Recorded
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {totalPayments}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Total payment entries
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Collected
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {formatMoney(totalCollected)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Payments received
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Balance Snapshot
              </p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {formatMoney(outstandingBalance)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Outstanding on listed bookings
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Payment Methods
              </p>
              <p className="mt-2 text-3xl font-black text-[#b8860b]">
                {paymentMethods}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Methods used so far
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Payment History
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Customer Payment Records
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review payment dates, customer names, booking numbers,
                  amounts, methods, references, and remaining booking balances.
                </p>
              </div>

              <Link
                href="/admin/payments/new"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
              >
                Record Payment
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-slate-950">
                  No payments recorded yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Record your first customer payment to begin tracking revenue
                  and booking balances.
                </p>

                <Link
                  href="/admin/payments/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
                >
                  Record First Payment
                </Link>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Date
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Customer
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Booking #
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Amount
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Method
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Reference
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Booking Balance
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-[#fbf7ef]"
                        >
                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {formatDate(payment.created_at)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Payment date
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-950">
                              {payment.customer_name}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                              {payment.booking_number}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-emerald-700">
                              {formatMoney(payment.amount)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Amount paid
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="inline-flex rounded-full border border-[#ead7a2] bg-[#fff9e8] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#8a6500]">
                              {formatPaymentMethod(payment.payment_method)}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {payment.payment_reference || "—"}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-950">
                              {formatMoney(payment.balance)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Remaining balance
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-[#ead7a2] bg-[#fff9e8] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Payment Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  Always enter the correct payment method and reference number
                  when recording payments. This makes it easier to confirm
                  deposits, settle balances, and track each booking clearly.
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