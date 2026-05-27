import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  is_blacklisted: number;
};

export default async function CustomersPage() {
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

  const [rows] = await db.query(
    `SELECT 
      customers.*,
      COUNT(bookings.id) AS total_bookings,
      COALESCE(SUM(bookings.balance), 0) AS total_balance
    FROM customers
    LEFT JOIN bookings ON bookings.customer_id = customers.id
    GROUP BY customers.id
    ORDER BY customers.created_at DESC`
  );

  const customers = rows as (Customer & {
    total_bookings: number;
    total_balance: string;
  })[];

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
              className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
            >
              Customers
            </Link>

            <Link
              href="/admin/bookings"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Bookings
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
              <p className="text-sm text-gray-500">
                Manage customer records, license details, and booking history.
              </p>
            </div>

            <Link
              href="/admin/customers/new"
              className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              Add Customer
            </Link>
          </header>

          <div className="p-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Customer List
                </h3>
              </div>

              {customers.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">No customers added yet.</p>
                  <Link
                    href="/admin/customers/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Add First Customer
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">License</th>
                        <th className="px-6 py-4">License Expiry</th>
                        <th className="px-6 py-4">Bookings</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {customer.full_name}
                            </div>
                            {customer.whatsapp && (
                              <div className="text-xs text-gray-500">
                                WhatsApp: {customer.whatsapp}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">{customer.phone}</td>

                          <td className="px-6 py-4">
                            {customer.email || "-"}
                          </td>

                          <td className="px-6 py-4">
                            {customer.license_number || "-"}
                          </td>

                          <td className="px-6 py-4">
                            {customer.license_expiry
                              ? formatDate(customer.license_expiry)
                              : "-"}
                          </td>

                          <td className="px-6 py-4">
                            {customer.total_bookings || 0}
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            ${Number(customer.total_balance || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            {customer.is_blacklisted ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                Blacklisted
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Active
                              </span>
                            )}
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