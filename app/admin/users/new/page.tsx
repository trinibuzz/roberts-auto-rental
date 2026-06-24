import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

async function createUser(formData: FormData) {
  "use server";

  await requireAdminUser();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "staff").trim().toLowerCase();
  const status = String(formData.get("status") || "active").trim().toLowerCase();

  const allowedRoles = ["admin", "staff", "rep"];
  const allowedStatus = ["active", "disabled"];

  if (
    !name ||
    !email ||
    !password ||
    !allowedRoles.includes(role) ||
    !allowedStatus.includes(status)
  ) {
    redirect("/admin/users/new?error=missing");
  }

  const [existingRows] = await db.query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    [email]
  );

  const existingUsers = existingRows as Array<{ id: number }>;

  if (existingUsers.length > 0) {
    redirect("/admin/users/new?error=exists");
  }

  await db.query(
    `
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `,
    [name, email, password, role, status]
  );

  redirect("/admin/users");
}

export default async function NewAdminUserPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  await requireAdminUser();

  const error = searchParams?.error || "";

  return (
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-white">
      <section className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b1f3a] to-[#050b14] p-6 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
            Employee Manager
          </p>

          <h1 className="mt-2 font-serif text-4xl font-black">
            Add Employee
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
            Create a login for an administrator, office staff member, or mobile
            rental rep.
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
          action={createUser}
          className="space-y-5 rounded-[2rem] border border-white/10 bg-white p-6 text-[#111827] shadow-2xl"
        >
          <FormInput
            label="Full Name"
            name="name"
            placeholder="Example: Office Staff"
            required
          />

          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="staff@robertsautorental.com"
            required
          />

          <FormInput
            label="Temporary Password"
            name="password"
            type="text"
            placeholder="Example: Staff123!"
            required
          />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-gray-700">Role</span>

              <select
                name="role"
                defaultValue="staff"
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
                defaultValue="active"
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] shadow-lg"
            >
              Save Employee
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
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-gray-700">{label}</span>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
      />
    </label>
  );
}