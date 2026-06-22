import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";
import AdminPageHero from "@/app/admin/components/AdminPageHero";

type MaintenanceRecord = RowDataPacket & {
  id: number;
  vehicle_name: string;
  plate_number: string;
  vehicle_status: string;
  service_type: string;
  service_date: string | Date;
  mileage: number | null;
  cost: string | number | null;
  vendor: string | null;
  next_service_date: string | Date | null;
  next_service_mileage: number | null;
};

function formatDate(dateValue: string | Date) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

function formatText(value: string) {
  return value.split("_").join(" ");
}

function statusClass(status: string) {
  const normalized = status?.toLowerCase();

  if (normalized === "available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "reserved") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (normalized === "rented") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "maintenance") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalized === "overdue") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "out_of_service") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function MaintenancePage() {
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

  const [records] = await db.query<MaintenanceRecord[]>(`
    SELECT
      maintenance_records.*,
      vehicles.vehicle_name,
      vehicles.plate_number,
      vehicles.status AS vehicle_status
    FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    ORDER BY maintenance_records.created_at DESC
  `);

  const totalRecords = records.length;

  const totalCost = records.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );

  const vehiclesServiced = new Set(
    records.map((record) => record.plate_number).filter(Boolean)
  ).size;

  const upcomingServices = records.filter(
    (record) => record.next_service_date || record.next_service_mileage
  ).length;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AdminSidebar active="maintenance" />
      <AdminMobileHeader />

      <main className="lg:pl-72">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AdminPageHero
            variant="maintenance"
            label="Maintenance Management"
            title="Maintenance"
            subtitle="Track vehicle service records, repairs, mileage, costs, vendors, and upcoming maintenance for Roberts Auto Rental."
          />

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Service Records
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {totalRecords}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Maintenance entries saved
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Maintenance Cost
              </p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {formatMoney(totalCost)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                All recorded service costs
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Vehicles Serviced
              </p>
              <p className="mt-2 text-3xl font-black text-blue-700">
                {vehiclesServiced}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Unique vehicles maintained
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Upcoming Service
              </p>
              <p className="mt-2 text-3xl font-black text-[#b8860b]">
                {upcomingServices}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Records with next service info
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8860b]">
                  Maintenance History
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Vehicle Service Records
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review service type, dates, mileage, costs, vendors, next
                  service details, and current vehicle status.
                </p>
              </div>

              <Link
                href="/admin/maintenance/new"
                className="inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
              >
                Add Maintenance
              </Link>
            </div>

            {records.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-black text-slate-950">
                  No maintenance records added yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first maintenance record to begin tracking vehicle
                  service history, costs, and upcoming service needs.
                </p>

                <Link
                  href="/admin/maintenance/new"
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#c9a227]"
                >
                  Add First Maintenance Record
                </Link>
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
                          Service Type
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Service Date
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Mileage
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Cost
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Vendor
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Next Service
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                          Vehicle Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="transition hover:bg-[#fbf7ef]"
                        >
                          <td className="px-5 py-5 align-top">
                            <div>
                              <p className="font-black text-slate-950">
                                {record.vehicle_name}
                              </p>

                              <p className="mt-1 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                                {record.plate_number}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="inline-flex rounded-full border border-[#ead7a2] bg-[#fff9e8] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#8a6500]">
                              {formatText(record.service_type)}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {formatDate(record.service_date)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Completed service
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {formatNumber(record.mileage)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Service mileage
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-red-700">
                              {formatMoney(record.cost)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Service cost
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top text-sm text-slate-700">
                            {record.vendor || "—"}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-bold text-slate-800">
                              {record.next_service_date
                                ? formatDate(record.next_service_date)
                                : "—"}
                            </p>

                            {record.next_service_mileage && (
                              <p className="mt-1 text-xs text-slate-500">
                                {formatNumber(record.next_service_mileage)}{" "}
                                miles/km
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${statusClass(
                                record.vehicle_status
                              )}`}
                            >
                              {formatText(record.vehicle_status)}
                            </span>
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
                  Maintenance Management Note
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
                  Keep service dates, mileage, vendor details, and next service
                  mileage updated. Accurate maintenance records help protect the
                  fleet, reduce breakdowns, and keep vehicles rental-ready.
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