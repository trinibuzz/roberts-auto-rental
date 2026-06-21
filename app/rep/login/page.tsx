import Link from "next/link";
import RepLoginForm from "./RepLoginForm";

export default function RepLoginPage() {
  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-[#0b1f3a] to-[#26070a] p-10 lg:block">
            <div className="rounded-2xl bg-white p-5">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental and Leasing"
                className="mx-auto h-auto w-full max-w-md object-contain"
              />
            </div>

            <div className="mt-10">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Sales Rep Tablet App
              </p>
              <h1 className="mt-4 text-5xl font-black leading-tight">
                Fast rentals from the field.
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/70">
                Create bookings, inspect vehicles, collect payment, and upload
                evidence directly from a tablet.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="lg:hidden">
              <div className="rounded-2xl bg-white p-4">
                <img
                  src="/images/roberts-logo.png"
                  alt="Roberts Auto Rental and Leasing"
                  className="mx-auto h-20 w-auto object-contain"
                />
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                Rep Login
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Sign in to continue
              </h2>
              <p className="mt-3 text-white/60">
                For Roberts Auto Rental sales representatives and staff.
              </p>

              <RepLoginForm />

              <div className="mt-6 flex justify-between text-sm">
                <Link href="/" className="text-white/60 hover:text-white">
                  Public Site
                </Link>
                <Link
                  href="/admin/login"
                  className="text-[#d4af37] hover:text-white"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}