"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    date_of_birth: "",
    license_number: "",
    license_expiry: "",
    id_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    is_blacklisted: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name: string, value: string | boolean) {
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
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to add customer.");
        setLoading(false);
        return;
      }

      router.push("/admin/customers");
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
            <Link
              href="/admin/dashboard"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/vehicles"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Vehicles
            </Link>

            <Link
              href="/admin/customers"
              className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]"
            >
              Customers
            </Link>

            <Link
              href="/admin/bookings"
              className="block rounded-lg px-4 py-3 hover:bg-white/10"
            >
              Bookings
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add Customer
              </h2>
              <p className="text-sm text-gray-500">
                Add a customer profile for rentals and bookings.
              </p>
            </div>

            <Link
              href="/admin/customers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Customers
            </Link>
          </header>

          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm"
            >
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Full Name"
                  name="full_name"
                  value={form.full_name}
                  onChange={updateField}
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  required
                />

                <Input
                  label="WhatsApp Number"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={updateField}
                />

                <Input
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  type="email"
                />

                <Input
                  label="Date of Birth"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={updateField}
                  type="date"
                />

                <Input
                  label="Driver’s License Number"
                  name="license_number"
                  value={form.license_number}
                  onChange={updateField}
                />

                <Input
                  label="License Expiry Date"
                  name="license_expiry"
                  value={form.license_expiry}
                  onChange={updateField}
                  type="date"
                />

                <Input
                  label="ID / Passport Number"
                  name="id_number"
                  value={form.id_number}
                  onChange={updateField}
                />

                <Input
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  value={form.emergency_contact_name}
                  onChange={updateField}
                />

                <Input
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  value={form.emergency_contact_phone}
                  onChange={updateField}
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Address
                </label>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
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

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-red-700">
                  <input
                    type="checkbox"
                    checked={form.is_blacklisted}
                    onChange={(event) =>
                      updateField("is_blacklisted", event.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  Mark this customer as blacklisted / warning customer
                </label>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href="/admin/customers"
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Customer"}
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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string | boolean) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        required={required}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  );
}