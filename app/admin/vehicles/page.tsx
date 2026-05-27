import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import VehicleStatusButtons from "./VehicleStatusButtons";

type Vehicle = {
  id: number;
  vehicle_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string;
  status: string;
  daily_rate: string;
  current_mileage: number;
  next_service_mileage: number | null;
};

export default async function VehiclesPage() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  const [rows] = await db.query(
    "SELECT * FROM vehicles ORDER BY created_at DESC"
  );

  const vehicles = rows as Vehicle[];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link
              href="/admin/dashboard"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/vehicles"
              className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
            >
              Vehicles
            </Link>

            <Link
              href="/admin/customers"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Customers
            </Link>

            <Link
              href="/admin/bookings"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Bookings
            </Link>

            <Link
              href="/admin/calendar"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Calendar View
            </Link>

            <Link
              href="/admin/payments"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Payments
            </Link>

            <Link
              href="/admin/maintenance"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Maintenance
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vehicles</h2>
              <p className="text-sm text-gray-500">
                Manage fleet availability, rental status, and maintenance status.
              </p>
            </div>

            <Link
              href="/admin/vehicles/new"
              className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              Add Vehicle
            </Link>
          </header>

          <div className="p-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Fleet List</h3>
              </div>

              {vehicles.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">No vehicles added yet.</p>
                  <Link
                    href="/admin/vehicles/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Add First Vehicle
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Plate</th>
                        <th className="px-6 py-4">Year</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Daily Rate</th>
                        <th className="px-6 py-4">Mileage</th>
                        <th className="px-6 py-4">Next Service</th>
                        <th className="px-6 py-4">Quick Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {vehicle.vehicle_name}
                            </div>
                            <div className="text-gray-500">
                              {vehicle.make} {vehicle.model}
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold">
                            {vehicle.plate_number}
                          </td>

                          <td className="px-6 py-4">
                            {vehicle.year || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                vehicle.status
                              )}`}
                            >
                              {vehicle.status.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            ${Number(vehicle.daily_rate || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            {vehicle.current_mileage || 0}
                          </td>

                          <td className="px-6 py-4">
                            {vehicle.next_service_mileage || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <VehicleStatusButtons
                              vehicleId={vehicle.id}
                              currentStatus={vehicle.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              <strong>Note:</strong> Only mark a vehicle as Available when it is
              truly ready to rent. Vehicles marked Maintenance or Out of Service
              will be blocked from bookings.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function statusClass(status: string) {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "reserved") return "bg-purple-100 text-purple-700";
  if (status === "rented") return "bg-blue-100 text-blue-700";
  if (status === "maintenance") return "bg-orange-100 text-orange-700";
  if (status === "overdue") return "bg-red-100 text-red-700";
  if (status === "out_of_service") return "bg-gray-200 text-gray-700";
  if (status === "returned") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
}