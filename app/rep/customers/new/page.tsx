import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import RepCustomerForm from "./RepCustomerForm";

export const dynamic = "force-dynamic";

type RepUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

async function getRepUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("roberts_rep_token")?.value;

  if (!token) {
    redirect("/rep/login");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as RepUser;

    const allowedRoles = ["admin", "staff", "rep"];

    if (!allowedRoles.includes(String(decoded.role || "").toLowerCase())) {
      redirect("/rep/login");
    }

    return decoded;
  } catch (error) {
    redirect("/rep/login");
  }
}

export default async function NewRepCustomerPage() {
  await getRepUser();

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#050b14] px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/rep/dashboard" className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-2">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="h-12 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#d4af37]">
                Roberts Auto Rental
              </p>
              <p className="text-xs text-white/50">Add Customer</p>
            </div>
          </Link>

          <Link
            href="/rep/dashboard"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Rep Customer Entry
          </p>
          <h1 className="mt-3 text-4xl font-black">Add New Customer</h1>
          <p className="mt-3 text-white/60">
            Capture customer information from the tablet, then continue to a new
            vehicle booking.
          </p>

          <RepCustomerForm />
        </div>
      </section>
    </main>
  );
}