import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const sessionCookieNames = [
  "roberts_rep_token",
  "roberts_token",
  "robers_token",
  "admin_token",
  "token",
];

async function requireRepUser() {
  const cookieStore = cookies();
  const token = sessionCookieNames
    .map((name) => cookieStore.get(name)?.value)
    .find(Boolean);

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

async function logoutRep() {
  "use server";

  const cookieStore = cookies();

  sessionCookieNames.forEach((name) => {
    cookieStore.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  redirect("/admin/login");
}

export default async function RepBookingFrontPage() {
  await requireRepUser();

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto min-h-screen max-w-[480px] bg-black pb-28">
        <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[#d4af37]/20 bg-[#050505]/95 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
              Roberts Rep Mode
            </p>
            <p className="mt-1 font-serif text-lg font-black text-white">
              Rep Profile
            </p>
          </div>

          <form action={logoutRep}>
            <button
              type="submit"
              className="rounded-xl border border-red-400/40 bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-white shadow-lg transition hover:bg-red-700"
            >
              Log Out
            </button>
          </form>
        </header>

        <div className="relative mx-auto w-full overflow-hidden bg-black">
          <img
            src="/images/drive-in-style-premium-rentals.png"
            alt="Roberts Auto Rental premium booking"
            className="block h-auto w-full"
          />

          {/* The visible BOOK NOW button is part of the image.
             This transparent link makes it work. */}
          <Link
            href="/rep/bookings/new"
            aria-label="Book now"
            className="absolute left-[8.5%] top-[87.2%] h-[7.1%] w-[83%] rounded-2xl"
          />
        </div>

        <section className="px-4 pb-5 pt-4">
          <div className="rounded-[1.5rem] border border-[#d4af37]/25 bg-[#101010] p-4 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d4af37]">
                  Fast Booking
                </p>

                <h2 className="mt-1 font-serif text-2xl font-black text-white">
                  5 Step Rental Flow
                </h2>
              </div>

              <span className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-3 py-2 text-[10px] font-black text-[#d4af37]">
                REP
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <StepPill number="1" label="Customer" active />
              <StepPill number="2" label="Vehicle" />
              <StepPill number="3" label="Payment" />
              <StepPill number="4" label="Checkout" />
              <StepPill number="5" label="Sign" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <QuickLink href="/rep/vehicles" label="Vehicles" icon="▱" />
            <QuickLink href="/rep/pickups" label="Pickups" icon="↗" />
            <QuickLink href="/rep/returns" label="Returns" icon="↙" />
          </div>
        </section>

        <BottomNav />
      </section>
    </main>
  );
}

function StepPill({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={
          active
            ? "mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4af37] text-sm font-black text-black"
            : "mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/25 bg-black/35 text-sm font-black text-[#d4af37]"
        }
      >
        {number}
      </div>

      <p
        className={
          active
            ? "mt-2 text-[8px] font-black uppercase tracking-[0.02em] text-[#d4af37]"
            : "mt-2 text-[8px] font-black uppercase tracking-[0.02em] text-white/50"
        }
      >
        {label}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#d4af37]/25 bg-[#111111] px-3 py-4 text-center shadow-xl shadow-black/30"
    >
      <p className="text-2xl text-[#d4af37]">{icon}</p>

      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/70">
        {label}
      </p>
    </Link>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4af37]/20 bg-[#050505]/95 px-3 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[480px] grid-cols-4 gap-2">
        <BottomLink href="/rep" label="Home" icon="⌂" active />
        <BottomLink href="/rep/bookings/new" label="Book" icon="+" />
        <BottomLink href="/rep/vehicles" label="Cars" icon="▱" />
        <BottomLink href="/rep/pickups" label="Pickups" icon="↗" />
      </div>
    </nav>
  );
}

function BottomLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl bg-[#d4af37] px-3 py-2 text-center text-black"
          : "rounded-2xl px-3 py-2 text-center text-white/55"
      }
    >
      <p className="text-lg leading-none">{icon}</p>

      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em]">
        {label}
      </p>
    </Link>
  );
}