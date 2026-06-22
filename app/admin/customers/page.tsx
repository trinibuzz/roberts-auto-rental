import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  is_blacklisted: number;
  total_bookings: number;
  total_balance: string | number | null;
};

export default async function CustomersPage() {
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
      customers.*,
      COUNT(bookings.id) AS total_bookings,
      COALESCE(SUM(bookings.balance), 0) AS total_balance
    FROM customers
    LEFT JOIN bookings ON bookings.customer_id = customers.id
    GROUP BY customers.id
    ORDER BY customers.created_at DESC
  `);

  const customers = rows as Customer[];

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (customer) => !customer.is_blacklisted
  ).length;
  const blacklistedCustomers = customers.filter(
    (customer) => customer.is_blacklisted
  ).length;
  const totalBalance = customers.reduce(
    (sum, customer) => sum + Number(customer.total_balance || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="customers" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Customers
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Manage customer records, contact information, license details,
                  balances, and booking history.
                </p>
              </div>

              <Link
                href="/admin/customers/new"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                Add Customer
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
                      Customer Records.
                      <br />
                      Rental Confidence.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Know every renter before the keys go out.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Customers"
                value={String(totalCustomers)}
                note="Customer records saved"
              />

              <StatCard
                title="Active Customers"
                value={String(activeCustomers)}
                note="Approved for rentals"
              />

              <StatCard
                title="Blacklisted"
                value={String(blacklistedCustomers)}
                note="Flagged customer records"
              />

              <StatCard
                title="Outstanding Balance"
                value={formatMoney(totalBalance)}
                note="Across all customers"
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
                      Customer List
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      {customers.length} customer
                      {customers.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-bold text-[#4b443d] shadow-sm">
                    Filters
                  </button>

                  <div className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm text-[#8a8178] shadow-sm">
                    Search customers...
                  </div>
                </div>
              </div>

              {customers.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No customers added yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Add your first customer to begin building the rental
                    database.
                  </p>

                  <Link
                    href="/admin/customers/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Add First Customer
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                        <tr>
                          <th className="px-7 py-5">Customer</th>
                          <th className="px-7 py-5">Phone</th>
                          <th className="px-7 py-5">Email</th>
                          <th className="px-7 py-5">License</th>
                          <th className="px-7 py-5">License Expiry</th>
                          <th className="px-7 py-5">Bookings</th>
                          <th className="px-7 py-5">Balance</th>
                          <th className="px-7 py-5">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#eee9df]">
                        {customers.map((customer) => (
                          <tr
                            key={customer.id}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {customer.full_name}
                              </p>

                              {customer.whatsapp && (
                                <p className="mt-1 text-xs text-[#8a8178]">
                                  WhatsApp: {customer.whatsapp}
                                </p>
                              )}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <span className="rounded-xl border border-[#eee9df] bg-[#fbfaf8] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1d1d1f]">
                                {customer.phone}
                              </span>
                            </td>

                            <td className="px-7 py-6 align-top text-[#5f554c]">
                              {customer.email || "-"}
                            </td>

                            <td className="px-7 py-6 align-top text-[#5f554c]">
                              {customer.license_number || "-"}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {customer.license_expiry
                                  ? formatDate(customer.license_expiry)
                                  : "-"}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {customer.total_bookings || 0}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Total rentals
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top font-black text-[#1d1d1f]">
                              {formatMoney(customer.total_balance)}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <StatusBadge
                                isBlacklisted={customer.is_blacklisted}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-5 xl:hidden">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#1d1d1f]">
                              {customer.full_name}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {customer.phone}
                            </p>

                            {customer.whatsapp && (
                              <p className="mt-1 text-xs text-[#8a8178]">
                                WhatsApp: {customer.whatsapp}
                              </p>
                            )}
                          </div>

                          <StatusBadge
                            isBlacklisted={customer.is_blacklisted}
                          />
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Email:
                            </span>{" "}
                            {customer.email || "-"}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              License:
                            </span>{" "}
                            {customer.license_number || "-"}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Expiry:
                            </span>{" "}
                            {customer.license_expiry
                              ? formatDate(customer.license_expiry)
                              : "-"}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Balance:
                            </span>{" "}
                            {formatMoney(customer.total_balance)}
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
                Customer Management Note
              </h3>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6b6257]">
                Keep customer phone numbers, WhatsApp numbers, license details,
                and balances updated. This helps staff confirm bookings faster
                and avoid issues before a vehicle is released.
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

function StatusBadge({ isBlacklisted }: { isBlacklisted: number }) {
  if (isBlacklisted) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-xs font-black capitalize text-red-800">
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        Blacklisted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-black capitalize text-green-800">
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      Active
    </span>
  );
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