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

  if (!token) redirect("/admin/login");

  const user = await verifyToken(token);
  if (!user) redirect("/admin/login");

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

const navigation = [
  { href: "/rep", label: "Home", icon: "⌂" },
  { href: "/rep/bookings/new", label: "Book", icon: "+" },
  { href: "/rep/vehicles", label: "Cars", icon: "▱" },
  { href: "/rep/pickups", label: "Pickups", icon: "↗" },
];

const bookingSteps = [
  { number: "01", label: "Customer", icon: "customer" },
  { number: "02", label: "Vehicle", icon: "vehicle" },
  { number: "03", label: "Dates", icon: "calendar" },
  { number: "04", label: "Payment", icon: "payment" },
  { number: "05", label: "Check-Out", icon: "checkout" },
];

export default async function RepBookingFrontPage() {
  await requireRepUser();

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#171717]">
      <section className="mx-auto min-h-screen w-full max-w-3xl bg-[#fffdf9] shadow-2xl shadow-black/10">
        <header className="sticky top-0 z-50 border-b border-[#e8dfcf] bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/rep" className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/35 bg-white p-2 shadow-md">
                <img
                  src="/images/roberts-logo.png"
                  alt="Roberts Auto Rental"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate font-serif text-lg font-black sm:text-xl">
                  Roberts Auto Rental
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b98320]">
                  Rep Booking Center
                </p>
              </div>
            </Link>

            <form action={logoutRep}>
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-red-900/15 transition hover:bg-red-700"
              >
                Log Out
              </button>
            </form>
          </div>

          <nav className="mt-3 grid grid-cols-4 gap-2">
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  index === 1
                    ? "rounded-xl bg-gradient-to-r from-[#e0b92f] to-[#c99119] px-2 py-3 text-center text-black shadow-md"
                    : "rounded-xl border border-[#e6dece] bg-[#faf8f3] px-2 py-3 text-center text-[#302b24] shadow-sm transition hover:border-[#d4af37]"
                }
              >
                <span className="block text-lg font-black leading-none">{item.icon}</span>
                <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.08em]">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </header>

        <section className="px-4 pt-5 sm:px-6 sm:pt-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-black shadow-2xl shadow-black/20">
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet="/images/roberts-customer-hero-mobile.png"
              />
              <img
                src="/images/roberts-customer-hero-mobile.png"
                alt="Roberts Auto Rental premium vehicles"
                className="aspect-[9/13] max-h-[680px] w-full object-cover object-center sm:aspect-[4/5]"
              />
            </picture>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent px-5 pb-6 pt-24 sm:px-8 sm:pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#efc94c]">
                Roberts Rep Mode
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black leading-none text-white sm:text-5xl">
                Fast Booking
              </h1>
              <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/80">
                Create the rental, verify the vehicle and complete check-out in one guided flow.
              </p>

              <Link
                href="/rep/bookings/new"
                className="mt-5 flex w-full items-center justify-center rounded-2xl border border-[#f2d66b] bg-gradient-to-r from-[#e2bd38] via-[#f0cf59] to-[#c98d13] px-6 py-5 text-base font-black uppercase tracking-[0.08em] text-black shadow-xl shadow-black/30 transition hover:brightness-105"
              >
                Start Fast Booking
                <span className="ml-3 text-xl">›</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b98320]">
                Simple and Secure
              </p>
              <h2 className="mt-1 font-serif text-3xl font-black sm:text-4xl">
                5-Step Rental Flow
              </h2>
            </div>

            <span className="rounded-full border border-[#d4af37]/30 bg-[#fff6d7] px-3 py-2 text-[10px] font-black text-[#9b6a10]">
              REP
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-5 sm:gap-3">
            {bookingSteps.map((step, index) => (
              <article
                key={step.number}
                className={
                  `${index < 3 ? "col-span-2" : "col-span-3"} ` +
                  (index === bookingSteps.length - 1
                    ? "rounded-2xl border border-[#d4af37]/40 bg-gradient-to-br from-[#fff8df] to-white p-3 shadow-lg shadow-black/5 sm:col-span-1"
                    : "rounded-2xl border border-[#e7dfd1] bg-white p-3 shadow-lg shadow-black/5 sm:col-span-1")
                }
              >
                <div className="text-center">
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-[#e3bd3c] shadow-md sm:h-14 sm:w-14">
                    <StepIcon type={step.icon} />
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d4af37] px-1 text-[8px] font-black text-black">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-3 text-[10px] font-black uppercase tracking-[0.04em] text-[#28231d] sm:text-xs">
                    {step.label}
                  </h3>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-[#111111] p-5 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d4af37]">
                  Ready to Begin?
                </p>
                <p className="mt-1 font-serif text-2xl font-black">Book a vehicle now</p>
              </div>

              <Link
                href="/rep/bookings/new"
                className="rounded-2xl border border-[#f1d36a] bg-gradient-to-r from-[#dfb62c] to-[#c98c14] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.08em] text-black shadow-lg"
              >
                Book Now ›
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function StepIcon({ type }: { type: string }) {
  const common = "h-6 w-6 sm:h-7 sm:w-7";

  if (type === "customer") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
      </svg>
    );
  }

  if (type === "vehicle") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden="true">
        <path d="M4 15l2-6h12l2 6v4h-2v-2H6v2H4z" />
        <circle cx="7.5" cy="14.5" r="1" fill="currentColor" />
        <circle cx="16.5" cy="14.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (type === "payment") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden="true">
      <path d="M9 5h6M9 3h6v4H9z" />
      <path d="M7 5H5v16h14V5h-2" />
      <path d="M8 14l2.5 2.5L16 11" />
    </svg>
  );
}