import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import InspectionForm from "./InspectionForm";

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
  customer_id: number;
  vehicle_id: number;
  status: string;
  pickup_date: string;
  return_date: string;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
};

type Inspection = {
  id: number;
  inspection_type: string;
  mileage: number | null;
  fuel_level: string | null;
  damage_notes: string | null;
  rep_name: string | null;
  created_at: string;
};

type Media = {
  id: number;
  inspection_type: string;
  media_type: string;
  file_url: string;
  file_name: string;
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

async function getBookingDetails(bookingId: string) {
  const pool = createPool();

  const [bookingRows] = await pool.execute(
    `
      SELECT
        bookings.id,
        bookings.booking_number,
        bookings.customer_id,
        bookings.vehicle_id,
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
      WHERE bookings.id = ?
      LIMIT 1
    `,
    [bookingId]
  );

  const bookings = bookingRows as BookingDetails[];

  const booking = bookings[0];

  if (!booking) {
    redirect("/rep/inspections");
  }

  const [inspectionRows] = await pool.execute(
    `
      SELECT
        id,
        inspection_type,
        mileage,
        fuel_level,
        damage_notes,
        rep_name,
        created_at
      FROM rep_vehicle_inspections
      WHERE booking_id = ?
      ORDER BY created_at DESC
    `,
    [bookingId]
  );

  const [mediaRows] = await pool.execute(
    `
      SELECT
        id,
        inspection_type,
        media_type,
        file_url,
        file_name,
        created_at
      FROM vehicle_inspection_media
      WHERE booking_id = ?
      AND deleted_at IS NULL
      ORDER BY created_at DESC
    `,
    [bookingId]
  );

  return {
    booking,
    inspections: inspectionRows as Inspection[],
    media: mediaRows as Media[],
  };
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

export default async function RepInspectionDetailPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, inspections, media } = await getBookingDetails(
    params.bookingId
  );

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
              <p className="text-xs text-white/50">Inspection Detail</p>
            </div>
          </Link>

          <Link
            href="/rep/inspections"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            All Inspections
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#26070a] p-6 shadow-2xl md:p-10">
          <div className="mb-4 inline-block rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-[#07111f]">
            {booking.status}
          </div>

          <h1 className="text-4xl font-black md:text-6xl">
            {booking.booking_number}
          </h1>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="Customer"
              lines={[booking.customer_name, booking.phone]}
            />

            <InfoCard
              title="Vehicle"
              lines={[booking.vehicle_name, booking.plate_number]}
            />

            <InfoCard
              title="Pickup"
              lines={[formatDate(booking.pickup_date)]}
            />

            <InfoCard
              title="Return"
              lines={[formatDate(booking.return_date)]}
            />
          </div>
        </div>

        <InspectionForm booking={booking} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">Saved Inspections</h2>

            <div className="mt-5 space-y-4">
              {inspections.length === 0 ? (
                <p className="text-white/60">No inspections saved yet.</p>
              ) : (
                inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#d4af37]">
                      {inspection.inspection_type}
                    </div>

                    <p className="font-bold">
                      Mileage: {inspection.mileage || "Not entered"}
                    </p>

                    <p className="mt-1 text-white/60">
                      Fuel: {inspection.fuel_level || "Not entered"}
                    </p>

                    <p className="mt-3 text-white/70">
                      {inspection.damage_notes || "No damage notes."}
                    </p>

                    <p className="mt-3 text-xs text-white/40">
                      Saved by {inspection.rep_name || "Rep"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-black">Uploaded Evidence</h2>

            <div className="mt-5 space-y-4">
              {media.length === 0 ? (
                <p className="text-white/60">No videos or photos uploaded yet.</p>
              ) : (
                media.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-3 flex gap-2">
                      <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-[#07111f]">
                        {item.inspection_type}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                        {item.media_type}
                      </span>
                    </div>

                    {item.media_type === "photo" ? (
                      <img
                        src={item.file_url}
                        alt={item.file_name}
                        className="max-h-80 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <video
                        src={item.file_url}
                        controls
                        className="w-full rounded-xl"
                      />
                    )}

                    <p className="mt-3 break-all text-xs text-white/40">
                      {item.file_name}
                    </p>
                  </div>
                ))
              )}
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