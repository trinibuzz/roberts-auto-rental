import Link from "next/link";
import { db } from "@/lib/db";

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

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function PublicFleetPage() {
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
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <header className="border-b border-[#e7e2d9] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-[#e7e2d9]">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-serif text-xl font-black">
                Roberts Auto Rental
              </p>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98320]">
                Fleet
              </p>
            </div>
          </Link>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
            >
              Home
            </Link>

            <Link
              href="/book"
              className="rounded-full bg-[#111111] px-5 py-3 text-sm font-black text-white shadow-lg"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[#0b0b0c] px-5 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#d4af37]">
            Available Fleet
          </p>

          <h1 className="mt-4 font-serif text-5xl font-black md:text-7xl">
            Choose your ride
          </h1>

          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/70">
            Browse vehicles currently marked available in the office system.
            Submit a booking request and the Roberts team will confirm.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        {vehicles.length === 0 ? (
          <div className="rounded-[2rem] border border-[#e7e2d9] bg-white p-10 text-center shadow-xl shadow-black/5">
            <h2 className="font-serif text-4xl font-black">
              No vehicles available online
            </h2>

            <p className="mt-3 text-sm font-semibold text-[#7a7168]">
              Once vehicles are marked available in the admin system, they will
              show here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-[2rem] border border-[#e7e2d9] bg-white shadow-xl shadow-black/5"
              >
                {vehicle.vehicle_photo ? (
                  <img
                    src={vehicle.vehicle_photo}
                    alt={vehicle.vehicle_name || "Vehicle"}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-[#111111] text-5xl">
                    🚗
                  </div>
                )}

                <div className="space-y-5 p-6">
                  <div>
                    <h2 className="font-serif text-3xl font-black">
                      {vehicle.vehicle_name || "Vehicle"}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-[#7a7168]">
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "Available rental vehicle"}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4 text-sm font-bold text-[#5f554c]">
                    <p>Daily Rate: {formatMoney(vehicle.daily_rate)}</p>

                    <p>
                      Mileage:{" "}
                      {vehicle.current_mileage
                        ? vehicle.current_mileage.toLocaleString()
                        : "-"}
                    </p>

                    <p>Status: {vehicle.status || "available"}</p>
                  </div>

                  <Link
                    href={`/book?vehicle_id=${vehicle.id}`}
                    className="block rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-center text-sm font-black text-white shadow-lg"
                  >
                    Request This Vehicle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
