import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  customer_photo: string | null;
  address: string | null;
  date_of_birth: string | Date | null;
  license_number: string | null;
  license_expiry: string | Date | null;
  id_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_blacklisted: number;
  created_at: string | Date;
};

type Booking = {
  id: number;
  booking_number: string;
  pickup_date: string | Date | null;
  return_date: string | Date | null;
  status: string;
  total_amount: string | number | null;
  amount_paid: string | number | null;
  balance: string | number | null;
  vehicle_name: string;
  plate_number: string;
};

type StatsRow = {
  total_bookings: number;
  total_spent: string | number | null;
  outstanding_balance: string | number | null;
};

export default async function CustomerProfilePage({
  params,
}: {
  params: { id: string };
}) {
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

  const customerId = Number(params.id);

  if (!customerId) {
    notFound();
  }

  const [customerRows] = await db.query(
    `
    SELECT *
    FROM customers
    WHERE id = ?
    LIMIT 1
  `,
    [customerId]
  );

  const customer = (customerRows as Customer[])[0];

  if (!customer) {
    notFound();
  }

  const [statsRows] = await db.query(
    `
    SELECT
      COUNT(*) AS total_bookings,
      COALESCE(SUM(amount_paid), 0) AS total_spent,
      COALESCE(SUM(balance), 0) AS outstanding_balance
    FROM bookings
    WHERE customer_id = ?
  `,
    [customerId]
  );

  const stats = (statsRows as StatsRow[])[0];

  const [bookingRows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.status,
      bookings.total_amount,
      bookings.amount_paid,
      bookings.balance,
      vehicles.vehicle_name,
      vehicles.plate_number
    FROM bookings
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.customer_id = ?
    ORDER BY bookings.created_at DESC
    LIMIT 12
  `,
    [customerId]
  );

  const bookings = bookingRows as Booking[];

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
                  Customer Profile
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Full customer details, profile photo, rental activity, balances,
                  and internal notes.
                </p>
              </div>

              <Link
                href="/admin/customers"
                className="inline-flex items-center justify-center rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-sm font-black text-[#1d1d1f] shadow-sm transition hover:bg-[#fbfaf8]"
              >
                Back to Customers
              </Link>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[230px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(90deg,#050505_0%,#111111_45%,#3a2410_100%)]" />

                <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
                  <div className="max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Roberts Auto Rental
                    </p>

                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
                      {customer.full_name}
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      {customer.phone}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_390px]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
                  <div className="mb-6 flex items-center gap-4 border-b border-[#eee9df] pb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl font-black text-[#b98320]">
                      1
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                        Contact Information
                      </h3>

                      <p className="text-sm text-[#7a7168]">
                        Main contact details for booking confirmations.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard label="Phone" value={customer.phone} />
                    <InfoCard label="WhatsApp" value={customer.whatsapp} />
                    <InfoCard label="Email" value={customer.email} />
                    <InfoCard
                      label="Date of Birth"
                      value={formatDate(customer.date_of_birth)}
                    />
                    <InfoCard label="ID / Passport" value={customer.id_number} />
                    <InfoCard
                      label="Customer Since"
                      value={formatDate(customer.created_at)}
                    />
                  </div>

                  <div className="mt-5">
                    <InfoCard label="Address" value={customer.address} large />
                  </div>
                </section>

                <section className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
                  <div className="mb-6 flex items-center gap-4 border-b border-[#eee9df] pb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl font-black text-[#b98320]">
                      2
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                        License & Emergency Contact
                      </h3>

                      <p className="text-sm text-[#7a7168]">
                        Driver license and backup contact information.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                      label="Driver's License"
                      value={customer.license_number}
                    />
                    <InfoCard
                      label="License Expiry"
                      value={formatDate(customer.license_expiry)}
                    />
                    <InfoCard
                      label="Emergency Contact"
                      value={customer.emergency_contact_name}
                    />
                    <InfoCard
                      label="Emergency Phone"
                      value={customer.emergency_contact_phone}
                    />
                  </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
                  <div className="border-b border-[#eee9df] px-6 py-5">
                    <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                      Recent Bookings
                    </h3>

                    <p className="mt-1 text-sm text-[#7a7168]">
                      Latest rentals for this customer.
                    </p>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="p-6 text-sm text-[#7a7168]">
                      No bookings found for this customer yet.
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto xl:block">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                            <tr>
                              <th className="px-6 py-5">Booking</th>
                              <th className="px-6 py-5">Vehicle</th>
                              <th className="px-6 py-5">Pickup</th>
                              <th className="px-6 py-5">Return</th>
                              <th className="px-6 py-5">Balance</th>
                              <th className="px-6 py-5">Status</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-[#eee9df]">
                            {bookings.map((booking) => (
                              <tr
                                key={booking.id}
                                className="transition hover:bg-[#fbfaf8]"
                              >
                                <td className="px-6 py-5 font-black text-[#1d1d1f]">
                                  {booking.booking_number}
                                </td>

                                <td className="px-6 py-5">
                                  <p className="font-black text-[#1d1d1f]">
                                    {booking.vehicle_name}
                                  </p>

                                  <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                    {booking.plate_number}
                                  </p>
                                </td>

                                <td className="px-6 py-5 text-[#5f554c]">
                                  {formatDate(booking.pickup_date)}
                                </td>

                                <td className="px-6 py-5 text-[#5f554c]">
                                  {formatDate(booking.return_date)}
                                </td>

                                <td className="px-6 py-5 font-black text-[#1d1d1f]">
                                  {formatMoney(booking.balance)}
                                </td>

                                <td className="px-6 py-5">
                                  <BookingStatusBadge status={booking.status} />
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
                                <p className="font-black text-[#1d1d1f]">
                                  {booking.booking_number}
                                </p>

                                <p className="mt-1 text-sm text-[#7a7168]">
                                  {booking.vehicle_name} — {booking.plate_number}
                                </p>
                              </div>

                              <BookingStatusBadge status={booking.status} />
                            </div>

                            <div className="mt-4 grid gap-2 text-sm text-[#5f554c] sm:grid-cols-2">
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
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-6 shadow-xl shadow-black/5">
                  <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                    Internal Notes
                  </h3>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#6b6257]">
                    {customer.notes || "No notes added for this customer."}
                  </p>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="sticky top-6 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
                  <div className="border-b border-[#eee9df] px-6 py-5">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                      Customer DP
                    </p>

                    <h3 className="mt-2 font-serif text-2xl font-black text-[#1d1d1f]">
                      Profile Photo
                    </h3>

                    <p className="mt-2 text-sm text-[#7a7168]">
                      This photo appears in the customer list and booking flow.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="overflow-hidden rounded-3xl border border-[#eee9df] bg-[#fbfaf8]">
                      {customer.customer_photo ? (
                        <img
                          src={customer.customer_photo}
                          alt={customer.full_name}
                          className="h-80 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-80 w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(135deg,#111111,#3a2410)] px-6 text-center">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#d4af37]/20 text-5xl font-black text-[#d4af37]">
                            {customer.full_name
                              ? customer.full_name.charAt(0).toUpperCase()
                              : "?"}
                          </div>

                          <p className="mt-5 text-lg font-black text-white">
                            No customer photo yet
                          </p>

                          <p className="mt-2 text-sm text-white/70">
                            Add a DP from the customer form.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4">
                      <MiniStat
                        title="Total Bookings"
                        value={String(stats?.total_bookings || 0)}
                      />

                      <MiniStat
                        title="Total Paid"
                        value={formatMoney(stats?.total_spent)}
                      />

                      <MiniStat
                        title="Outstanding"
                        value={formatMoney(stats?.outstanding_balance)}
                        danger={Number(stats?.outstanding_balance || 0) > 0}
                      />
                    </div>

                    <div className="mt-5">
                      {customer.is_blacklisted ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-700">
                          Warning customer / blacklisted
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-black text-green-700">
                          Active customer
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </aside>
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

function InfoCard({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | null | undefined;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 ${
        large ? "min-h-28" : ""
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8178]">
        {label}
      </p>

      <p className="mt-2 font-black text-[#1d1d1f]">{value || "-"}</p>
    </div>
  );
}

function MiniStat({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8178]">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          danger ? "text-red-700" : "text-[#1d1d1f]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
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
      {String(status || "").replaceAll("_", " ")}
    </span>
  );
}

function formatMoney(value: string | number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
