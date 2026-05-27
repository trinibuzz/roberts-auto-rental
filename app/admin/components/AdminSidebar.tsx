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
    <aside className="hidden w-72 bg-[#07111f] text-white print:hidden md:block">
<div className="border-b border-white/10 px-6 py-6">
  <div className="rounded-xl bg-white p-3">
    <img
      src="/images/roberts-logo.png"
      alt="Roberts Auto Rental and Leasing"
      className="h-auto w-full object-contain"
    />
  </div>

  <p className="mt-3 text-center text-sm font-semibold text-[#d4af37]">
    Fleet & Booking Manager
  </p>
</div>
      <nav className="space-y-2 px-4 py-6 text-sm">
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
          href="/admin/reports"
          label="Reports"
          active={active === "reports"}
        />

        <div className="pt-6">
          <AdminLogoutButton />
        </div>
      </nav>
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
          ? "block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
          : "block rounded-lg px-4 py-3 hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}