import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type VehicleRow = {
  id: number;
  vehicle_name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_number: string | null;
  daily_rate: number | string | null;
};

function createRequestNumber() {
  const stamp = Date.now().toString().slice(-8);
  return `RAR-${stamp}`;
}

async function submitBookingRequest(formData: FormData) {
  "use server";

  const vehicleIdRaw = String(formData.get("vehicle_id") || "").trim();
  const vehicleId = vehicleIdRaw ? Number(vehicleIdRaw) : null;

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const pickupDate = String(formData.get("pickup_date") || "").trim();
  const pickupTime = String(formData.get("pickup_time") || "").trim();
  const returnDate = String(formData.get("return_date") || "").trim();
  const returnTime = String(formData.get("return_time") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!fullName || !phone || !pickupDate || !returnDate) {
    redirect("/book?error=missing");
  }

  let vehicleName = "Customer did not select a vehicle";

  if (vehicleId) {
    const [vehicleRows] = await db.query(
      `
        SELECT vehicle_name, make, model, year
        FROM vehicles
        WHERE id = ?
        LIMIT 1
      `,
      [vehicleId]
    );

    const vehicles = vehicleRows as VehicleRow[];
    const vehicle = vehicles[0];

    if (vehicle) {
      vehicleName =
        vehicle.vehicle_name ||
        [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
        `Vehicle #${vehicleId}`;
    }
  }

  await db.query(
    `
      INSERT INTO public_booking_requests (
        request_number,
        vehicle_id,
        vehicle_name,
        full_name,
        email,
        phone,
        pickup_date,
        pickup_time,
        return_date,
        return_time,
        notes,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
    [
      createRequestNumber(),
      vehicleId,
      vehicleName,
      fullName,
      email || null,
      phone,
      pickupDate,
      pickupTime || null,
      returnDate,
      returnTime || null,
      notes || null,
    ]
  );

  redirect("/book?success=1");
}

function formatMoney(value: number | string | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default async function PublicBookingPage({
  searchParams,
}: {
  searchParams?: { vehicle_id?: string; success?: string; error?: string };
}) {
  const selectedVehicleId = String(searchParams?.vehicle_id || "");
  const success = searchParams?.success === "1";
  const error = searchParams?.error || "";

  const [rows] = await db.query(
    `
      SELECT
        id,
        vehicle_name,
        make,
        model,
        year,
        plate_number,
        daily_rate
      FROM vehicles
      WHERE LOWER(status) = 'available'
      ORDER BY vehicle_name ASC, plate_number ASC
    `
  );

  const vehicles = rows as VehicleRow[];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <header className="border-b border-[#e7e2d9] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-[#e7e2d9]">
              <img
                src="/images/roberts-logo.png"
                alt="Roberts Auto Rental"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="font-serif text-xl font-black">
                Roberts Auto Rental
              </p>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b98320]">
                Online Booking
              </p>
            </div>
          </Link>

          <Link
            href="/fleet"
            className="rounded-full border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black shadow-sm"
          >
            View Fleet
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-[#0b0b0c] p-7 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d4af37]">
              Booking Request
            </p>

            <h1 className="mt-4 font-serif text-5xl font-black">
              Book Online
            </h1>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/70">
              Submit your rental request online. Our office will review and
              contact you to confirm vehicle availability, deposit, and pickup
              details.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
            <h2 className="font-serif text-3xl font-black">
              What happens next?
            </h2>

            <div className="mt-5 space-y-3">
              <Step number="01" text="Your request is saved as pending." />
              <Step number="02" text="Office checks dates and vehicle." />
              <Step number="03" text="Staff contacts you to confirm." />
              <Step number="04" text="Booking is finalized in the rental system." />
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b98320]">
              Request Form
            </p>

            <h2 className="mt-2 font-serif text-4xl font-black">
              Rental Details
            </h2>
          </div>

          {success ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
              Your booking request was sent successfully. The Roberts Auto
              Rental team will contact you shortly.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              Please complete your name, phone number, pickup date, and return
              date.
            </div>
          ) : null}

          <form action={submitBookingRequest} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-sm font-black text-gray-700">
                Select Vehicle
              </span>

              <select
                name="vehicle_id"
                defaultValue={selectedVehicleId}
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
              >
                <option value="">Let office recommend a vehicle</option>

                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_name ||
                      [vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") ||
                      `Vehicle #${vehicle.id}`}{" "}
                    - {formatMoney(vehicle.daily_rate)} / day
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="full_name"
                placeholder="Your full name"
                required
              />

              <FormInput
                label="Phone Number"
                name="phone"
                placeholder="Phone / WhatsApp"
                required
              />
            </div>

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@email.com"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FormInput
                label="Pickup Date"
                name="pickup_date"
                type="date"
                required
              />

              <FormInput
                label="Pickup Time"
                name="pickup_time"
                type="time"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormInput
                label="Return Date"
                name="return_date"
                type="date"
                required
              />

              <FormInput
                label="Return Time"
                name="return_time"
                type="time"
              />
            </div>

            <label className="block">
              <span className="text-sm font-black text-gray-700">
                Notes / Special Request
              </span>

              <textarea
                name="notes"
                rows={5}
                placeholder="Tell us anything important about this rental request..."
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-4 font-semibold outline-none focus:border-[#d4af37]"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-6 py-5 text-sm font-black text-white shadow-lg"
            >
              Send Booking Request
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37] text-xs font-black text-white">
        {number}
      </span>

      <span className="text-sm font-black text-[#4b443d]">{text}</span>
    </div>
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
