import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string | null;
  created_at: string | Date | null;
};

async function requireAdminUser() {
  const token =
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

function formatDate(value: string | Date | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminUsersPage() {
  await requireAdminUser();

  const [rows] = await db.query(
    `
      SELECT id, name, email, role, status, created_at
      FROM users
      ORDER BY
        CASE LOWER(role)
          WHEN 'admin' THEN 1
          WHEN 'staff' THEN 2
          WHEN 'rep' THEN 3
          ELSE 4
        END,
        name ASC
    `
  );

  const users = rows as UserRow[];

  const activeCount = users.filter(
    (user) => String(user.status || "active").toLowerCase() === "active"
  ).length;

  const disabledCount = users.filter(
    (user) => String(user.status || "active").toLowerCase() !== "active"
  ).length;

  return (
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#050b14] p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
              Roberts Auto Rental
            </p>

            <h1 className="mt-2 font-serif text-4xl font-black">
              Employee Manager
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/65">
              Add office staff, mobile reps, and administrators. Disable an
              account anytime to block login access.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-black hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/users/new"
              className="rounded-2xl bg-[#d4af37] px-5 py-4 text-sm font-black text-[#07111f] shadow-lg"
            >
              Add Employee
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard title="Total Users" value={String(users.length)} />
          <StatCard title="Active" value={String(activeCount)} />
          <StatCard title="Disabled" value={String(disabledCount)} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
            <h2 className="text-2xl font-black text-[#111827]">
              Staff Accounts
            </h2>

            <p className="mt-1 text-sm font-semibold text-gray-500">
              Admin, staff, and rep users are managed from here.
            </p>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid gap-4 px-6 py-5 text-[#111827] md:grid-cols-[1.4fr_1.4fr_0.7fr_0.8fr_0.8fr_auto] md:items-center"
                >
                  <div>
                    <p className="text-lg font-black">{user.name}</p>
                    <p className="text-xs font-bold text-gray-500">
                      User ID: {user.id}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-gray-700">
                    {user.email}
                  </p>

                  <RolePill role={user.role} />

                  <StatusPill status={user.status || "active"} />

                  <p className="text-sm font-semibold text-gray-500">
                    {formatDate(user.created_at)}
                  </p>

                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="rounded-xl bg-[#0b1f3a] px-4 py-3 text-center text-sm font-black text-white"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const cleanRole = String(role || "staff").toLowerCase();

  const styles: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    staff: "bg-blue-100 text-blue-800",
    rep: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${
        styles[cleanRole] || "bg-gray-100 text-gray-700"
      }`}
    >
      {cleanRole}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const cleanStatus = String(status || "active").toLowerCase();

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${
        cleanStatus === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {cleanStatus}
    </span>
  );
}