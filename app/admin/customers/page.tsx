import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

type Customer = RowDataPacket & {
  id: number;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | Date | null;
  is_blacklisted: number;
  total_bookings: number;
  total_balance: string | number | null;
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

  const [customers] = await db.query<Customer[]>(`
    SELECT 
      customers.id,
      customers.full_name,
      customers.phone,
      customers.whatsapp,
      customers.email,
      customers.license_number,
      customers.license_expiry,
      customers.is_blacklisted,
      COUNT(bookings.id) AS total_bookings,
      COALESCE(SUM(bookings.balance), 0) AS total_balance
    FROM customers
    LEFT JOIN bookings ON bookings.customer_id = customers.id
    GROUP BY 
      customers.id,
      customers.full_name,
      customers.phone,
      customers.whatsapp,
      customers.email,
      customers.license_number,
      customers.license_expiry,
      customers.is_blacklisted,
      customers.created_at
    ORDER BY customers.created_at DESC
  `);

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
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="customers" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero
            variant="customers"
            label="Customer Management"
            title="Customers"
            subtitle="Manage customer records, contact details, license information, booking history, and account balances for Roberts Auto Rental."
          />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Customers
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {totalCustomers}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Customer records saved
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Active Customers
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {activeCustomers}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Approved for rentals
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Blacklisted
              </p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {blacklistedCustomers}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Flagged customer records
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Outstanding Balance
              </p>
              <p className="mt-2 text-3xl font-black text-[#b8860b]">
                {formatMoney(totalBalance)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Across all customers
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Customer List
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Customer Records
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View customer contact details, license information, rental
                  count, balance, and customer status.
                </p>
              </div>

              <Link
                href="/admin/customers/new"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
              >
                Add Customer
              </Link>
            </div>

            {customers.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-slate-950">
                  No customers added yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first customer to begin building the Roberts Auto
                  Rental customer database.
                </p>

                <Link
                  href="/admin/customers/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
                >
                  Add First Customer
                </Link>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Customer
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Phone
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Email
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          License
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          License Expiry
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Bookings
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Balance
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="transition hover:bg-[#fbf7ef]"
                        >
                          <td className="px-5 py-5 align-top">
                            <div>
                              <p className="font-black text-slate-950">
                                {customer.full_name}
                              </p>

                              {customer.whatsapp && (
                                <p className="mt-1 text-xs text-slate-500">
                                  WhatsApp: {customer.whatsapp}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                              {customer.phone}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {customer.email || "—"}
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {customer.license_number || "—"}
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {customer.license_expiry
                              ? formatDate(customer.license_expiry)
                              : "—"}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-950">
                              {customer.total_bookings || 0}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Total rentals
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-950">
                              {formatMoney(customer.total_balance)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Current balance
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            {customer.is_blacklisted ? (
                              <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-700">
                                Blacklisted
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                                Active
                              </span>
                            )}
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
                  Customer Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  Keep customer phone numbers, WhatsApp numbers, license
                  details, and outstanding balances updated. This helps staff
                  confirm bookings faster and avoid issues before a vehicle is
                  released.
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