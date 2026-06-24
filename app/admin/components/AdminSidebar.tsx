import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";

export default function AdminSidebar({
  active,
}: {
  active:
    | "dashboard"
    | "bookings"
    | "booking-requests"
    | "calendar"
    | "vehicles"
    | "customers"
    | "payments"
    | "maintenance"
    | "reports"
    | "users";
}) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-[#0b0b0c] text-white print:hidden md:block">
      <div className="flex min-h-screen flex-col border-r border-[#d4af37]/20 bg-[#0b0b0c]">
        <div className="px-6 pb-6 pt-8">
          <Link href="/admin/dashboard" className="block">
            <div className="rounded-2xl border border-[#d4af37]/25 bg-white p-4 shadow-lg">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="h-auto w-full object-contain"
              />
            </div>
          </Link>

          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Fleet Manager
          </p>

          <div className="mx-auto mt-4 h-px w-28 bg-[#d4af37]/60" />
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4 text-sm">
          <SidebarLink
            href="/admin/dashboard"
            label="Dashboard"
            active={active === "dashboard"}
          />

          <SidebarLink
            href="/admin/bookings"
            label="Bookings"
            active={active === "bookings"}
          />

          <SidebarLink
            href="/admin/booking-requests"
            label="Booking Requests"
            active={active === "booking-requests"}
          />

          <SidebarLink
            href="/admin/calendar"
            label="Calendar View"
            active={active === "calendar"}
          />

          <SidebarLink
            href="/admin/vehicles"
            label="Vehicles"
            active={active === "vehicles"}
          />

          <SidebarLink
            href="/admin/customers"
            label="Customers"
            active={active === "customers"}
          />

          <SidebarLink
            href="/admin/payments"
            label="Payments"
            active={active === "payments"}
          />

          <SidebarLink
            href="/admin/maintenance"
            label="Maintenance"
            active={active === "maintenance"}
          />

          <SidebarLink
            href="/admin/users"
            label="Employee Manager"
            active={active === "users"}
          />

          <SidebarLink
            href="/admin/reports"
            label="Reports"
            active={active === "reports"}
          />
        </nav>

        <div className="px-4 pb-6">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
              Logged in as
            </p>

            <p className="mt-2 truncate text-sm font-bold text-white">
              Admin Manager
            </p>
          </div>

          <AdminLogoutButton />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "relative block rounded-xl border border-[#d4af37]/20 bg-white/[0.06] px-5 py-4 font-bold text-white"
          : "relative block rounded-xl border border-transparent px-5 py-4 font-semibold text-white/75 transition hover:bg-white/[0.04] hover:text-white"
      }
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#d4af37]" />
      )}

      <span className={active ? "text-[#d4af37]" : ""}>{label}</span>
    </Link>
  );
}
