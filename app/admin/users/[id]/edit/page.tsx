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

async function updateUser(formData: FormData) {
  "use server";

  await requireAdminUser();

  const userId = Number(formData.get("user_id"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "staff").trim().toLowerCase();
  const status = String(formData.get("status") || "active").trim().toLowerCase();

  const allowedRoles = ["admin", "staff", "rep"];
  const allowedStatus = ["active", "disabled"];

  if (
    !userId ||
    !name ||
    !email ||
    !allowedRoles.includes(role) ||
    !allowedStatus.includes(status)
  ) {
    redirect(`/admin/users/${userId}/edit?error=missing`);
  }

  const [existingRows] = await db.query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = ?
      AND id <> ?
      LIMIT 1
    `,
    [email, userId]
  );

  const existingUsers = existingRows as Array<{ id: number }>;

  if (existingUsers.length > 0) {
    redirect(`/admin/users/${userId}/edit?error=exists`);
  }

  if (password) {
    await db.query(
      `
        UPDATE users
        SET name = ?, email = ?, password = ?, role = ?, status = ?
        WHERE id = ?
      `,
      [name, email, password, role, status, userId]
    );
  } else {
    await db.query(
      `
        UPDATE users
        SET name = ?, email = ?, role = ?, status = ?
        WHERE id = ?
      `,
      [name, email, role, status, userId]
    );
  }

  redirect("/admin/users");
}

async function getUser(userId: number) {
  const [rows] = await db.query(
    `
      SELECT id, name, email, role, status, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  const users = rows as UserRow[];

  return users[0] || null;
}

function formatDate(value: string | Date | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function EditAdminUserPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  await requireAdminUser();

  const userId = Number(params.id);

  if (!userId) {
    redirect("/admin/users");
  }

  const employee = await getUser(userId);

  if (!employee) {
    redirect("/admin/users");
  }

  const error = searchParams?.error || "";

  return (
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#050b14] p-6 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
            Employee Manager
          </p>

          <h1 className="mt-2 font-serif text-4xl font-black">
            Edit Employee
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
            Created: {formatDate(employee.created_at)}
          </p>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error === "exists"
              ? "A user already exists with that email address."
              : "Please complete all required fields."}
          </div>
        ) : null}

        <form
          action={updateUser}
          className="space-y-5 rounded-[2rem] border border-white/10 bg-white p-6 text-[#111827] shadow-2xl"
        >
          <input type="hidden" name="user_id" value={employee.id} />

          <FormInput
            label="Full Name"
            name="name"
            defaultValue={employee.name}
            required
          />

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            defaultValue={employee.email}
            required
          />

          <FormInput
            label="New Password"
            name="password"
            type="text"
            placeholder="Leave blank to keep current password"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-gray-700">Role</span>

              <select
                name="role"
                defaultValue={String(employee.role || "staff").toLowerCase()}
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
              >
                <option value="admin">Admin - full access</option>
                <option value="staff">Staff - office access</option>
                <option value="rep">Rep - tablet/mobile access</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-gray-700">Status</span>

              <select
                name="status"
                defaultValue={String(employee.status || "active").toLowerCase()}
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-bold text-yellow-800">
            To disable access, change status to Disabled and save. Do not delete
            users connected to rental records.
          </div>

          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] shadow-lg"
            >
              Save Changes
            </button>

            <Link
              href="/admin/users"
              className="rounded-2xl border border-gray-300 px-6 py-4 text-center font-black text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-700">{label}</span>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
      />
    </label>
  );
}