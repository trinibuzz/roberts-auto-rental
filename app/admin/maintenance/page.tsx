import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

type MaintenanceRecord = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  vehicle_status: string;
  service_type: string;
  service_date: string;
  mileage: number | null;
  cost: string;
  vendor: string | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
};

export default async function MaintenancePage() {
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

  const [rows] = await db.query(`
    SELECT
      maintenance_records.*,
      vehicles.vehicle_name,
      vehicles.plate_number,
      vehicles.status AS vehicle_status
    FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    ORDER BY maintenance_records.created_at DESC
  `);

  const records = rows as MaintenanceRecord[];

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link href="/admin/dashboard" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Dashboard
            </Link>

            <Link href="/admin/vehicles" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Vehicles
            </Link>

            <Link href="/admin/customers" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Customers
            </Link>

            <Link href="/admin/bookings" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Bookings
            </Link>

            <Link href="/admin/calendar" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Calendar View
            </Link>

            <Link href="/admin/payments" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Payments
            </Link>

            <Link href="/admin/maintenance" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Maintenance
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Maintenance
              </h2>
              <p className="text-sm text-gray-500">
                Track vehicle service, repairs, costs, and next service dates.
              </p>
            </div>

            <Link
              href="/admin/maintenance/new"
              className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
            >
              Add Maintenance
            </Link>
          </header>

          <div className="p-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Maintenance History
                </h3>
              </div>

              {records.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">
                    No maintenance records added yet.
                  </p>
                  <Link
                    href="/admin/maintenance/new"
                    className="mt-4 inline-block rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#07111f]"
                  >
                    Add First Maintenance Record
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Service Type</th>
                        <th className="px-6 py-4">Service Date</th>
                        <th className="px-6 py-4">Mileage</th>
                        <th className="px-6 py-4">Cost</th>
                        <th className="px-6 py-4">Vendor</th>
                        <th className="px-6 py-4">Next Service</th>
                        <th className="px-6 py-4">Vehicle Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {record.vehicle_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.plate_number}
                            </div>
                          </td>

                          <td className="px-6 py-4 capitalize">
                            {record.service_type.replaceAll("_", " ")}
                          </td>

                          <td className="px-6 py-4">
                            {formatDate(record.service_date)}
                          </td>

                          <td className="px-6 py-4">
                            {record.mileage || "-"}
                          </td>

                          <td className="px-6 py-4 font-bold">
                            ${Number(record.cost || 0).toFixed(2)}
                          </td>

                          <td className="px-6 py-4">
                            {record.vendor || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              {record.next_service_date
                                ? formatDate(record.next_service_date)
                                : "-"}
                            </div>
                            {record.next_service_mileage && (
                              <div className="text-xs text-gray-500">
                                {record.next_service_mileage} miles/km
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                record.vehicle_status
                              )}`}
                            >
                              {record.vehicle_status.replaceAll("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
  return "bg-gray-100 text-gray-700";
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}