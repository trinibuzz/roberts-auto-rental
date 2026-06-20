import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07111f] via-[#0b1f3a] to-[#26070a]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2">
                <img
                  src="/images/roberts-logo.png"
                  alt="Roberts Auto Rental and Leasing"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
              <a href="#fleet" className="text-white/80 hover:text-white">
                Fleet
              </a>
              <a href="#services" className="text-white/80 hover:text-white">
                Services
              </a>
              <a href="#contact" className="text-white/80 hover:text-white">
                Contact
              </a>
              <Link
                href="/admin/login"
                className="rounded-lg border border-[#d4af37] px-4 py-2 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#07111f]"
              >
                Admin Login
              </Link>
            </nav>
          </header>

          <div className="grid min-h-[78vh] items-center gap-12 py-16 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-block rounded-full border border-[#d4af37]/40 bg-white/5 px-4 py-2 text-sm font-semibold text-[#d4af37]">
                Roberts Auto Rental and Leasing
              </p>

              <h1 className="text-5xl font-black leading-tight md:text-7xl">
                Reliable vehicles.
                <span className="block text-[#d4af37]">Simple booking.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Book cars, manage rentals, and enjoy a smooth vehicle rental
                experience with Roberts Auto Rental and Leasing.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#contact"
                  className="rounded-xl bg-[#d4af37] px-6 py-4 text-center font-bold text-[#07111f] hover:bg-[#c79f2f]"
                >
                  Book a Vehicle
                </Link>

                <Link
                  href="#fleet"
                  className="rounded-xl border border-white/20 px-6 py-4 text-center font-bold text-white hover:bg-white/10"
                >
                  View Fleet
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Stat number="Fast" label="Booking Support" />
                <Stat number="Clean" label="Reliable Vehicles" />
                <Stat number="Easy" label="Rental Process" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-2xl bg-white p-5">
                <img
                  src="/images/roberts-logo.png"
                  alt="Roberts Auto Rental and Leasing"
                  className="mx-auto h-auto w-full max-w-md object-contain"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-[#07111f]/80 p-6">
                <h2 className="text-2xl font-bold text-white">
                  Need a rental?
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Contact Roberts Auto Rental and Leasing today to check vehicle
                  availability and reserve your next ride.
                </p>

                <div className="mt-5 grid gap-3">
                  <a
                    href="tel:+18687893192"
                    className="rounded-xl bg-white px-5 py-3 text-center font-bold text-[#07111f] hover:bg-gray-100"
                  >
                    Call Now
                  </a>

                  <a
                    href="https://wa.me/18687893192"
                    className="rounded-xl border border-[#d4af37] px-5 py-3 text-center font-bold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#07111f]"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fleet" className="bg-white px-6 py-20 text-[#07111f]">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#8b0000]">
              Our Fleet
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Vehicles for everyday travel, business, and special trips.
            </h2>
            <p className="mt-4 text-gray-600">
              Choose from clean, reliable vehicles with flexible rental options.
              Online booking will be available soon.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Economy Vehicles"
              text="Great for daily use, errands, work, and affordable travel."
            />
            <FeatureCard
              title="SUVs and Family Vehicles"
              text="Comfortable options for families, groups, and extra space."
            />
            <FeatureCard
              title="Leasing Options"
              text="Flexible rental and leasing support for longer-term needs."
            />
          </div>
        </div>
      </section>

      <section id="services" className="bg-gray-100 px-6 py-20 text-[#07111f]">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#8b0000]">
              Services
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Built for convenience and peace of mind.
            </h2>
          </div>

          <div className="grid gap-4">
            <ServiceItem title="Vehicle Rentals" />
            <ServiceItem title="Short-Term and Long-Term Rental Support" />
            <ServiceItem title="Vehicle Leasing" />
            <ServiceItem title="Booking and Availability Assistance" />
            <ServiceItem title="Professional Office Rental Management" />
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#07111f] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Contact Us
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Ready to book your next vehicle?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Contact Roberts Auto Rental and Leasing to check availability,
            pricing, and rental requirements.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="tel:+18687893192"
              className="rounded-xl bg-[#d4af37] px-6 py-4 font-bold text-[#07111f] hover:bg-[#c79f2f]"
            >
              Call 868-789-3192
            </a>

            <a
              href="https://wa.me/18687893192"
              className="rounded-xl border border-white/20 px-6 py-4 font-bold text-white hover:bg-white/10"
            >
              WhatsApp Roberts
            </a>

            <Link
              href="/admin/login"
              className="rounded-xl border border-[#d4af37] px-6 py-4 font-bold text-[#d4af37] hover:bg-[#d4af37] hover:text-[#07111f]"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050b14] px-6 py-6 text-center text-sm text-white/50">
        © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All rights
        reserved.
      </footer>
    </main>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-black text-[#d4af37]">{number}</p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 leading-7 text-gray-600">{text}</p>
    </div>
  );
}

function ServiceItem({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="font-bold">{title}</p>
    </div>
  );
}