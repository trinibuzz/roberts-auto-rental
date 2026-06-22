import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import VehicleStatusButtons from "./VehicleStatusButtons";

type Vehicle = {
  id: number;
  vehicle_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string;
  status: string;
  daily_rate: string | number | null;
  current_mileage: number | null;
  next_service_mileage: number | null;
};

export default async function VehiclesPage() {
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

  const [rows] = await db.query(`
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
      next_service_mileage
    FROM vehicles
    ORDER BY id DESC
  `);

  const vehicles = rows as Vehicle[];

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status?.toLowerCase() === "available"
  ).length;
  const rentedVehicles = vehicles.filter(
    (vehicle) => vehicle.status?.toLowerCase() === "rented"
  ).length;
  const maintenanceVehicles = vehicles.filter(
    (vehicle) => vehicle.status?.toLowerCase() === "maintenance"
  ).length;

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="vehicles" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Vehicles
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Manage the Roberts Auto Rental fleet, vehicle status, mileage,
                  rates, and service readiness.
                </p>
              </div>

              <Link
                href="/admin/vehicles/new"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                Add Vehicle
              </Link>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[230px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(90deg,#050505_0%,#111111_45%,#3a2410_100%)]" />

                <div className="absolute inset-0 opacity-25">
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_35%,rgba(212,175,55,0.12)_100%)]" />
                </div>

                <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
                  <div className="max-w-xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Roberts Auto Rental
                    </p>

                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
                      Fleet Control.
                      <br />
                      Rental Ready.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Every vehicle tracked with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Fleet"
                value={String(totalVehicles)}
                note="Vehicles registered"
              />

              <StatCard
                title="Available"
                value={String(availableVehicles)}
                note="Ready to rent"
              />

              <StatCard
                title="Rented"
                value={String(rentedVehicles)}
                note="Currently on rental"
              />

              <StatCard
                title="Maintenance"
                value={String(maintenanceVehicles)}
                note="Needs attention"
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
              <div className="flex flex-col gap-4 border-b border-[#eee9df] px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl text-[#b98320]">
                    ▣
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                      Fleet List
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      {vehicles.length} vehicle
                      {vehicles.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-bold text-[#4b443d] shadow-sm">
                    Filters
                  </button>

                  <div className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm text-[#8a8178] shadow-sm">
                    Search vehicles...
                  </div>
                </div>
              </div>

              {vehicles.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No vehicles added yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Add your first vehicle to begin managing the fleet.
                  </p>

                  <Link
                    href="/admin/vehicles/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Add First Vehicle
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                        <tr>
                          <th className="px-7 py-5">Vehicle</th>
                          <th className="px-7 py-5">Plate</th>
                          <th className="px-7 py-5">Status</th>
                          <th className="px-7 py-5">Daily Rate</th>
                          <th className="px-7 py-5">Mileage</th>
                          <th className="px-7 py-5">Next Service</th>
                          <th className="px-7 py-5 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#eee9df]">
                        {vehicles.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {vehicle.vehicle_name}
                              </p>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                {[vehicle.year, vehicle.make, vehicle.model]
                                  .filter(Boolean)
                                  .join(" ") || "Vehicle details not set"}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <span className="rounded-xl border border-[#eee9df] bg-[#fbfaf8] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1d1d1f]">
                                {vehicle.plate_number}
                              </span>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <StatusBadge status={vehicle.status} />
                            </td>

                            <td className="px-7 py-6 align-top font-black text-[#1d1d1f]">
                              {formatMoney(vehicle.daily_rate)}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatNumber(vehicle.current_mileage)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Current mileage
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatNumber(vehicle.next_service_mileage)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Service mileage
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <div className="ml-auto flex max-w-[180px] flex-col gap-2">
                                <VehicleStatusButtons
                                  vehicleId={vehicle.id}
                                  currentStatus={vehicle.status}
                                />

                                <Link
                                  href={`/admin/vehicles/${vehicle.id}/edit`}
                                  className="rounded-xl bg-[#0b0b0c] px-4 py-3 text-center text-xs font-black text-white shadow-sm hover:bg-[#1c1c1e]"
                                >
                                  Edit Details
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-5 xl:hidden">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#1d1d1f]">
                              {vehicle.vehicle_name}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {[vehicle.year, vehicle.make, vehicle.model]
                                .filter(Boolean)
                                .join(" ") || "Vehicle details not set"}
                            </p>
                          </div>

                          <StatusBadge status={vehicle.status} />
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Plate:
                            </span>{" "}
                            {vehicle.plate_number}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Rate:
                            </span>{" "}
                            {formatMoney(vehicle.daily_rate)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Mileage:
                            </span>{" "}
                            {formatNumber(vehicle.current_mileage)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Next Service:
                            </span>{" "}
                            {formatNumber(vehicle.next_service_mileage)}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                          <VehicleStatusButtons
                            vehicleId={vehicle.id}
                            currentStatus={vehicle.status}
                          />

                          <Link
                            href={`/admin/vehicles/${vehicle.id}/edit`}
                            className="rounded-xl bg-[#0b0b0c] px-4 py-3 text-center text-sm font-black text-white"
                          >
                            Edit Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-6 shadow-xl shadow-black/5">
              <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                Fleet Management Note
              </h3>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6b6257]">
                Keep vehicle status, mileage, and service details updated after
                every booking, return, inspection, and maintenance check. This
                helps the team avoid double bookings and keep the fleet
                rental-ready.
              </p>
            </section>

            <footer className="pb-6 text-center text-sm text-[#9a9085]">
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
              © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
              rights reserved.
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#1d1d1f]">{value}</p>

      <p className="mt-2 text-sm text-[#7a7168]">{note}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cleanStatus = String(status || "").toLowerCase();

  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-purple-100 text-purple-800",
    rented: "bg-blue-100 text-blue-800",
    maintenance: "bg-orange-100 text-orange-800",
    overdue: "bg-red-100 text-red-800",
    out_of_service: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black capitalize ${
        styles[cleanStatus] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {String(status || "").replaceAll("_", " ")}
    </span>
  );
}

function formatMoney(value: string | number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US");
}