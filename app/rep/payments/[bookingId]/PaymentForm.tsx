"use client";

import { useState } from "react";

type BookingDetails = {
  id: number;
  booking_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
};

export default function PaymentForm({
  booking,
}: {
  booking: BookingDetails;
}) {
  const [form, setForm] = useState({
    amount: "",
    payment_method: "Cash",
    payment_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
    notes: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function savePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/rep/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: booking.id,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to record payment.");
        return;
      }

      setSuccess(
        `Payment recorded. New balance: $${Number(data.balance || 0).toFixed(2)}`
      );

      setForm((current) => ({
        ...current,
        amount: "",
        reference_number: "",
        notes: "",
      }));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={savePayment}
      className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <h2 className="text-2xl font-black">Record Payment</h2>

      {message ? (
        <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      {success ? (
        <div className="mt-5 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Input
          label="Amount"
          type="number"
          value={form.amount}
          onChange={(value) => updateField("amount", value)}
          required
        />

        <div>
          <label className="mb-2 block text-sm font-bold text-white/70">
            Payment Method
          </label>

          <select
            value={form.payment_method}
            onChange={(event) =>
              updateField("payment_method", event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online Transfer">Online Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <Input
          label="Payment Date"
          type="date"
          value={form.payment_date}
          onChange={(value) => updateField("payment_date", value)}
        />

        <Input
          label="Reference Number"
          value={form.reference_number}
          onChange={(value) => updateField("reference_number", value)}
        />
      </div>

      <div className="mt-5">
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

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 rounded-xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Saving Payment..." : "Save Payment"}
      </button>
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
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
      />
    </div>
  );
}