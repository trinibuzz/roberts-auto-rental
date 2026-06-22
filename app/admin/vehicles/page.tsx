import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";
import VehicleStatusButtons from "./VehicleStatusButtons";

type Vehicle = RowDataPacket & {
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

function formatMoney(value: string | number | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-TT", {
    style: "currency",
    currency: "TTD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function statusBadge(status: string) {
  const normalized = status?.toLowerCase();

  if (normalized === "available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "rented") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "reserved") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "maintenance") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function VehiclesPage() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  const [vehicles] = await db.query<Vehicle[]>(`
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
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="vehicles" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero variant="vehicles" />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Fleet
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {totalVehicles}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Vehicles registered
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Available
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-700">
                {availableVehicles}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ready for bookings
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Rented</p>
              <p className="mt-2 text-3xl font-black text-blue-700">
                {rentedVehicles}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Currently on rental
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Maintenance
              </p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {maintenanceVehicles}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Needs attention
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Fleet List
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Vehicle Inventory
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View vehicles, check mileage, update fleet status, and manage
                  rental readiness.
                </p>
              </div>

              <Link
                href="/admin/vehicles/new"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
              >
                Add Vehicle
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-slate-950">
                  No vehicles added yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first vehicle to begin managing the Roberts Auto
                  Rental fleet.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Vehicle
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Plate
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Status
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Daily Rate
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Mileage
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Next Service
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vehicles.map((vehicle) => (
                        <tr
                          key={vehicle.id}
                          className="transition hover:bg-[#fbf7ef]"
                        >
                          <td className="px-5 py-5 align-top">
                            <div>
                              <p className="font-black text-slate-950">
                                {vehicle.vehicle_name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {[vehicle.year, vehicle.make, vehicle.model]
                                  .filter(Boolean)
                                  .join(" ") || "Vehicle details not set"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                              {vehicle.plate_number}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusBadge(
                                vehicle.status
                              )}`}
                            >
                              {vehicle.status}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-950">
                              {formatMoney(vehicle.daily_rate)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Per day
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {formatNumber(vehicle.current_mileage)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Current mileage
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {formatNumber(vehicle.next_service_mileage)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Service mileage
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex flex-col gap-2">
                              <VehicleStatusButtons
                                vehicleId={vehicle.id}
                                currentStatus={vehicle.status}
                              />

                              <Link
                                href={`/admin/vehicles/${vehicle.id}/edit`}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-[#d4af37] hover:text-slate-950"
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
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-[#ead7a2] bg-[#fff9e8] p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Fleet Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  Keep vehicle status updated after every booking, return,
                  maintenance check, and service update. Accurate statuses help
                  prevent double bookings and make the dashboard easier for
                  staff to trust.
                </p>
              </div>

              <span className="rounded-full bg-[#d4af37] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                Roberts Auto Rental
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}