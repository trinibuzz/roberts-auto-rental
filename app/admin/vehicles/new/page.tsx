"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    vehicle_name: "",
    make: "",
    model: "",
    year: "",
    plate_number: "",
    vin: "",
    color: "",
    transmission: "automatic",
    fuel_type: "",
    category: "",
    daily_rate: "",
    weekly_rate: "",
    monthly_rate: "",
    deposit_amount: "",
    current_mileage: "",
    status: "available",
    insurance_expiry: "",
    inspection_expiry: "",
    next_service_mileage: "",
    vehicle_photo: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to add vehicle.");
        setLoading(false);
        return;
      }

      router.push("/admin/vehicles");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link href="/admin/dashboard" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Dashboard
            </Link>
            <Link href="/admin/vehicles" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Vehicles
            </Link>
            <Link href="/admin/customers" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Customers
            </Link>
            <Link href="/admin/bookings" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Bookings
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Vehicle</h2>
              <p className="text-sm text-gray-500">
                Add a new vehicle to the rental fleet.
              </p>
            </div>

            <Link
              href="/admin/vehicles"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Vehicles
            </Link>
          </header>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm">
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Vehicle Name" name="vehicle_name" value={form.vehicle_name} onChange={updateField} required />
                <Input label="Plate Number" name="plate_number" value={form.plate_number} onChange={updateField} required />

                <Input label="Make" name="make" value={form.make} onChange={updateField} />
                <Input label="Model" name="model" value={form.model} onChange={updateField} />

                <Input label="Year" name="year" value={form.year} onChange={updateField} type="number" />
                <Input label="VIN / Chassis Number" name="vin" value={form.vin} onChange={updateField} />

                <Input label="Color" name="color" value={form.color} onChange={updateField} />
                <Input label="Fuel Type" name="fuel_type" value={form.fuel_type} onChange={updateField} />

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Transmission
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                    value={form.transmission}
                    onChange={(event) => updateField("transmission", event.target.value)}
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <Input label="Vehicle Category" name="category" value={form.category} onChange={updateField} placeholder="SUV, Sedan, Van, Economy" />

                <Input label="Daily Rate" name="daily_rate" value={form.daily_rate} onChange={updateField} type="number" />
                <Input label="Weekly Rate" name="weekly_rate" value={form.weekly_rate} onChange={updateField} type="number" />

                <Input label="Monthly Rate" name="monthly_rate" value={form.monthly_rate} onChange={updateField} type="number" />
                <Input label="Deposit Amount" name="deposit_amount" value={form.deposit_amount} onChange={updateField} type="number" />

                <Input label="Current Mileage" name="current_mileage" value={form.current_mileage} onChange={updateField} type="number" />
                <Input label="Next Service Mileage" name="next_service_mileage" value={form.next_service_mileage} onChange={updateField} type="number" />

                <Input label="Insurance Expiry Date" name="insurance_expiry" value={form.insurance_expiry} onChange={updateField} type="date" />
                <Input label="Inspection Expiry Date" name="inspection_expiry" value={form.inspection_expiry} onChange={updateField} type="date" />

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="rented">Rented</option>
                    <option value="returned">Returned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of Service</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <Input label="Vehicle Photo URL" name="vehicle_photo" value={form.vehicle_photo} onChange={updateField} placeholder="/vehicle.jpg" />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href="/admin/vehicles"
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  );
}