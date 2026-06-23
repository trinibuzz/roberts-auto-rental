import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
    redirect("/rep");
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

async function savePayment(formData: FormData) {
  "use server";

  const repUser = await getRepUser();

  const bookingId = String(formData.get("booking_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const paymentMethod = String(formData.get("payment_method") || "Cash");
  const paymentDate = String(
    formData.get("payment_date") || new Date().toISOString().slice(0, 10)
  );
  const referenceNumber = String(formData.get("reference_number") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!bookingId || !amount || amount <= 0) {
    redirect(`/rep/mobile/payments/${bookingId}`);
  }

  const pool = createPool();

  await pool.execute(
    `
      INSERT INTO rep_payments (
        booking_id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        notes,
        rep_name,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      bookingId,
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber || null,
      notes || null,
      repUser.name || repUser.email || "Rep",
    ]
  );

  await pool.execute(
    `
      UPDATE bookings
      SET 
        amount_paid = COALESCE(amount_paid, 0) + ?,
        balance = GREATEST(
          COALESCE(total_amount, 0) - (COALESCE(amount_paid, 0) + ?),
          0
        )
      WHERE id = ?
    `,
    [amount, amount, bookingId]
  );

  revalidatePath(`/rep/mobile/payments/${bookingId}`);
  revalidatePath(`/rep/workflow/${bookingId}`);

  redirect(`/rep/workflow/${bookingId}`);
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

export default async function RepMobilePaymentPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, payments } = await getPaymentDetails(params.bookingId);

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Record Payment
            </h1>
          </div>

          <Link
            href={`/rep/workflow/${booking.id}`}
            className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
          >
            Back
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-white shadow-xl shadow-black/5">
          <div className="bg-gradient-to-r from-[#d4af37] to-[#b98320] p-6 text-white">
            <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase text-white">
              {booking.status}
            </div>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              {booking.booking_number}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
              Collect rental payment, deposit, balance, or payment reference.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <InfoBox
              title="Customer"
              lines={[booking.customer_name, booking.phone]}
            />

            <InfoBox
              title="Vehicle"
              lines={[booking.vehicle_name, booking.plate_number]}
            />

            <InfoBox title="Total" lines={[formatMoney(booking.total_amount)]} />

            <InfoBox title="Balance" lines={[formatMoney(booking.balance)]} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Payment Entry
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">Add Payment</h2>

          <form action={savePayment} className="mt-5 space-y-4">
            <input type="hidden" name="booking_id" value={booking.id} />

            <label className="block">
              <span className="block text-sm font-black text-[#4b443d]">
                Amount Paid
              </span>

              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-black text-[#4b443d]">
                Payment Method
              </span>

              <select
                name="payment_method"
                defaultValue="Cash"
                className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online Payment">Online Payment</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-black text-[#4b443d]">
                Payment Date
              </span>

              <input
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-black text-[#4b443d]">
                Reference Number
              </span>

              <input
                name="reference_number"
                type="text"
                placeholder="Receipt, transfer, or card reference"
                className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-black text-[#4b443d]">
                Notes
              </span>

              <textarea
                name="notes"
                placeholder="Optional payment notes"
                className="mt-2 min-h-28 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-base font-black text-white shadow-lg"
            >
              Save Payment
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Payment History
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">
            Payments Recorded
          </h2>

          <div className="mt-5 space-y-4">
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-sm font-semibold text-[#7a7168]">
                No payments recorded yet.
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-3xl font-black text-[#b98320]">
                        {formatMoney(payment.amount)}
                      </p>

                      <p className="mt-1 text-sm font-bold text-[#7a7168]">
                        {payment.payment_method} —{" "}
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>

                    <div className="text-sm font-semibold text-[#7a7168]">
                      <p>Rep: {payment.rep_name || "Rep"}</p>
                      {payment.reference_number ? (
                        <p>Ref: {payment.reference_number}</p>
                      ) : null}
                    </div>
                  </div>

                  {payment.notes ? (
                    <p className="mt-3 text-sm font-semibold text-[#7a7168]">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
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
