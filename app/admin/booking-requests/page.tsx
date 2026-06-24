import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

export const dynamic = "force-dynamic";

type BookingRequestRow = {
  id: number;
  request_number: string;
  vehicle_id: number | null;
  vehicle_name: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  pickup_date: string | Date;
  pickup_time: string | null;
  return_date: string | Date;
  return_time: string | null;
  notes: string | null;
  status: string;
  created_at: string | Date | null;
};

type VehicleRow = {
  id: number;
  vehicle_name: string | null;
  plate_number: string | null;
  daily_rate: string | number | null;
  deposit_amount: string | number | null;
  status: string | null;
};

type CustomerRow = {
  id: number;
};

type InsertResult = {
  insertId: number;
};

async function requireOfficeUser() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

async function updateRequestStatus(formData: FormData) {
  "use server";

  await requireOfficeUser();

  const requestId = Number(formData.get("request_id"));
  const status = String(formData.get("status") || "").trim().toLowerCase();

  const allowedStatuses = [
    "pending",
    "contacted",
    "approved",
    "rejected",
    "converted",
  ];

  if (!requestId || !allowedStatuses.includes(status)) {
    redirect("/admin/booking-requests?error=invalid");
  }

  await db.query(
    `
      UPDATE public_booking_requests
      SET status = ?
      WHERE id = ?
    `,
    [status, requestId]
  );

  redirect("/admin/booking-requests?updated=1");
}

async function convertRequestToBooking(formData: FormData) {
  "use server";

  await requireOfficeUser();

  const requestId = Number(formData.get("request_id"));

  if (!requestId) {
    redirect("/admin/booking-requests?error=invalid");
  }

  const [requestRows] = await db.query(
    `
      SELECT
        id,
        request_number,
        vehicle_id,
        vehicle_name,
        full_name,
        email,
        phone,
        pickup_date,
        pickup_time,
        return_date,
        return_time,
        notes,
        status,
        created_at
      FROM public_booking_requests
      WHERE id = ?
      LIMIT 1
    `,
    [requestId]
  );

  const requests = requestRows as BookingRequestRow[];
  const request = requests[0];

  if (!request) {
    redirect("/admin/booking-requests?error=notfound");
  }

  if (!request.vehicle_id) {
    redirect("/admin/booking-requests?error=missing_vehicle");
  }

  if (String(request.status || "").toLowerCase() === "converted") {
    redirect("/admin/booking-requests?error=already_converted");
  }

  const [vehicleRows] = await db.query(
    `
      SELECT
        id,
        vehicle_name,
        plate_number,
        daily_rate,
        deposit_amount,
        status
      FROM vehicles
      WHERE id = ?
      LIMIT 1
    `,
    [request.vehicle_id]
  );

  const vehicles = vehicleRows as VehicleRow[];
  const vehicle = vehicles[0];

  if (!vehicle) {
    redirect("/admin/booking-requests?error=vehicle_not_found");
  }

  let customerId = await findExistingCustomer(request.email, request.phone);

  if (!customerId) {
    const [customerInsertResult] = await db.query(
      `
        INSERT INTO customers (
          full_name,
          phone,
          email
        )
        VALUES (?, ?, ?)
      `,
      [
        request.full_name,
        request.phone,
        request.email || null,
      ]
    );

    customerId = Number((customerInsertResult as InsertResult).insertId || 0);
  }

  if (!customerId) {
    redirect("/admin/booking-requests?error=customer_failed");
  }

  const days = calculateRentalDays(request.pickup_date, request.return_date);
  const dailyRate = Number(vehicle.daily_rate || 0);
  const deposit = Number(vehicle.deposit_amount || 0);
  const totalAmount = days * dailyRate;
  const amountPaid = 0;
  const balance = totalAmount - amountPaid;
  const bookingNumber = createBookingNumber();

  const bookingNotes = [
    `Converted from website request ${request.request_number}.`,
    request.notes ? `Customer notes: ${request.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const [bookingInsertResult] = await db.query(
    `
      INSERT INTO bookings (
        booking_number,
        customer_id,
        vehicle_id,
        pickup_date,
        pickup_time,
        return_date,
        return_time,
        daily_rate,
        number_of_days,
        deposit,
        discount,
        extra_charges,
        total_amount,
        amount_paid,
        balance,
        status,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, 'confirmed', ?)
    `,
    [
      bookingNumber,
      customerId,
      request.vehicle_id,
      request.pickup_date,
      request.pickup_time || null,
      request.return_date,
      request.return_time || null,
      dailyRate,
      days,
      deposit,
      totalAmount,
      amountPaid,
      balance,
      bookingNotes,
    ]
  );

  const bookingId = Number((bookingInsertResult as InsertResult).insertId || 0);

  if (!bookingId) {
    redirect("/admin/booking-requests?error=booking_failed");
  }

  await db.query(
    `
      UPDATE public_booking_requests
      SET status = 'converted'
      WHERE id = ?
    `,
    [requestId]
  );

  await db.query(
    `
      UPDATE vehicles
      SET status = 'reserved'
      WHERE id = ?
      AND LOWER(status) = 'available'
    `,
    [request.vehicle_id]
  );

  redirect(`/admin/bookings/${bookingId}`);
}

async function findExistingCustomer(email: string | null, phone: string) {
  if (email) {
    const [emailRows] = await db.query(
      `
        SELECT id
        FROM customers
        WHERE LOWER(email) = ?
        LIMIT 1
      `,
      [email.toLowerCase()]
    );

    const emailCustomers = emailRows as CustomerRow[];

    if (emailCustomers[0]?.id) {
      return Number(emailCustomers[0].id);
    }
  }

  const [phoneRows] = await db.query(
    `
      SELECT id
      FROM customers
      WHERE phone = ?
      LIMIT 1
    `,
    [phone]
  );

  const phoneCustomers = phoneRows as CustomerRow[];

  return Number(phoneCustomers[0]?.id || 0);
}

function createBookingNumber() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);

  return `RB-${stamp}-${random}`;
}

function calculateRentalDays(pickupDate: string | Date, returnDate: string | Date) {
  const pickup = new Date(pickupDate);
  const returned = new Date(returnDate);
  const diff = returned.getTime() - pickup.getTime();
  const calculatedDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return calculatedDays > 0 ? calculatedDays : 1;
}

function formatDate(value: string | Date | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  const [hours, minutes] = value.split(":");

  if (!hours || !minutes) return value;

  const hourNumber = Number(hours);
  const suffix = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function getErrorMessage(error: string) {
  const messages: Record<string, string> = {
    invalid: "Something went wrong. Please try again.",
    notfound: "That request was not found.",
    missing_vehicle:
      "This request has no selected vehicle. Open Create Booking and enter it manually.",
    already_converted: "This request was already converted.",
    vehicle_not_found: "The selected vehicle was not found.",
    customer_failed: "The customer could not be created.",
    booking_failed: "The booking could not be created.",
  };

  return messages[error] || "Something went wrong. Please try again.";
}

export default async function AdminBookingRequestsPage({
  searchParams,
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  await requireOfficeUser();

  const [rows] = await db.query(
    `
      SELECT
        id,
        request_number,
        vehicle_id,
        vehicle_name,
        full_name,
        email,
        phone,
        pickup_date,
        pickup_time,
        return_date,
        return_time,
        notes,
        status,
        created_at
      FROM public_booking_requests
      ORDER BY
        CASE LOWER(status)
          WHEN 'pending' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'approved' THEN 3
          WHEN 'converted' THEN 4
          WHEN 'rejected' THEN 5
          ELSE 6
        END,
        created_at DESC
    `
  );

  const requests = rows as BookingRequestRow[];

  const pendingCount = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "pending"
  ).length;

  const contactedCount = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "contacted"
  ).length;

  const approvedCount = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "approved"
  ).length;

  const convertedCount = requests.filter(
    (request) => String(request.status || "").toLowerCase() === "converted"
  ).length;

  const updated = searchParams?.updated === "1";
  const error = searchParams?.error || "";

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="booking-requests" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b98320]">
                  Roberts Auto Rental
                </p>

                <h1 className="mt-2 font-serif text-4xl font-black text-[#1d1d1f]">
                  Booking Requests
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Review public customer requests and convert approved requests
                  into real rental bookings.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/book"
                  target="_blank"
                  className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black text-[#4b443d] shadow-sm"
                >
                  View Public Form
                </Link>

                <Link
                  href="/admin/bookings/new"
                  className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-center text-sm font-black text-white shadow-lg"
                >
                  Create Booking
                </Link>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            {updated ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
                Booking request status updated.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {getErrorMessage(error)}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-5">
              <StatCard title="Total Requests" value={String(requests.length)} />
              <StatCard title="Pending" value={String(pendingCount)} />
              <StatCard title="Contacted" value={String(contactedCount)} />
              <StatCard title="Approved" value={String(approvedCount)} />
              <StatCard title="Converted" value={String(convertedCount)} />
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="border-b border-[#eee9df] px-6 py-5">
                <h2 className="font-serif text-2xl font-black text-[#1d1d1f]">
                  Customer Website Requests
                </h2>

                <p className="mt-1 text-sm text-[#7a7168]">
                  Use Convert To Booking after the office confirms the customer,
                  date, vehicle, and deposit details.
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ✉
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No public booking requests yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    When customers submit the public booking form, requests will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#eee9df]">
                  {requests.map((request) => {
                    const isConverted =
                      String(request.status || "").toLowerCase() === "converted";

                    return (
                      <article
                        key={request.id}
                        className="grid gap-5 px-6 py-6 xl:grid-cols-[1.1fr_1fr_1fr_0.8fr_1fr]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black text-[#1d1d1f]">
                              {request.full_name}
                            </h3>

                            <StatusBadge status={request.status} />
                          </div>

                          <p className="mt-1 text-sm font-bold text-[#7a7168]">
                            {request.request_number}
                          </p>

                          <p className="mt-4 text-sm font-semibold text-[#5f554c]">
                            Phone:{" "}
                            <a
                              href={`tel:${request.phone}`}
                              className="font-black text-[#1d1d1f]"
                            >
                              {request.phone}
                            </a>
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#5f554c]">
                            Email:{" "}
                            {request.email ? (
                              <a
                                href={`mailto:${request.email}`}
                                className="font-black text-[#1d1d1f]"
                              >
                                {request.email}
                              </a>
                            ) : (
                              "-"
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
                            Vehicle
                          </p>

                          <p className="mt-2 text-base font-black text-[#1d1d1f]">
                            {request.vehicle_name || "Office to recommend"}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#7a7168]">
                            Vehicle ID: {request.vehicle_id || "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
                            Rental Dates
                          </p>

                          <p className="mt-2 text-sm font-black text-[#1d1d1f]">
                            Pickup: {formatDate(request.pickup_date)}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#7a7168]">
                            {formatTime(request.pickup_time)}
                          </p>

                          <p className="mt-3 text-sm font-black text-[#1d1d1f]">
                            Return: {formatDate(request.return_date)}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#7a7168]">
                            {formatTime(request.return_time)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
                            Submitted
                          </p>

                          <p className="mt-2 text-sm font-black text-[#1d1d1f]">
                            {formatDate(request.created_at)}
                          </p>

                          <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
                            Notes
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-[#7a7168]">
                            {request.notes || "No notes added."}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <form action={convertRequestToBooking}>
                            <input
                              type="hidden"
                              name="request_id"
                              value={request.id}
                            />

                            <button
                              type="submit"
                              disabled={isConverted}
                              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isConverted ? "Already Converted" : "Convert To Booking"}
                            </button>
                          </form>

                          <form action={updateRequestStatus}>
                            <input
                              type="hidden"
                              name="request_id"
                              value={request.id}
                            />
                            <input type="hidden" name="status" value="contacted" />

                            <button
                              type="submit"
                              disabled={isConverted}
                              className="w-full rounded-xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-black text-[#4b443d] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Mark Contacted
                            </button>
                          </form>

                          <form action={updateRequestStatus}>
                            <input
                              type="hidden"
                              name="request_id"
                              value={request.id}
                            />
                            <input type="hidden" name="status" value="approved" />

                            <button
                              type="submit"
                              disabled={isConverted}
                              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Approve Request
                            </button>
                          </form>

                          <Link
                            href="/admin/bookings/new"
                            className="block rounded-xl bg-[#0b0b0c] px-4 py-3 text-center text-sm font-black text-white shadow-sm"
                          >
                            Create Manually
                          </Link>

                          <form action={updateRequestStatus}>
                            <input
                              type="hidden"
                              name="request_id"
                              value={request.id}
                            />
                            <input type="hidden" name="status" value="rejected" />

                            <button
                              type="submit"
                              disabled={isConverted}
                              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98320]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#1d1d1f]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cleanStatus = String(status || "pending").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    contacted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    converted: "bg-purple-100 text-purple-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {cleanStatus}
    </span>
  );
}
