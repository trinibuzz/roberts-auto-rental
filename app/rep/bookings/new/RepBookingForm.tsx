"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
};

type Vehicle = {
  id: number;
  vehicle_name: string;
  make: string;
  model: string;
  plate_number: string;
  daily_rate: number;
  deposit_amount: number;
};

export default function RepBookingForm({
  customers,
  vehicles,
}: {
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const customerFromUrl = searchParams.get("customer_id") || "";

  const [form, setForm] = useState({
    customer_id: customerFromUrl,
    vehicle_id: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    daily_rate: "0",
    deposit: "0",
    discount: "0",
    extra_charges: "0",
    amount_paid: "0",
    notes: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === String(form.vehicle_id)
  );

  const numberOfDays = useMemo(() => {
    if (!form.pickup_date || !form.return_date) return 1;

    const pickup = new Date(`${form.pickup_date}T00:00:00`);
    const returned = new Date(`${form.return_date}T00:00:00`);
    const diff = returned.getTime() - pickup.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return Math.max(days, 1);
  }, [form.pickup_date, form.return_date]);

  const dailyRate = Number(form.daily_rate || 0);
  const deposit = Number(form.deposit || 0);
  const discount = Number(form.discount || 0);
  const extraCharges = Number(form.extra_charges || 0);
  const amountPaid = Number(form.amount_paid || 0);
  const totalAmount = numberOfDays * dailyRate + extraCharges - discount;
  const balance = totalAmount - amountPaid;

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleVehicleChange(vehicleId: string) {
    const vehicle = vehicles.find(
      (item) => String(item.id) === String(vehicleId)
    );

    setForm((current) => ({
      ...current,
      vehicle_id: vehicleId,
      daily_rate: String(vehicle?.daily_rate || 0),
      deposit: String(vehicle?.deposit_amount || 0),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/rep/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to create booking.");
        return;
      }

      const newBookingId = data.booking_id || data.bookingId;

if (!newBookingId) {
  setMessage("Booking was created, but the booking ID was not returned.");
  return;
}

setSuccess(`Booking created successfully: ${data.booking_number || data.bookingNumber}`);

setTimeout(() => {
  window.location.href = `/rep/workflow/${newBookingId}`;
}, 1200);
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {message ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">
            Customer
          </label>
          <select
            value={form.customer_id}
            onChange={(event) => updateField("customer_id", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name} — {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">
            Vehicle
          </label>
          <select
            value={form.vehicle_id}
            onChange={(event) => handleVehicleChange(event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_name} — {vehicle.plate_number} — $
                {Number(vehicle.daily_rate || 0).toFixed(2)}/day
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Pickup Date"
          type="date"
          value={form.pickup_date}
          onChange={(value) => updateField("pickup_date", value)}
          required
        />

        <Input
          label="Pickup Time"
          type="time"
          value={form.pickup_time}
          onChange={(value) => updateField("pickup_time", value)}
        />

        <Input
          label="Return Date"
          type="date"
          value={form.return_date}
          onChange={(value) => updateField("return_date", value)}
          required
        />

        <Input
          label="Return Time"
          type="time"
          value={form.return_time}
          onChange={(value) => updateField("return_time", value)}
        />

        <Input
          label="Daily Rate"
          type="number"
          value={form.daily_rate}
          onChange={(value) => updateField("daily_rate", value)}
          required
        />

        <Input
          label="Deposit"
          type="number"
          value={form.deposit}
          onChange={(value) => updateField("deposit", value)}
        />

        <Input
          label="Discount"
          type="number"
          value={form.discount}
          onChange={(value) => updateField("discount", value)}
        />

        <Input
          label="Extra Charges"
          type="number"
          value={form.extra_charges}
          onChange={(value) => updateField("extra_charges", value)}
        />

        <Input
          label="Amount Paid"
          type="number"
          value={form.amount_paid}
          onChange={(value) => updateField("amount_paid", value)}
        />
      </div>

      {selectedVehicle ? (
        <div className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-5">
          <p className="text-sm font-bold text-[#d4af37]">Selected Vehicle</p>
          <p className="mt-2 text-xl font-black">
            {selectedVehicle.vehicle_name} — {selectedVehicle.plate_number}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 sm:grid-cols-4">
        <SummaryCard label="Days" value={String(numberOfDays)} />
        <SummaryCard label="Total" value={`$${totalAmount.toFixed(2)}`} />
        <SummaryCard label="Paid" value={`$${amountPaid.toFixed(2)}`} />
        <SummaryCard label="Balance" value={`$${balance.toFixed(2)}`} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-white/70">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Creating Booking..." : "Create Booking"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/rep/dashboard")}
          className="rounded-xl border border-white/20 px-6 py-4 font-bold text-white hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#d4af37]">{value}</p>
    </div>
  );
}