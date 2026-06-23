import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type VehicleRow = {
  id: number;
  vehicle_name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string | null;
  status: string | null;
  daily_rate: number | string | null;
  current_mileage: number | null;
  vehicle_photo: string | null;
};

async function requireRepAccess() {
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

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function RepVehiclesPage() {
  await requireRepAccess();

  const [rows] = await db.query(
    `
    SELECT
      id,
      vehicle_name,
      make,
      model,
      year,
      plate_number,
      status,
      daily_rate,
      current_mileage,
      vehicle_photo
    FROM vehicles
    WHERE LOWER(status) = 'available'
    ORDER BY vehicle_name ASC, plate_number ASC
    `
  );

  const vehicles = rows as VehicleRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-24 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-3xl font-black">
              Available Vehicles
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
        <section className="rounded-[2rem] bg-gradient-to-r from-green-700 to-green-900 p-6 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
            Ready To Rent
          </p>

          <h2 className="mt-3 font-serif text-4xl font-black">
            {vehicles.length} available vehicle{vehicles.length === 1 ? "" : "s"}
          </h2>

          <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
            View ready vehicles with photos, plate numbers, daily rates, and
            mileage before creating a new booking.
          </p>
        </section>

        {vehicles.length === 0 ? (
          <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-8 text-center shadow-xl shadow-black/5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              🚗
            </div>

            <h2 className="mt-5 font-serif text-3xl font-black">
              No available vehicles
            </h2>

            <p className="mt-2 text-sm font-semibold text-[#7a7168]">
              Vehicles marked as available will show here.
            </p>

            <Link
              href="/rep"
              className="mt-6 inline-flex rounded-2xl bg-[#111111] px-6 py-4 text-sm font-black text-white"
            >
              Back to Rep Home
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-[2rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5"
              >
                {vehicle.vehicle_photo ? (
                  <img
                    src={vehicle.vehicle_photo}
                    alt={vehicle.vehicle_name || "Vehicle"}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-[#111111] text-5xl">
                    🚗
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-3xl font-black">
                        {vehicle.vehicle_name || "Vehicle"}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-[#7a7168]">
                        {vehicle.plate_number || "No plate"}
                      </p>
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase text-green-800">
                      {vehicle.status || "available"}
                    </span>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4 text-sm font-bold text-[#5f554c]">
                    <p>
                      Make/Model:{" "}
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </p>

                    <p>Daily Rate: {formatMoney(vehicle.daily_rate)}</p>

                    <p>
                      Mileage:{" "}
                      {vehicle.current_mileage
                        ? vehicle.current_mileage.toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <Link
                      href={`/rep/bookings/new?vehicle_id=${vehicle.id}`}
                      className="block rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-center text-base font-black text-white shadow-lg"
                    >
                      Book This Vehicle
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <BottomNav active="vehicles" />
    </main>
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
        <BottomNavLink href="/rep" label="Home" icon="⌂" active={active === "home"} />
        <BottomNavLink href="/rep/bookings/new" label="Book" icon="+" active={active === "book"} />
        <BottomNavLink href="/rep/pickups" label="Pickups" icon="↗" active={active === "pickups"} />
        <BottomNavLink href="/rep/returns" label="Returns" icon="↙" active={active === "returns"} />
        <BottomNavLink href="/rep/vehicles" label="Cars" icon="🚗" active={active === "vehicles"} />
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
