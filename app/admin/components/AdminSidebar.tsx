import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";

export default function AdminSidebar({
  active,
}: {
  active:
    | "dashboard"
    | "bookings"
    | "calendar"
    | "vehicles"
    | "customers"
    | "payments"
    | "maintenance"
    | "reports";
}) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-[#0b0b0c] text-white print:hidden md:block">
      <div className="flex min-h-screen flex-col border-r border-[#d4af37]/20 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.12),_transparent_35%),linear-gradient(180deg,#101010_0%,#070707_100%)]">
        <div className="px-6 pb-6 pt-8">
          <Link href="/admin/dashboard" className="block">
            <div className="rounded-2xl border border-[#d4af37]/20 bg-black/40 p-4 shadow-xl">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="h-auto w-full object-contain"
              />
            </div>
          </Link>

          <div className="mx-auto mt-4 h-px w-24 bg-[#d4af37]" />

          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
            Auto Rental & Leasing
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4 text-sm">
          <SidebarLink
            href="/admin/dashboard"
            label="Dashboard"
            icon="▦"
            active={active === "dashboard"}
          />

          <SidebarLink
            href="/admin/bookings"
            label="Bookings"
            icon="▣"
            active={active === "bookings"}
          />

          <SidebarLink
            href="/admin/calendar"
            label="Calendar View"
            icon="□"
            active={active === "calendar"}
          />

          <SidebarLink
            href="/admin/vehicles"
            label="Vehicles"
            icon="▰"
            active={active === "vehicles"}
          />

          <SidebarLink
            href="/admin/customers"
            label="Customers"
            icon="○"
            active={active === "customers"}
          />

          <SidebarLink
            href="/admin/payments"
            label="Payments"
            icon="▤"
            active={active === "payments"}
          />

          <SidebarLink
            href="/admin/maintenance"
            label="Maintenance"
            icon="⚒"
            active={active === "maintenance"}
          />

          <SidebarLink
            href="/admin/reports"
            label="Reports"
            icon="▥"
            active={active === "reports"}
          />
        </nav>

        <div className="px-4 pb-6">
          <div className="mb-4 rounded-2xl border border-[#d4af37]/20 bg-black/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#b98320] text-sm font-black text-[#07111f]">
                AM
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  Admin Manager
                </p>
                <p className="truncate text-xs text-white/50">
                  admin@roberts.com
                </p>
              </div>
            </div>
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
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "group flex items-center gap-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-4 py-4 font-black text-white shadow-lg shadow-black/30"
          : "group flex items-center gap-4 rounded-xl px-4 py-4 font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
      }
    >
      <span
        className={
          active
            ? "flex h-6 w-6 items-center justify-center text-lg text-white"
            : "flex h-6 w-6 items-center justify-center text-lg text-white/70 group-hover:text-[#d4af37]"
        }
      >
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}