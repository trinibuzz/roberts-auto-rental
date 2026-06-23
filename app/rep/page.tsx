import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

type CountRow = {
  total: number;
};

type BookingRow = {
  id: number;
  booking_number: string | null;
  pickup_date: string | Date | null;
  return_date: string | Date | null;
  status: string;
  full_name: string | null;
  phone: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
  vehicle_photo: string | null;
};

export default async function RepDashboardPage() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  const [[pickupStats], [returnStats], [availableStats], [rentedStats]] =
    await Promise.all([
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE DATE(pickup_date) = ?
        AND LOWER(status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        `,
        [today]
      ),
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE DATE(return_date) = ?
        AND LOWER(status) IN ('reserved', 'confirmed', 'pending', 'active', 'rented')
        `,
        [today]
      ),
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM vehicles
        WHERE LOWER(status) = 'available'
        `
      ),
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM vehicles
        WHERE LOWER(status) IN ('rented', 'active')
        `
      ),
    ]);

  const todayPickups = (pickupStats as CountRow[])[0]?.total || 0;
  const todayReturns = (returnStats as CountRow[])[0]?.total || 0;
  const availableVehicles = (availableStats as CountRow[])[0]?.total || 0;
  const rentedVehicles = (rentedStats as CountRow[])[0]?.total || 0;

  const [recentRows] = await db.query(
    `
    SELECT
      bookings.id,
      bookings.booking_number,
      bookings.pickup_date,
      bookings.return_date,
      bookings.status,
      customers.full_name,
      customers.phone,
      vehicles.vehicle_name,
      vehicles.plate_number,
      vehicles.vehicle_photo
    FROM bookings
    LEFT JOIN customers ON customers.id = bookings.customer_id
    LEFT JOIN vehicles ON vehicles.id = bookings.vehicle_id
    ORDER BY bookings.created_at DESC
    LIMIT 6
    `
  );

  const recentBookings = recentRows as BookingRow[];
  const heroBooking = recentBookings.find((booking) => booking.vehicle_photo);
  const heroImage = heroBooking?.vehicle_photo || "/images/rep-car-hero.jpg";

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <section className="mx-auto min-h-screen max-w-5xl pb-24">
        <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black text-[#1d1d1f]">
              Mobile Rental App
            </h1>
          </div>
        </header>

        <div className="space-y-5 p-4 md:p-6">
          <section
            className="relative overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-[#1d1d1f] shadow-xl"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.06)), url("${heroImage}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="min-h-[220px] px-6 py-8 md:min-h-[270px] md:px-10">
              <h2 className="max-w-xl text-5xl font-light tracking-tight text-white drop-shadow-lg md:text-7xl">
                Book A Car
              </h2>

              <p className="mt-4 max-w-lg text-base font-semibold leading-7 text-white/90">
                Fast phone and tablet workflow for bookings, pickups, returns,
                and vehicle checks.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickStat
              title="Pickups"
              value={String(todayPickups)}
              note="Today"
              tone="gold"
            />

            <QuickStat
              title="Returns"
              value={String(todayReturns)}
              note="Today"
              tone="black"
            />

            <QuickStat
              title="Available"
              value={String(availableVehicles)}
              note="Vehicles"
              tone="green"
            />

            <QuickStat
              title="Rented"
              value={String(rentedVehicles)}
              note="Vehicles"
              tone="blue"
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="New Quick Booking"
              note="Start a booking with customer, vehicle, dates, and deposit."
              href="/rep/bookings/new"
              icon="+"
              tone="gold"
            />

            <ActionCard
              title="Today's Pickups"
              note="See vehicles going out today."
              href="/rep/pickups"
              icon="↗"
              tone="black"
            />

            <ActionCard
              title="Today's Returns"
              note="Close returns, mileage, fuel, photos, and balance."
              href="/rep/returns"
              icon="↙"
              tone="blue"
            />

            <ActionCard
              title="Available Vehicles"
              note="Tap to view ready vehicles with photos."
              href="/rep/vehicles"
              icon="🚗"
              tone="green"
            />
          </section>

          <section className="overflow-hidden rounded-[1.8rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
            <div className="border-b border-[#eee9df] px-5 py-4">
              <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                Recent Bookings
              </h3>

              <p className="mt-1 text-sm text-[#7a7168]">
                Quick glance before creating or closing a rental.
              </p>
            </div>

            {recentBookings.length === 0 ? (
              <div className="p-6 text-sm font-semibold text-[#7a7168]">
                No bookings found yet.
              </div>
            ) : (
              <div className="divide-y divide-[#eee9df]">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="p-5">
                    <div className="flex gap-4">
                      <VehicleThumb booking={booking} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate font-black text-[#1d1d1f]">
                            {booking.full_name || "Customer not set"}
                          </p>

                          <StatusPill status={booking.status} />
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#7a7168]">
                          {booking.vehicle_name || "Vehicle not set"}{" "}
                          {booking.plate_number
                            ? `• ${booking.plate_number}`
                            : ""}
                        </p>

                        <div className="mt-3 grid gap-2 text-xs font-bold text-[#5f554c] sm:grid-cols-2">
                          <p>Pickup: {formatDate(booking.pickup_date)}</p>
                          <p>Return: {formatDate(booking.return_date)}</p>
                          <p>Phone: {booking.phone || "-"}</p>
                          <p>
                            Booking:{" "}
                            {booking.booking_number || `#${booking.id}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d9] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto grid max-w-5xl grid-cols-5 gap-2">
            <BottomNavLink href="/rep" label="Home" icon="⌂" active />
            <BottomNavLink href="/rep/bookings/new" label="Book" icon="+" />
            <BottomNavLink href="/rep/pickups" label="Pickups" icon="↗" />
            <BottomNavLink href="/rep/returns" label="Returns" icon="↙" />
            <BottomNavLink href="/rep/vehicles" label="Cars" icon="🚗" />
          </div>
        </nav>
      </section>
    </main>
  );
}

function QuickStat({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  tone: "gold" | "black" | "green" | "blue";
}) {
  const styles = {
    gold: "bg-[#fff9e8] text-[#b98320]",
    black: "bg-[#111111] text-white",
    green: "bg-green-50 text-green-800",
    blue: "bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={`rounded-[1.8rem] p-5 shadow-xl shadow-black/5 ${styles[tone]}`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black">{value}</p>

      <p className="mt-1 text-xs font-bold opacity-75">{note}</p>
    </div>
  );
}

function ActionCard({
  title,
  note,
  href,
  icon,
  tone,
}: {
  title: string;
  note: string;
  href: string;
  icon: string;
  tone: "gold" | "black" | "green" | "blue";
}) {
  const styles = {
    gold: {
      card: "bg-gradient-to-r from-[#d4af37] to-[#b98320] text-white",
      icon: "bg-white/20 text-white",
      note: "text-white/85",
    },
    black: {
      card: "bg-[#111111] text-white",
      icon: "bg-white/15 text-white",
      note: "text-white/75",
    },
    green: {
      card: "bg-green-700 text-white",
      icon: "bg-white/15 text-white",
      note: "text-white/80",
    },
    blue: {
      card: "bg-blue-700 text-white",
      icon: "bg-white/15 text-white",
      note: "text-white/80",
    },
  };

  const selected = styles[tone];

  return (
    <Link
      href={href}
      className={`rounded-[1.8rem] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ${selected.card}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${selected.icon}`}
      >
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black">{title}</h3>

      <p className={`mt-2 text-sm leading-6 ${selected.note}`}>{note}</p>
    </Link>
  );
}

function VehicleThumb({ booking }: { booking: BookingRow }) {
  if (booking.vehicle_photo) {
    return (
      <img
        src={booking.vehicle_photo}
        alt={booking.vehicle_name || "Vehicle"}
        className="h-20 w-24 rounded-2xl border border-[#eee9df] object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-20 w-24 items-center justify-center rounded-2xl bg-[#d4af37]/15 text-2xl">
      🚗
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reserved: "bg-purple-100 text-purple-800",
    confirmed: "bg-purple-100 text-purple-800",
    active: "bg-blue-100 text-blue-800",
    rented: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-700",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      {String(status || "").replaceAll("_", " ")}
    </span>
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

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}