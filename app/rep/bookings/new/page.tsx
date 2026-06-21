import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import RepBookingForm from "./RepBookingForm";

export const dynamic = "force-dynamic";

type RepUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type Customer = {
  id: number;
  full_name: string;
  phone: string;
};

type Vehicle = {
  id: number;
  vehicle_name: string;
  make: string;
  model: string;
  plate_number: string;
  daily_rate: number;
  deposit_amount: number;
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

async function getFormData() {
  const pool = createPool();

  const [customerRows] = await pool.execute(
    `
      SELECT id, full_name, phone
      FROM customers
      WHERE is_blacklisted = 0
      ORDER BY full_name ASC
    `
  );

  const [vehicleRows] = await pool.execute(
    `
      SELECT 
        id,
        vehicle_name,
        make,
        model,
        plate_number,
        daily_rate,
        deposit_amount
      FROM vehicles
      WHERE status = 'available'
      ORDER BY vehicle_name ASC
    `
  );

  return {
    customers: customerRows as Customer[],
    vehicles: vehicleRows as Vehicle[],
  };
}

export default async function NewRepBookingPage() {
  await getRepUser();

  const { customers, vehicles } = await getFormData();

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#050b14] px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/rep/dashboard" className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-[#d4af37]">
                Roberts Auto Rental
              </p>
              <p className="text-xs text-white/50">New Booking</p>
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

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Rep Booking Entry
              </p>

              <h1 className="mt-3 text-4xl font-black">
                Create New Booking
              </h1>

              <p className="mt-3 text-white/60">
                Select a customer, choose an available vehicle, and create a
                confirmed booking from the tablet.
              </p>
            </div>

            <Link
              href="/rep/customers/new"
              className="rounded-xl bg-[#d4af37] px-5 py-4 text-center font-black text-[#07111f] hover:bg-[#c79f2f]"
            >
              Add Customer
            </Link>
          </div>

          {customers.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-800">
              <p className="font-bold">No customers found.</p>
              <p className="mt-1 text-sm">
                Add a customer first before creating a booking.
              </p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-800">
              <p className="font-bold">No available vehicles found.</p>
              <p className="mt-1 text-sm">
                Check the admin vehicle list and make sure at least one vehicle
                is marked available.
              </p>
            </div>
          ) : (
            <RepBookingForm customers={customers} vehicles={vehicles} />
          )}
        </div>
      </section>
    </main>
  );
}