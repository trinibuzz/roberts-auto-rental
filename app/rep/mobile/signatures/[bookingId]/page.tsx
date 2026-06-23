import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import MobileSignaturePad from "./MobileSignaturePad";

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
    redirect("/rep");
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

async function saveSignature(formData: FormData) {
  "use server";

  const repUser = await getRepUser();

  const bookingId = String(formData.get("booking_id") || "");
  const customerId = String(formData.get("customer_id") || "");
  const vehicleId = String(formData.get("vehicle_id") || "");
  const signedName = String(formData.get("signed_name") || "").trim();
  const signatureData = String(formData.get("signature_data") || "").trim();

  if (!bookingId || !signatureData || signatureData.length < 50) {
    redirect(`/rep/mobile/signatures/${bookingId}`);
  }

  const pool = createPool();

  await pool.execute(
    `
      INSERT INTO customer_signatures (
        booking_id,
        customer_id,
        vehicle_id,
        signature_data,
        signed_name,
        rep_name,
        signed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      bookingId,
      customerId || null,
      vehicleId || null,
      signatureData,
      signedName || null,
      repUser.name || repUser.email || "Rep",
    ]
  );

  revalidatePath(`/rep/mobile/signatures/${bookingId}`);
  revalidatePath(`/rep/workflow/${bookingId}`);

  redirect(`/rep/workflow/${bookingId}`);
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

export default async function MobileSignaturePage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, signatures } = await getSignatureDetails(params.bookingId);

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Customer Signature
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
          <div className="bg-gradient-to-r from-[#111111] to-[#3a2410] p-6 text-white">
            <div className="inline-flex rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black uppercase text-[#111111]">
              {booking.status}
            </div>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              {booking.booking_number}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
              Let the customer review the booking details and sign directly on
              the tablet or phone.
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

        <MobileSignaturePad booking={booking} saveSignature={saveSignature} />

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Saved Signatures
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">
            Signature History
          </h2>

          <div className="mt-5 space-y-5">
            {signatures.length === 0 ? (
              <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-sm font-semibold text-[#7a7168]">
                No signatures saved yet.
              </div>
            ) : (
              signatures.map((signature) => (
                <div
                  key={signature.id}
                  className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-black text-[#b98320]">
                        {signature.signed_name || booking.customer_name}
                      </p>

                      <p className="text-sm font-semibold text-[#7a7168]">
                        Signed: {formatDateTime(signature.signed_at)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[#7a7168]">
                      Rep: {signature.rep_name || "Rep"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eee9df] bg-white p-4">
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
