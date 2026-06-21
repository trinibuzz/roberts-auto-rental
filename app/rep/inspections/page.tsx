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

type Booking = {
  id: number;
  booking_number: string;
  status: string;
  pickup_date: string;
  return_date: string;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
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

async function getBookings() {
  const pool = createPool();

  const [rows] = await pool.execute(
    `
      SELECT
        bookings.id,
        bookings.booking_number,
        bookings.status,
        bookings.pickup_date,
        bookings.return_date,
        customers.full_name AS customer_name,
        customers.phone,
        vehicles.vehicle_name,
        vehicles.plate_number
      FROM bookings
      INNER JOIN customers ON customers.id = bookings.customer_id
      INNER JOIN vehicles ON vehicles.id = bookings.vehicle_id
      WHERE bookings.status IN ('confirmed', 'active', 'overdue')
      ORDER BY bookings.pickup_date DESC, bookings.id DESC
    `
  );

  return rows as Booking[];
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

export default async function RepInspectionsPage() {
  await getRepUser();

  const bookings = await getBookings();

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
              <p className="text-xs text-white/50">Vehicle Inspections</p>
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
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Phase 3
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            Vehicle Inspection
          </h1>

          <p className="mt-4 max-w-2xl text-white/70">
            Select a booking to record checkout or return condition, damages,
            mileage, fuel level, photos, and video evidence.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-black">No bookings found</h2>
              <p className="mt-2 text-white/60">
                Confirmed or active bookings will appear here for inspection.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/rep/inspections/${booking.id}`}
                className="rounded-3xl border border-white/10 bg-white/10 p-6 transition hover:-translate-y-1 hover:bg-white/15"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-3 inline-block rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-[#07111f]">
                      {booking.status}
                    </div>

                    <h2 className="text-2xl font-black">
                      {booking.booking_number}
                    </h2>

                    <p className="mt-2 text-white/70">
                      {booking.customer_name} — {booking.phone}
                    </p>

                    <p className="mt-1 text-white/50">
                      {booking.vehicle_name} — {booking.plate_number}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    <p>Pickup: {formatDate(booking.pickup_date)}</p>
                    <p className="mt-1">
                      Return: {formatDate(booking.return_date)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}