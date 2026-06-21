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

type DashboardStats = {
  availableVehicles: number;
  todaysPickups: number;
  todaysReturns: number;
  activeRentals: number;
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

async function getDashboardStats(): Promise<DashboardStats> {
  const pool = createPool();

  const [availableRows] = await pool.execute(
    `
      SELECT COUNT(*) AS count
      FROM vehicles
      WHERE status = 'available'
    `
  );

  const [pickupRows] = await pool.execute(
    `
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE DATE(pickup_date) = CURDATE()
      AND status IN ('confirmed', 'active')
    `
  );

  const [returnRows] = await pool.execute(
    `
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE DATE(return_date) = CURDATE()
      AND status IN ('active', 'overdue')
    `
  );

  const [activeRows] = await pool.execute(
    `
      SELECT COUNT(*) AS count
      FROM bookings
      WHERE status = 'active'
    `
  );

  const available = availableRows as Array<{ count: number }>;
  const pickups = pickupRows as Array<{ count: number }>;
  const returns = returnRows as Array<{ count: number }>;
  const active = activeRows as Array<{ count: number }>;

  return {
    availableVehicles: Number(available[0]?.count || 0),
    todaysPickups: Number(pickups[0]?.count || 0),
    todaysReturns: Number(returns[0]?.count || 0),
    activeRentals: Number(active[0]?.count || 0),
  };
}

export default async function RepDashboardPage() {
  const user = await getRepUser();
  const stats = await getDashboardStats();

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
              <p className="text-xs text-white/50">Rep Tablet App</p>
            </div>
          </Link>

          <form action="/api/rep/logout" method="post">
            <button className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">
              Logout
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#26070a] p-6 shadow-2xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Rep Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            Welcome, {user.name}
          </h1>

          <p className="mt-4 max-w-2xl text-white/70">
            Start a new rental, add a customer, check today’s pickups, or upload
            inspection evidence from the tablet.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available Vehicles"
            value={stats.availableVehicles}
            note="Ready to rent"
          />

          <StatCard
            title="Today's Pickups"
            value={stats.todaysPickups}
            note="Scheduled today"
          />

          <StatCard
            title="Today's Returns"
            value={stats.todaysReturns}
            note="Due back today"
          />

          <StatCard
            title="Active Rentals"
            value={stats.activeRentals}
            note="Currently out"
          />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="New Booking"
            text="Create a rental booking for a customer."
            href="/rep/bookings/new"
          />

          <ActionCard
            title="Add Customer"
            text="Capture customer details quickly."
            href="/rep/customers/new"
          />

          <ActionCard
            title="Vehicle Inspection"
            text="Mark scratches, damages, photos, and videos."
            href="/rep/inspections"
            disabled
          />

          <ActionCard
            title="Upload Video"
            text="Upload walkaround evidence before or after rental."
            href="/rep/videos"
            disabled
          />

          <ActionCard
            title="Record Payment"
            text="Collect deposit, balance, or rental payment."
            href="/rep/payments"
            disabled
          />

          <ActionCard
            title="Customer Signature"
            text="Let the customer sign the agreement on screen."
            href="/rep/signatures"
            disabled
          />
        </div>

        <div className="mt-8 rounded-3xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-6">
          <h2 className="text-2xl font-black text-[#d4af37]">
            Phase 2 Active
          </h2>

          <p className="mt-2 leading-7 text-white/70">
            New Booking and Add Customer are now active. Vehicle inspection,
            video upload, payment recording, and customer signature are coming
            in the next phase.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-sm font-bold text-white/60">{title}</p>
      <p className="mt-3 text-4xl font-black text-[#d4af37]">{value}</p>
      <p className="mt-2 text-sm text-white/50">{note}</p>
    </div>
  );
}

function ActionCard({
  title,
  text,
  href,
  disabled,
}: {
  title: string;
  text: string;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-70">
        <div className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/50">
          Coming Next
        </div>

        <h3 className="text-2xl font-black">{title}</h3>

        <p className="mt-3 leading-7 text-white/60">{text}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-3xl border border-[#d4af37]/40 bg-[#d4af37]/10 p-6 transition hover:-translate-y-1 hover:bg-[#d4af37]/20"
    >
      <div className="mb-4 inline-block rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-[#07111f]">
        Active
      </div>

      <h3 className="text-2xl font-black">{title}</h3>

      <p className="mt-3 leading-7 text-white/70">{text}</p>
    </Link>
  );
}