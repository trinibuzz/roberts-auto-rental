import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import SignaturePad from "./SignaturePad";

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
  customer_id: number;
  vehicle_id: number;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
};

type Signature = {
  id: number;
  signature_data: string;
  signed_name: string | null;
  signed_at: string;
  rep_name: string | null;
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

async function getSignatureDetails(bookingId: string) {
  const pool = createPool();

  const [bookingRows] = await pool.execute(
    `
      SELECT
        bookings.id,
        bookings.booking_number,
        bookings.status,
        bookings.customer_id,
        bookings.vehicle_id,
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
    redirect("/rep/signatures");
  }

  const [signatureRows] = await pool.execute(
    `
      SELECT
        id,
        signature_data,
        signed_name,
        signed_at,
        rep_name
      FROM customer_signatures
      WHERE booking_id = ?
      ORDER BY signed_at DESC
    `,
    [bookingId]
  );

  return {
    booking,
    signatures: signatureRows as Signature[],
  };
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value: string) {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function RepSignatureDetailPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, signatures } = await getSignatureDetails(params.bookingId);

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
              <p className="text-xs text-white/50">Signature Detail</p>
            </div>
          </Link>

          <Link
            href="/rep/signatures"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            All Signatures
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

        <SignaturePad booking={booking} />

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black">Saved Signatures</h2>

          <div className="mt-5 space-y-5">
            {signatures.length === 0 ? (
              <p className="text-white/60">No signatures saved yet.</p>
            ) : (
              signatures.map((signature) => (
                <div
                  key={signature.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-black text-[#d4af37]">
                        {signature.signed_name || booking.customer_name}
                      </p>

                      <p className="text-sm text-white/50">
                        Signed: {formatDateTime(signature.signed_at)}
                      </p>
                    </div>

                    <p className="text-sm text-white/50">
                      Rep: {signature.rep_name || "Rep"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <img
                      src={signature.signature_data}
                      alt="Customer signature"
                      className="max-h-60 w-full object-contain"
                    />
                  </div>
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