import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Payment = {
  id: number;
  booking_number: string;
  customer_name: string;
  amount: string | number | null;
  payment_method: string;
  payment_reference: string | null;
  balance: string | number | null;
  created_at: string;
};

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

  const totalPayments = payments.length;
  const totalCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const bookingBalanceMap = new Map<string, number>();

  payments.forEach((payment) => {
    bookingBalanceMap.set(payment.booking_number, Number(payment.balance || 0));
  });

  const outstandingBalance = Array.from(bookingBalanceMap.values()).reduce(
    (sum, balance) => sum + balance,
    0
  );

  const paymentMethods = new Set(
    payments.map((payment) => payment.payment_method).filter(Boolean)
  ).size;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="payments" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Payments
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Record customer payments, track payment references, and manage
                  booking balances.
                </p>
              </div>

              <Link
                href="/admin/payments/new"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                Record Payment
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
                      Payment Tracking.
                      <br />
                      Balance Control.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Keep every rental payment clear.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Payments Recorded"
                value={String(totalPayments)}
                note="Total payment entries"
              />

              <StatCard
                title="Total Collected"
                value={formatMoney(totalCollected)}
                note="Payments received"
              />

              <StatCard
                title="Balance Snapshot"
                value={formatMoney(outstandingBalance)}
                note="Outstanding on listed bookings"
              />

              <StatCard
                title="Payment Methods"
                value={String(paymentMethods)}
                note="Methods used so far"
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
                      Payment History
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      {payments.length} payment
                      {payments.length === 1 ? "" : "s"} recorded
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-bold text-[#4b443d] shadow-sm">
                    Filters
                  </button>

                  <div className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm text-[#8a8178] shadow-sm">
                    Search payments...
                  </div>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No payments recorded yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Record your first customer payment to begin tracking
                    revenue and balances.
                  </p>

                  <Link
                    href="/admin/payments/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Record First Payment
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                        <tr>
                          <th className="px-7 py-5">Date</th>
                          <th className="px-7 py-5">Customer</th>
                          <th className="px-7 py-5">Booking #</th>
                          <th className="px-7 py-5">Amount</th>
                          <th className="px-7 py-5">Method</th>
                          <th className="px-7 py-5">Reference</th>
                          <th className="px-7 py-5">Booking Balance</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#eee9df]">
                        {payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatDate(payment.created_at)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Payment date
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {payment.customer_name}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <span className="rounded-xl border border-[#eee9df] bg-[#fbfaf8] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1d1d1f]">
                                {payment.booking_number}
                              </span>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-green-700">
                                {formatMoney(payment.amount)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Amount paid
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <PaymentMethodBadge
                                method={payment.payment_method}
                              />
                            </td>

                            <td className="px-7 py-6 align-top text-[#5f554c]">
                              {payment.payment_reference || "-"}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {formatMoney(payment.balance)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Remaining balance
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-5 xl:hidden">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#1d1d1f]">
                              {payment.customer_name}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {payment.booking_number}
                            </p>
                          </div>

                          <p className="font-black text-green-700">
                            {formatMoney(payment.amount)}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Date:
                            </span>{" "}
                            {formatDate(payment.created_at)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Method:
                            </span>{" "}
                            {formatPaymentMethod(payment.payment_method)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Reference:
                            </span>{" "}
                            {payment.payment_reference || "-"}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Balance:
                            </span>{" "}
                            {formatMoney(payment.balance)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-6 shadow-xl shadow-black/5">
              <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                Payment Management Note
              </h3>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6b6257]">
                Always enter the correct payment method and reference number
                when recording payments. This makes it easier to confirm
                deposits, settle balances, and track each booking clearly.
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

      <p className="mt-3 text-4xl font-black text-[#1d1d1f]">{value}</p>

      <p className="mt-2 text-sm text-[#7a7168]">{note}</p>
    </div>
  );
}

function PaymentMethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/15 px-4 py-2 text-xs font-black capitalize text-[#b98320]">
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {formatPaymentMethod(method)}
    </span>
  );
}

function formatPaymentMethod(method: string) {
  return String(method || "").replaceAll("_", " ");
}

function formatMoney(value: string | number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateValue: string) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}