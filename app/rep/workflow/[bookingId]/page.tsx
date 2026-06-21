import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

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
  inspection_count: number;
  media_count: number;
  payment_count: number;
  signature_count: number;
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

async function getWorkflowDetails(bookingId: string) {
  const pool = createPool();

  const [rows] = await pool.execute(
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
        vehicles.plate_number,

        (
          SELECT COUNT(*)
          FROM rep_vehicle_inspections
          WHERE rep_vehicle_inspections.booking_id = bookings.id
        ) AS inspection_count,

        (
          SELECT COUNT(*)
          FROM vehicle_inspection_media
          WHERE vehicle_inspection_media.booking_id = bookings.id
          AND vehicle_inspection_media.deleted_at IS NULL
        ) AS media_count,

        (
          SELECT COUNT(*)
          FROM rep_payments
          WHERE rep_payments.booking_id = bookings.id
        ) AS payment_count,

        (
          SELECT COUNT(*)
          FROM customer_signatures
          WHERE customer_signatures.booking_id = bookings.id
        ) AS signature_count

      FROM bookings
      INNER JOIN customers ON customers.id = bookings.customer_id
      INNER JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE bookings.id = ?
      LIMIT 1
    `,
    [bookingId]
  );

  const bookings = rows as BookingDetails[];
  const booking = bookings[0];

  if (!booking) {
    redirect("/rep/dashboard");
  }

  return booking;
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function RepWorkflowPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const booking = await getWorkflowDetails(params.bookingId);

  const paymentDone = Number(booking.payment_count || 0) > 0;
  const inspectionDone = Number(booking.inspection_count || 0) > 0;
  const evidenceDone = Number(booking.media_count || 0) > 0;
  const signatureDone = Number(booking.signature_count || 0) > 0;

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
              <p className="text-xs text-white/50">Guided Rental Workflow</p>
            </div>
          </Link>

          <Link
            href="/rep/dashboard"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            Dashboard
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

          <p className="mt-4 max-w-2xl text-white/70">
            Complete the rental process step by step from the tablet.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Customer"
              lines={[booking.customer_name, booking.phone]}
            />

            <InfoCard
              title="Vehicle"
              lines={[booking.vehicle_name, booking.plate_number]}
            />

            <InfoCard title="Total" lines={[formatMoney(booking.total_amount)]} />

            <InfoCard title="Balance" lines={[formatMoney(booking.balance)]} />
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          <WorkflowStep
            number="1"
            title="Booking Created"
            text="The booking has been created and is ready for processing."
            status="Completed"
            completed
            href={`/admin/bookings/${booking.id}`}
            buttonText="View Booking"
          />

          <WorkflowStep
            number="2"
            title="Record Payment"
            text="Collect deposit, rental payment, balance, or payment reference."
            status={paymentDone ? "Completed" : "Pending"}
            completed={paymentDone}
            href={`/rep/payments/${booking.id}`}
            buttonText={paymentDone ? "View / Add Payment" : "Record Payment"}
          />

          <WorkflowStep
            number="3"
            title="Vehicle Inspection"
            text="Record mileage, fuel level, damages, checkout/return condition, and upload photo/video evidence."
            status={inspectionDone || evidenceDone ? "In Progress" : "Pending"}
            completed={inspectionDone && evidenceDone}
            href={`/rep/inspections/${booking.id}`}
            buttonText={
              inspectionDone || evidenceDone
                ? "Continue Inspection"
                : "Start Inspection"
            }
          />

          <WorkflowStep
            number="4"
            title="Customer Signature"
            text="Let the customer sign the rental agreement directly on the tablet."
            status={signatureDone ? "Completed" : "Pending"}
            completed={signatureDone}
            href={`/rep/signatures/${booking.id}`}
            buttonText={
              signatureDone ? "View / Add Signature" : "Capture Signature"
            }
          />

          <div className="rounded-3xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-6">
            <h2 className="text-2xl font-black text-[#d4af37]">
              Rental Workflow Summary
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStatus label="Payments" value={booking.payment_count} />
              <MiniStatus label="Inspections" value={booking.inspection_count} />
              <MiniStatus label="Evidence Files" value={booking.media_count} />
              <MiniStatus label="Signatures" value={booking.signature_count} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/rep/dashboard"
                className="rounded-xl bg-[#d4af37] px-5 py-4 text-center font-black text-[#07111f] hover:bg-[#c79f2f]"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/rep/bookings/new"
                className="rounded-xl border border-white/20 px-5 py-4 text-center font-bold text-white hover:bg-white/10"
              >
                Create Another Booking
              </Link>

              <Link
                href={`/admin/bookings/${booking.id}`}
                className="rounded-xl border border-white/20 px-5 py-4 text-center font-bold text-white hover:bg-white/10"
              >
                Admin Booking View
              </Link>
            </div>
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

function WorkflowStep({
  number,
  title,
  text,
  status,
  completed,
  href,
  buttonText,
}: {
  number: string;
  title: string;
  text: string;
  status: string;
  completed?: boolean;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
              completed
                ? "bg-green-400 text-[#07111f]"
                : "bg-[#d4af37] text-[#07111f]"
            }`}
          >
            {number}
          </div>

          <div>
            <div
              className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-black uppercase ${
                completed
                  ? "bg-green-400/20 text-green-300"
                  : "bg-[#d4af37]/20 text-[#d4af37]"
              }`}
            >
              {status}
            </div>

            <h2 className="text-2xl font-black">{title}</h2>

            <p className="mt-2 max-w-2xl text-white/60">{text}</p>
          </div>
        </div>

        <Link
          href={href}
          className="rounded-xl bg-[#d4af37] px-5 py-4 text-center font-black text-[#07111f] hover:bg-[#c79f2f]"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#d4af37]">{value}</p>
    </div>
  );
}