"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
};

type Vehicle = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  daily_rate: string;
  deposit_amount: string;
  status: string;
};

export default function NewBookingPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    daily_rate: "",
    number_of_days: "1",
    deposit: "",
    discount: "0",
    extra_charges: "0",
    total_amount: "0",
    amount_paid: "0",
    balance: "0",
    status: "confirmed",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const customerResponse = await fetch("/api/admin/customers");
      const customerData = await customerResponse.json();

      if (customerData.success) {
        setCustomers(customerData.customers);
      }

      const vehicleResponse = await fetch("/api/admin/vehicles");
      const vehicleData = await vehicleResponse.json();

      if (vehicleData.success) {
        setVehicles(vehicleData.vehicles);
      }
    }

    loadData();
  }, []);

  function updateField(name: string, value: string) {
    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === "vehicle_id") {
      const selectedVehicle = vehicles.find(
        (vehicle) => String(vehicle.id) === value
      );

      if (selectedVehicle) {
        updatedForm.daily_rate = String(selectedVehicle.daily_rate || "0");
        updatedForm.deposit = String(selectedVehicle.deposit_amount || "0");
      }
    }

    const calculated = calculateTotals(updatedForm);

    setForm({
      ...updatedForm,
      ...calculated,
    });
  }

  function calculateTotals(currentForm: typeof form) {
    let days = Number(currentForm.number_of_days || 1);

    if (currentForm.pickup_date && currentForm.return_date) {
      const pickup = new Date(currentForm.pickup_date);
      const returned = new Date(currentForm.return_date);

      const diff = returned.getTime() - pickup.getTime();
      const calculatedDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

      days = calculatedDays > 0 ? calculatedDays : 1;
    }

    const dailyRate = Number(currentForm.daily_rate || 0);
    const discount = Number(currentForm.discount || 0);
    const extras = Number(currentForm.extra_charges || 0);
    const amountPaid = Number(currentForm.amount_paid || 0);

    const total = days * dailyRate + extras - discount;
    const balance = total - amountPaid;

    return {
      number_of_days: String(days),
      total_amount: String(total < 0 ? 0 : total),
      balance: String(balance < 0 ? 0 : balance),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to create booking.");
        setLoading(false);
        return;
      }

      router.push("/admin/bookings");
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

            <Link href="/admin/bookings" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Bookings
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Booking</h2>
              <p className="text-sm text-gray-500">
                Create a rental booking and reserve a vehicle.
              </p>
            </div>

            <Link
              href="/admin/bookings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Bookings
            </Link>
          </header>

          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow-sm"
            >
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Customer
                  </label>
                  <select
                    required
                    value={form.customer_id}
                    onChange={(event) =>
                      updateField("customer_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} — {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

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

                <Input
                  label="Pickup Date"
                  name="pickup_date"
                  value={form.pickup_date}
                  onChange={updateField}
                  type="date"
                  required
                />

                <Input
                  label="Pickup Time"
                  name="pickup_time"
                  value={form.pickup_time}
                  onChange={updateField}
                  type="time"
                />

                <Input
                  label="Return Date"
                  name="return_date"
                  value={form.return_date}
                  onChange={updateField}
                  type="date"
                  required
                />

                <Input
                  label="Return Time"
                  name="return_time"
                  value={form.return_time}
                  onChange={updateField}
                  type="time"
                />

                <Input
                  label="Daily Rate"
                  name="daily_rate"
                  value={form.daily_rate}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Number of Days"
                  name="number_of_days"
                  value={form.number_of_days}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Deposit"
                  name="deposit"
                  value={form.deposit}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Discount"
                  name="discount"
                  value={form.discount}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Extra Charges"
                  name="extra_charges"
                  value={form.extra_charges}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Amount Paid"
                  name="amount_paid"
                  value={form.amount_paid}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Total Amount"
                  name="total_amount"
                  value={form.total_amount}
                  onChange={updateField}
                  type="number"
                />

                <Input
                  label="Balance"
                  name="balance"
                  value={form.balance}
                  onChange={updateField}
                  type="number"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Booking Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed / Reserved</option>
                    <option value="active">Active / Vehicle Out</option>
                  </select>
                </div>
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

              <div className="mt-8 rounded-xl bg-gray-50 p-5">
                <h3 className="font-bold text-gray-900">Booking Summary</h3>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-gray-500">Days</p>
                    <p className="font-bold">{form.number_of_days}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Daily Rate</p>
                    <p className="font-bold">
                      ${Number(form.daily_rate || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-bold">
                      ${Number(form.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance</p>
                    <p className="font-bold text-red-600">
                      ${Number(form.balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href="/admin/bookings"
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Booking"}
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
  onChange: (name: string, value: string) => void;
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
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
      />
    </div>
  );
}