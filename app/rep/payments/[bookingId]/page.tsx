import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import PaymentForm from "./PaymentForm";

export const dynamic = "force-dynamic";

type RepUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type BookingDetails = {
  id: number;
  booking_number: string;
  status: string;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
};

type RepPayment = {
  id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  rep_name: string | null;
  created_at: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

async function getRepUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("roberts_rep_token")?.value;

  if (!token) {
    redirect("/rep/login");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as RepUser;

    const allowedRoles = ["admin", "staff", "rep"];

    if (!allowedRoles.includes(String(decoded.role || "").toLowerCase())) {
      redirect("/rep/login");
    }

    return decoded;
  } catch (error) {
    redirect("/rep/login");
  }
}

async function getPaymentDetails(bookingId: string) {
  const pool = createPool();

  const [bookingRows] = await pool.execute(
    `
      SELECT
        bookings.id,
        bookings.booking_number,
        bookings.status,
        bookings.total_amount,
        bookings.amount_paid,
        bookings.balance,
        customers.full_name AS customer_name,
        customers.phone,
        vehicles.vehicle_name,
        vehicles.plate_number
      FROM bookings
      INNER JOIN customers ON customers.id = bookings.customer_id
      INNER JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE bookings.id = ?
      LIMIT 1
    `,
    [bookingId]
  );

  const bookings = bookingRows as BookingDetails[];
  const booking = bookings[0];

  if (!booking) {
    redirect("/rep/payments");
  }

  const [paymentRows] = await pool.execute(
    `
      SELECT
        id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        notes,
        rep_name,
        created_at
      FROM rep_payments
      WHERE booking_id = ?
      ORDER BY created_at DESC
    `,
    [bookingId]
  );

  return {
    booking,
    payments: paymentRows as RepPayment[],
  };
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RepPaymentDetailPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, payments } = await getPaymentDetails(params.bookingId);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#050b14] px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/rep/dashboard" className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#d4af37]">
                Roberts Auto Rental
              </p>
              <p className="text-xs text-white/50">Payment Detail</p>
            </div>
          </Link>

          <Link
            href="/rep/payments"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            All Payments
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#26070a] p-6 shadow-2xl md:p-10">
          <div className="mb-4 inline-block rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black uppercase text-[#07111f]">
            {booking.status}
          </div>

          <h1 className="text-4xl font-black md:text-6xl">
            {booking.booking_number}
          </h1>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Customer" lines={[booking.customer_name, booking.phone]} />
            <InfoCard title="Vehicle" lines={[booking.vehicle_name, booking.plate_number]} />
            <InfoCard title="Total" lines={[formatMoney(booking.total_amount)]} />
            <InfoCard title="Balance" lines={[formatMoney(booking.balance)]} />
          </div>
        </div>

        <PaymentForm booking={booking} />

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Payment History</h2>

          <div className="mt-5 space-y-4">
            {payments.length === 0 ? (
              <p className="text-white/60">No payments recorded yet.</p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-2xl font-black text-[#d4af37]">
                        {formatMoney(payment.amount)}
                      </p>

                      <p className="mt-1 text-white/60">
                        {payment.payment_method} —{" "}
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>

                    <div className="text-sm text-white/50">
                      <p>Rep: {payment.rep_name || "Rep"}</p>
                      {payment.reference_number ? (
                        <p>Ref: {payment.reference_number}</p>
                      ) : null}
                    </div>
                  </div>

                  {payment.notes ? (
                    <p className="mt-3 text-white/60">{payment.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-sm font-bold text-[#d4af37]">{title}</p>

      {lines.map((line) => (
        <p key={line} className="mt-2 text-white/80">
          {line}
        </p>
      ))}
    </div>
  );
}