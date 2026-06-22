import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type MaintenanceRecord = {
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
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="maintenance" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Maintenance
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Track service records, repairs, costs, mileage, vendors, and
                  upcoming maintenance for the Roberts Auto Rental fleet.
                </p>
              </div>

              <Link
                href="/admin/maintenance/new"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mr-2 text-xl leading-none">+</span>
                Add Maintenance
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
                      Service Records.
                      <br />
                      Fleet Protection.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Keep every vehicle rental-ready.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Service Records"
                value={String(totalRecords)}
                note="Maintenance entries saved"
              />

              <StatCard
                title="Total Cost"
                value={formatMoney(totalCost)}
                note="Recorded service costs"
              />

              <StatCard
                title="Vehicles Serviced"
                value={String(vehiclesServiced)}
                note="Unique vehicles maintained"
              />

              <StatCard
                title="Upcoming Service"
                value={String(upcomingServices)}
                note="Records with next service info"
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
                      Maintenance History
                    </h3>

                    <p className="text-sm text-[#7a7168]">
                      {records.length} maintenance record
                      {records.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-bold text-[#4b443d] shadow-sm">
                    Filters
                  </button>

                  <div className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm text-[#8a8178] shadow-sm">
                    Search maintenance...
                  </div>
                </div>
              </div>

              {records.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/15 text-2xl text-[#b98320]">
                    ▣
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-[#1d1d1f]">
                    No maintenance records added yet
                  </h3>

                  <p className="mt-2 text-[#7a7168]">
                    Add your first maintenance record to begin tracking vehicle
                    service history, costs, and upcoming service needs.
                  </p>

                  <Link
                    href="/admin/maintenance/new"
                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-4 font-black text-white"
                  >
                    Add First Maintenance Record
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#fbfaf8] text-xs uppercase tracking-[0.08em] text-[#7a7168]">
                        <tr>
                          <th className="px-7 py-5">Vehicle</th>
                          <th className="px-7 py-5">Service Type</th>
                          <th className="px-7 py-5">Service Date</th>
                          <th className="px-7 py-5">Mileage</th>
                          <th className="px-7 py-5">Cost</th>
                          <th className="px-7 py-5">Vendor</th>
                          <th className="px-7 py-5">Next Service</th>
                          <th className="px-7 py-5">Vehicle Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#eee9df]">
                        {records.map((record) => (
                          <tr
                            key={record.id}
                            className="transition hover:bg-[#fbfaf8]"
                          >
                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-[#1d1d1f]">
                                {record.vehicle_name}
                              </p>

                              <p className="mt-1 text-xs uppercase tracking-wide text-[#8a8178]">
                                {record.plate_number}
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <ServiceBadge value={record.service_type} />
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatDate(record.service_date)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Completed service
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {formatNumber(record.mileage)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Service mileage
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-black text-red-700">
                                {formatMoney(record.cost)}
                              </p>

                              <p className="mt-1 text-xs text-[#8a8178]">
                                Service cost
                              </p>
                            </td>

                            <td className="px-7 py-6 align-top text-[#5f554c]">
                              {record.vendor || "-"}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <p className="font-semibold text-[#1d1d1f]">
                                {record.next_service_date
                                  ? formatDate(record.next_service_date)
                                  : "-"}
                              </p>

                              {record.next_service_mileage && (
                                <p className="mt-1 text-xs text-[#8a8178]">
                                  {formatNumber(record.next_service_mileage)}{" "}
                                  miles/km
                                </p>
                              )}
                            </td>

                            <td className="px-7 py-6 align-top">
                              <StatusBadge status={record.vehicle_status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-5 xl:hidden">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#1d1d1f]">
                              {record.vehicle_name}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {record.plate_number}
                            </p>
                          </div>

                          <StatusBadge status={record.vehicle_status} />
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#5f554c] sm:grid-cols-2">
                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Service:
                            </span>{" "}
                            {formatText(record.service_type)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Date:
                            </span>{" "}
                            {formatDate(record.service_date)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Mileage:
                            </span>{" "}
                            {formatNumber(record.mileage)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Cost:
                            </span>{" "}
                            {formatMoney(record.cost)}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Vendor:
                            </span>{" "}
                            {record.vendor || "-"}
                          </p>

                          <p>
                            <span className="font-black text-[#1d1d1f]">
                              Next Service:
                            </span>{" "}
                            {record.next_service_date
                              ? formatDate(record.next_service_date)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-6 shadow-xl shadow-black/5">
              <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
                Maintenance Management Note
              </h3>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-[#6b6257]">
                Keep service dates, mileage, vendor details, and next service
                mileage updated. Accurate maintenance records help protect the
                fleet, reduce breakdowns, and keep vehicles rental-ready.
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

function ServiceBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/15 px-4 py-2 text-xs font-black capitalize text-[#b98320]">
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {formatText(value)}
    </span>
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
      {formatText(status)}
    </span>
  );
}

function formatText(value: string) {
  return String(value || "").replaceAll("_", " ");
}

function formatMoney(value: string | number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("en-US");
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}