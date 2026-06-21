"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RepCustomerForm() {
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
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/rep/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to create customer.");
        return;
      }

      router.push(`/rep/bookings/new?customer_id=${data.customer_id}`);
      router.refresh();
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {message ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Full Name"
          value={form.full_name}
          onChange={(value) => updateField("full_name", value)}
          required
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          required
        />

        <Input
          label="WhatsApp"
          value={form.whatsapp}
          onChange={(value) => updateField("whatsapp", value)}
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => updateField("email", value)}
        />

        <Input
          label="Date of Birth"
          type="date"
          value={form.date_of_birth}
          onChange={(value) => updateField("date_of_birth", value)}
        />

        <Input
          label="ID / Passport Number"
          value={form.id_number}
          onChange={(value) => updateField("id_number", value)}
        />

        <Input
          label="Driver License Number"
          value={form.license_number}
          onChange={(value) => updateField("license_number", value)}
        />

        <Input
          label="License Expiry"
          type="date"
          value={form.license_expiry}
          onChange={(value) => updateField("license_expiry", value)}
        />

        <Input
          label="Emergency Contact Name"
          value={form.emergency_contact_name}
          onChange={(value) => updateField("emergency_contact_name", value)}
        />

        <Input
          label="Emergency Contact Phone"
          value={form.emergency_contact_phone}
          onChange={(value) => updateField("emergency_contact_phone", value)}
        />
      </div>

      <TextArea
        label="Address"
        value={form.address}
        onChange={(value) => updateField("address", value)}
      />

      <TextArea
        label="Notes"
        value={form.notes}
        onChange={(value) => updateField("notes", value)}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Saving Customer..." : "Save Customer & Book Vehicle"}
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

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
      />
    </div>
  );
}