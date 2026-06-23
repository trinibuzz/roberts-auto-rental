import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import MobileInspectionForm from "./MobileInspectionForm";

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
  vehicle_photo: string | null;
};

type Inspection = {
  id: number;
  inspection_type: string;
  mileage: number | null;
  fuel_level: string | null;
  exterior_condition: string | null;
  interior_condition: string | null;
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
        vehicles.plate_number,
        vehicles.vehicle_photo
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

  const [inspectionRows] = await pool.execute(
    `
      SELECT
        id,
        inspection_type,
        mileage,
        fuel_level,
        exterior_condition,
        interior_condition,
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
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MobileInspectionPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await getRepUser();

  const { booking, inspections, media } = await getBookingDetails(
    params.bookingId
  );

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Vehicle Inspection
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
          {booking.vehicle_photo ? (
            <img
              src={booking.vehicle_photo}
              alt={booking.vehicle_name || "Vehicle"}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-[#111111] text-5xl">
              🚗
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white">
            <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase text-white">
              {booking.status}
            </div>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight md:text-5xl">
              {booking.booking_number}
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
              Record vehicle condition, mileage, fuel level, damage notes, and
              upload photo/video evidence from the phone or tablet.
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

            <InfoBox title="Pickup" lines={[formatDate(booking.pickup_date)]} />

            <InfoBox title="Return" lines={[formatDate(booking.return_date)]} />
          </div>
        </section>

        <MobileInspectionForm booking={booking} />

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Saved Inspections
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">
            Inspection History
          </h2>

          <div className="mt-5 space-y-4">
            {inspections.length === 0 ? (
              <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-sm font-semibold text-[#7a7168]">
                No inspections saved yet.
              </div>
            ) : (
              inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                >
                  <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-800">
                    {inspection.inspection_type}
                  </div>

                  <div className="grid gap-3 text-sm font-bold text-[#5f554c] sm:grid-cols-2">
                    <p>Mileage: {inspection.mileage || "Not entered"}</p>
                    <p>Fuel: {inspection.fuel_level || "Not entered"}</p>
                  </div>

                  <InspectionNote
                    label="Exterior"
                    value={inspection.exterior_condition}
                  />

                  <InspectionNote
                    label="Interior"
                    value={inspection.interior_condition}
                  />

                  <InspectionNote label="Damage" value={inspection.damage_notes} />

                  <p className="mt-3 text-xs font-bold text-[#9a9085]">
                    Saved by {inspection.rep_name || "Rep"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
            Uploaded Evidence
          </p>

          <h2 className="mt-2 font-serif text-3xl font-black">
            Photos / Videos
          </h2>

          <div className="mt-5 space-y-4">
            {media.length === 0 ? (
              <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-sm font-semibold text-[#7a7168]">
                No videos or photos uploaded yet.
              </div>
            ) : (
              media.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#eee9df] bg-[#fbfaf8]"
                >
                  <div className="flex gap-2 p-4">
                    <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black uppercase text-[#111111]">
                      {item.inspection_type}
                    </span>

                    <span className="rounded-full bg-[#111111] px-3 py-1 text-xs font-black uppercase text-white">
                      {item.media_type}
                    </span>
                  </div>

                  {item.media_type === "photo" ? (
                    <img
                      src={item.file_url}
                      alt={item.file_name}
                      className="max-h-96 w-full object-cover"
                    />
                  ) : (
                    <video src={item.file_url} controls className="w-full" />
                  )}

                  <p className="break-all p-4 text-xs font-bold text-[#7a7168]">
                    {item.file_name}
                  </p>
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

function InspectionNote({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <p className="mt-3 text-sm font-semibold leading-6 text-[#7a7168]">
      <span className="font-black text-[#1d1d1f]">{label}:</span>{" "}
      {value || "No notes."}
    </p>
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
