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
  const token =
    cookieStore.get("roberts_rep_token")?.value ||
    cookieStore.get("roberts_token")?.value ||
    cookieStore.get("robers_token")?.value ||
    cookieStore.get("admin_token")?.value ||
    cookieStore.get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as RepUser;

    const allowedRoles = ["admin", "staff", "rep"];

    if (!allowedRoles.includes(String(decoded.role || "").toLowerCase())) {
      redirect("/admin/login");
    }

    return decoded;
  } catch (error) {
    redirect("/admin/login");
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
    redirect("/rep");
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
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Rental Workflow
            </h1>
          </div>

          <Link
            href="/rep"
            className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-white shadow-xl shadow-black/5">
          <div className="bg-gradient-to-r from-[#111111] to-[#3a2410] p-6 text-white">
            <div className="inline-flex rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black uppercase text-[#111111]">
              {booking.status}
            </div>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              {booking.booking_number}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/80">
              Complete the rental process step by step from the phone or tablet.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <InfoBox title="Customer" lines={[booking.customer_name, booking.phone]} />

            <InfoBox
              title="Vehicle"
              lines={[booking.vehicle_name, booking.plate_number]}
            />

            <InfoBox title="Total" lines={[formatMoney(booking.total_amount)]} />

            <InfoBox title="Balance" lines={[formatMoney(booking.balance)]} />
          </div>
        </section>

        <section className="grid gap-4">
          <WorkflowStep
            number="1"
            title="Booking Created"
            text="The booking has been created and is ready for processing."
            status="Completed"
            completed
            href={`/admin/bookings/${booking.id}`}
            buttonText="View Booking"
            tone="green"
          />

          <WorkflowStep
            number="2"
            title="Record Payment"
            text="Collect deposit, rental payment, balance, or payment reference."
            status={paymentDone ? "Completed" : "Pending"}
            completed={paymentDone}
            href={`/rep/payments/${booking.id}`}
            buttonText={paymentDone ? "View / Add Payment" : "Record Payment"}
            tone="gold"
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
            tone="blue"
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
            tone="black"
          />
        </section>

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Workflow Summary
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">
            Rental Progress
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStatus label="Payments" value={booking.payment_count} />
            <MiniStatus label="Inspections" value={booking.inspection_count} />
            <MiniStatus label="Evidence Files" value={booking.media_count} />
            <MiniStatus label="Signatures" value={booking.signature_count} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/rep"
              className="rounded-2xl bg-[#111111] px-5 py-5 text-center text-sm font-black text-white shadow-lg"
            >
              Back to Rep Home
            </Link>

            <Link
              href="/rep/bookings/new"
              className="rounded-2xl border border-[#e7e2d9] bg-white px-5 py-5 text-center text-sm font-black text-[#1d1d1f] shadow-sm"
            >
              Create Another Booking
            </Link>
          </div>
        </section>
      </section>

      <BottomNav active="pickups" />
    </main>
  );
}

function InfoBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b98320]">
        {title}
      </p>

      {lines.map((line, index) => (
        <p
          key={`${title}-${index}`}
          className={`mt-2 ${
            index === 0
              ? "text-base font-black text-[#1d1d1f]"
              : "text-sm font-semibold text-[#7a7168]"
          }`}
        >
          {line || "-"}
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
  tone,
}: {
  number: string;
  title: string;
  text: string;
  status: string;
  completed?: boolean;
  href: string;
  buttonText: string;
  tone: "gold" | "black" | "green" | "blue";
}) {
  const colors = {
    gold: {
      badge: "bg-[#fff6df] text-[#b98320]",
      number: "bg-[#d4af37] text-[#111111]",
      button: "bg-gradient-to-r from-[#d4af37] to-[#b98320] text-white",
    },
    black: {
      badge: "bg-[#111111] text-white",
      number: "bg-[#111111] text-white",
      button: "bg-[#111111] text-white",
    },
    green: {
      badge: "bg-green-100 text-green-800",
      number: "bg-green-600 text-white",
      button: "bg-green-700 text-white",
    },
    blue: {
      badge: "bg-blue-100 text-blue-800",
      number: "bg-blue-700 text-white",
      button: "bg-blue-700 text-white",
    },
  };

  const selected = colors[tone];

  return (
    <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
      <div className="flex gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${selected.number}`}
        >
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${selected.badge}`}
          >
            {completed ? "Completed" : status}
          </div>

          <h2 className="font-serif text-2xl font-black">{title}</h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#7a7168]">
            {text}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className={`mt-5 block rounded-2xl px-5 py-5 text-center text-sm font-black shadow-lg ${selected.button}`}
      >
        {buttonText}
      </Link>
    </section>
  );
}

function MiniStatus({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a8178]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#b98320]">{value}</p>
    </div>
  );
}

function BottomNav({
  active,
}: {
  active: "home" | "book" | "pickups" | "returns" | "vehicles";
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d9] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-2">
        <BottomNavLink
          href="/rep"
          label="Home"
          icon="⌂"
          active={active === "home"}
        />

        <BottomNavLink
          href="/rep/bookings/new"
          label="Book"
          icon="+"
          active={active === "book"}
        />

        <BottomNavLink
          href="/rep/pickups"
          label="Pickups"
          icon="↗"
          active={active === "pickups"}
        />

        <BottomNavLink
          href="/rep/returns"
          label="Returns"
          icon="↙"
          active={active === "returns"}
        />

        <BottomNavLink
          href="/rep/vehicles"
          label="Cars"
          icon="🚗"
          active={active === "vehicles"}
        />
      </div>
    </nav>
  );
}

function BottomNavLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-2 py-2 text-center text-[11px] font-black ${
        active ? "bg-[#111111] text-white" : "text-[#6b6257]"
      }`}
    >
      <span className="block text-base leading-none">{icon}</span>
      <span className="mt-1 block">{label}</span>
    </Link>
  );
}