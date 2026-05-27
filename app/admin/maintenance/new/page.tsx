"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vehicle = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  status: string;
  current_mileage: number;
};

export default function NewMaintenancePage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState({
    vehicle_id: "",
    service_type: "oil_change",
    service_date: "",
    mileage: "",
    cost: "",
    vendor: "",
    next_service_date: "",
    next_service_mileage: "",
    notes: "",
    mark_vehicle_maintenance: true,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      const response = await fetch("/api/admin/vehicles");
      const data = await response.json();

      if (data.success) {
        setVehicles(data.vehicles);
      }
    }

    loadVehicles();
  }, []);

  function updateField(name: string, value: string | boolean) {
    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === "vehicle_id") {
      const selectedVehicle = vehicles.find(
        (vehicle) => String(vehicle.id) === String(value)
      );

      if (selectedVehicle) {
        updatedForm.mileage = String(selectedVehicle.current_mileage || "");
      }
    }

    setForm(updatedForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to add maintenance record.");
        setLoading(false);
        return;
      }

      router.push("/admin/maintenance");
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

            <Link href="/admin/vehicles" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Vehicles
            </Link>

            <Link href="/admin/customers" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Customers
            </Link>

            <Link href="/admin/bookings" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Bookings
            </Link>

            <Link href="/admin/calendar" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Calendar View
            </Link>

            <Link href="/admin/payments" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Payments
            </Link>

            <Link href="/admin/maintenance" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Maintenance
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add Maintenance
              </h2>
              <p className="text-sm text-gray-500">
                Record service, repairs, costs, and next service details.
              </p>
            </div>

            <Link
              href="/admin/maintenance"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Maintenance
            </Link>
          </header>

          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm"
            >
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Vehicle
                  </label>
                  <select
                    required
                    value={form.vehicle_id}
                    onChange={(event) =>
                      updateField("vehicle_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_name} — {vehicle.plate_number} —{" "}
                        {vehicle.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Service Type
                  </label>
                  <select
                    value={form.service_type}
                    onChange={(event) =>
                      updateField("service_type", event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="oil_change">Oil Change</option>
                    <option value="brake_service">Brake Service</option>
                    <option value="tire_change">Tire Change</option>
                    <option value="battery">Battery</option>
                    <option value="inspection">Inspection</option>
                    <option value="insurance_renewal">Insurance Renewal</option>
                    <option value="repair">Repair</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Service Date"
                  name="service_date"
                  value={form.service_date}
                  onChange={updateField}
                  type="date"
                  required
                />

                <Input
                  label="Mileage"
                  name="mileage"
                  value={form.mileage}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Cost"
                  name="cost"
                  value={form.cost}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Vendor / Mechanic"
                  name="vendor"
                  value={form.vendor}
                  onChange={updateField}
                  placeholder="Mechanic, garage, supplier"
                />

                <Input
                  label="Next Service Date"
                  name="next_service_date"
                  value={form.next_service_date}
                  onChange={updateField}
                  type="date"
                />

                <Input
                  label="Next Service Mileage"
                  name="next_service_mileage"
                  value={form.next_service_mileage}
                  onChange={updateField}
                  type="number"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                />
              </div>

              <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-orange-800">
                  <input
                    type="checkbox"
                    checked={form.mark_vehicle_maintenance}
                    onChange={(event) =>
                      updateField(
                        "mark_vehicle_maintenance",
                        event.target.checked
                      )
                    }
                    className="h-4 w-4"
                  />
                  Mark this vehicle as Maintenance and block it from bookings
                </label>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href="/admin/maintenance"
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Maintenance"}
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
  onChange: (name: string, value: string | boolean) => void;
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
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
      />
    </div>
  );
}