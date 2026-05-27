import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import PrintButton from "./PrintButton";

type BookingDetail = {
  id: number;
  booking_number: string;
  pickup_date: string;
  pickup_time: string | null;
  return_date: string;
  return_time: string | null;
  daily_rate: string;
  number_of_days: number;
  deposit: string;
  discount: string;
  extra_charges: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: string;
  notes: string | null;

  customer_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  license_number: string | null;
  license_expiry: string | null;
  id_number: string | null;

  vehicle_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string;
  color: string | null;
  transmission: string | null;
  fuel_type: string | null;
};

type Payment = {
  id: number;
  amount: string;
  payment_method: string;
  payment_reference: string | null;
  created_at: string;
  notes: string | null;
};

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const bookingId = Number(params.id);

  if (!bookingId) {
    redirect("/admin/bookings");
  }

  const [bookingRows] = await db.query(
    `
    SELECT
      bookings.*,

      customers.full_name AS customer_name,
      customers.phone,
      customers.whatsapp,
      customers.email,
      customers.address,
      customers.license_number,
      customers.license_expiry,
      customers.id_number,

      vehicles.vehicle_name,
      vehicles.make,
      vehicles.model,
      vehicles.year,
      vehicles.plate_number,
      vehicles.color,
      vehicles.transmission,
      vehicles.fuel_type

    FROM bookings
    JOIN customers ON customers.id = bookings.customer_id
    JOIN vehicles ON vehicles.id = bookings.vehicle_id
    WHERE bookings.id = ?
    LIMIT 1
    `,
    [bookingId]
  );

  const bookings = bookingRows as BookingDetail[];

  if (bookings.length === 0) {
    redirect("/admin/bookings");
  }

  const booking = bookings[0];

  const [paymentRows] = await db.query(
    `
    SELECT *
    FROM payments
    WHERE booking_id = ?
    ORDER BY created_at DESC
    `,
    [bookingId]
  );

  const payments = paymentRows as Payment[];

  const [mediaRows] = await db.query(
    `
    SELECT *
    FROM vehicle_inspection_media
    WHERE booking_id = ?
    AND deleted_at IS NULL
    ORDER BY created_at DESC
    `,
    [bookingId]
  );

  const videos = mediaRows as {
    id: number;
    inspection_type: string;
    file_url: string;
    created_at: string;
  }[];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white print:hidden md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <NavLink href="/admin/dashboard" label="Dashboard" />
            <NavLink href="/admin/vehicles" label="Vehicles" />
            <NavLink href="/admin/customers" label="Customers" />
            <NavLink href="/admin/bookings" label="Bookings" />
            <NavLink href="/admin/calendar" label="Calendar View" />
            <NavLink href="/admin/payments" label="Payments" />
            <NavLink href="/admin/maintenance" label="Maintenance" />
            <NavLink href="/admin/reports" label="Reports" />
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4 print:hidden">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h2>
              <p className="text-sm text-gray-500">
                Invoice, receipt, rental agreement, and inspection evidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/bookings"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back
              </Link>

              <Link
                href={`/admin/bookings/${booking.id}/videos`}
                className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#07111f] hover:bg-[#c79f2f]"
              >
                Videos
              </Link>

              <PrintButton />
            </div>
          </header>

          <div className="p-6 print:p-0">
            <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
              <div className="border-b pb-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <h1 className="text-3xl font-bold text-[#07111f]">
                      Roberts Auto Rental
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Rental Invoice & Agreement
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500">Booking Number</p>
                    <p className="text-2xl font-bold text-[#07111f]">
                      {booking.booking_number}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <InfoCard title="Customer Details">
                  <Detail label="Name" value={booking.customer_name} />
                  <Detail label="Phone" value={booking.phone} />
                  <Detail label="WhatsApp" value={booking.whatsapp || "-"} />
                  <Detail label="Email" value={booking.email || "-"} />
                  <Detail label="Address" value={booking.address || "-"} />
                  <Detail
                    label="License #"
                    value={booking.license_number || "-"}
                  />
                  <Detail
                    label="License Expiry"
                    value={
                      booking.license_expiry
                        ? formatDate(booking.license_expiry)
                        : "-"
                    }
                  />
                  <Detail
                    label="ID / Passport"
                    value={booking.id_number || "-"}
                  />
                </InfoCard>

                <InfoCard title="Vehicle Details">
                  <Detail label="Vehicle" value={booking.vehicle_name} />
                  <Detail
                    label="Make / Model"
                    value={`${booking.make || ""} ${booking.model || ""}`}
                  />
                  <Detail
                    label="Year"
                    value={booking.year ? String(booking.year) : "-"}
                  />
                  <Detail label="Plate" value={booking.plate_number} />
                  <Detail label="Color" value={booking.color || "-"} />
                  <Detail
                    label="Transmission"
                    value={booking.transmission || "-"}
                  />
                  <Detail label="Fuel Type" value={booking.fuel_type || "-"} />
                </InfoCard>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <InfoCard title="Rental Period">
                  <Detail
                    label="Pickup Date"
                    value={formatDate(booking.pickup_date)}
                  />
                  <Detail
                    label="Pickup Time"
                    value={booking.pickup_time || "-"}
                  />
                  <Detail
                    label="Return Date"
                    value={formatDate(booking.return_date)}
                  />
                  <Detail
                    label="Return Time"
                    value={booking.return_time || "-"}
                  />
                  <Detail
                    label="Number of Days"
                    value={String(booking.number_of_days)}
                  />
                  <Detail
                    label="Daily Rate"
                    value={`$${Number(booking.daily_rate || 0).toFixed(2)}`}
                  />
                </InfoCard>

                <InfoCard title="Charges & Balance">
                  <Detail
                    label="Deposit"
                    value={`$${Number(booking.deposit || 0).toFixed(2)}`}
                  />
                  <Detail
                    label="Discount"
                    value={`$${Number(booking.discount || 0).toFixed(2)}`}
                  />
                  <Detail
                    label="Extra Charges"
                    value={`$${Number(booking.extra_charges || 0).toFixed(2)}`}
                  />
                  <Detail
                    label="Total Amount"
                    value={`$${Number(booking.total_amount || 0).toFixed(2)}`}
                  />
                  <Detail
                    label="Amount Paid"
                    value={`$${Number(booking.amount_paid || 0).toFixed(2)}`}
                  />
                  <Detail
                    label="Balance"
                    value={`$${Number(booking.balance || 0).toFixed(2)}`}
                    strong
                  />
                </InfoCard>
              </div>

              <div className="mt-8 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Inspection Video Evidence
                </h3>

                {videos.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No inspection videos uploaded for this booking yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-semibold capitalize text-gray-900">
                            {video.inspection_type} video
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(video.created_at)}
                          </p>
                        </div>

                        <video
                          src={video.file_url}
                          controls
                          className="w-full rounded-lg border bg-black print:hidden"
                        />

                        <p className="hidden text-sm text-gray-600 print:block">
                          Video evidence uploaded: {video.file_url}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Payment History
                </h3>

                {payments.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No payments recorded for this booking yet.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Reference</th>
                          <th className="px-4 py-3">Notes</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3">
                              {formatDate(payment.created_at)}
                            </td>
                            <td className="px-4 py-3 font-bold text-green-700">
                              ${Number(payment.amount || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              {payment.payment_method.replaceAll("_", " ")}
                            </td>
                            <td className="px-4 py-3">
                              {payment.payment_reference || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {payment.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div className="mt-8 rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900">Notes</h3>
                  <p className="mt-3 text-sm text-gray-700">{booking.notes}</p>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Rental Agreement Terms
                </h3>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>
                    1. The customer agrees to return the vehicle on or before
                    the return date and time listed above.
                  </p>
                  <p>
                    2. The customer is responsible for any damage, traffic
                    violations, missing fuel, late fees, or additional charges
                    incurred during the rental period.
                  </p>
                  <p>
                    3. The vehicle must not be used for illegal activity,
                    reckless driving, racing, towing, or any unauthorized
                    purpose.
                  </p>
                  <p>
                    4. Roberts Auto Rental reserves the right to charge the
                    customer for late returns, damages, cleaning, fuel, or other
                    agreed rental charges.
                  </p>
                  <p>
                    5. By signing below, the customer confirms that all personal,
                    license, rental, payment, and vehicle condition information
                    is true and accepted.
                  </p>
                </div>
              </div>

              <div className="mt-12 grid gap-10 md:grid-cols-2">
                <div>
                  <div className="border-t border-gray-400 pt-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Customer Signature
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.customer_name}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="border-t border-gray-400 pt-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Staff Signature
                    </p>
                    <p className="text-xs text-gray-500">
                      Roberts Auto Rental
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t pt-5 text-center text-xs text-gray-500">
                <p>Roberts Auto Rental — Fleet & Booking Manager</p>
                <p>Printed on {new Date().toLocaleDateString("en-US")}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-lg px-4 py-3 hover:bg-white/10">
      {label}
    </Link>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={`text-right ${
          strong ? "font-bold text-red-600" : "font-semibold text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
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

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}