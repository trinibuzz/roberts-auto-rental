import Link from "next/link";

export default function AdminMobileHeader() {
  return (
    <div className="border-b bg-[#07111f] px-4 py-4 text-white md:hidden print:hidden">
      <div className="rounded-xl bg-white p-2">
        <img
          src="/images/roberts-logo.png"
          alt="Roberts Auto Rental and Leasing"
          className="h-14 w-full object-contain"
        />
      </div>

      <p className="mt-2 text-center text-xs text-[#d4af37]">
        Fleet & Booking Manager
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs">
        <MobileLink href="/admin/dashboard" label="Dashboard" />
        <MobileLink href="/admin/bookings" label="Bookings" />
        <MobileLink href="/admin/calendar" label="Calendar" />
        <MobileLink href="/admin/vehicles" label="Vehicles" />
        <MobileLink href="/admin/customers" label="Customers" />
        <MobileLink href="/admin/payments" label="Payments" />
        <MobileLink href="/admin/maintenance" label="Maintenance" />
        <MobileLink href="/admin/reports" label="Reports" />
      </div>
    </div>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-full bg-white/10 px-3 py-2 font-semibold text-white hover:bg-white/20"
    >
      {label}
    </Link>
  );
}