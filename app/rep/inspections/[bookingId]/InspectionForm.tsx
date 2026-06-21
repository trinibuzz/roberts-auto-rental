"use client";

import { useState } from "react";

type BookingDetails = {
  id: number;
  booking_number: string;
  customer_id: number;
  vehicle_id: number;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
};

export default function InspectionForm({
  booking,
}: {
  booking: BookingDetails;
}) {
  const [form, setForm] = useState({
    inspection_type: "checkout",
    mileage: "",
    fuel_level: "",
    exterior_condition: "",
    interior_condition: "",
    damage_notes: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveInspection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/rep/inspections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: booking.id,
          vehicle_id: booking.vehicle_id,
          customer_id: booking.customer_id,
          ...form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to save inspection.");
        return;
      }

      setSuccess("Inspection saved successfully.");
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadFile() {
    setMessage("");
    setSuccess("");

    if (!file) {
      setMessage("Please choose a video or photo first.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("booking_id", String(booking.id));
      formData.append("vehicle_id", String(booking.vehicle_id));
      formData.append("inspection_type", form.inspection_type);
      formData.append("file", file);

      const response = await fetch("/api/rep/inspection-media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to upload file.");
        return;
      }

      setFile(null);
      setSuccess("Video/photo uploaded successfully.");
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
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

      <form
        onSubmit={saveInspection}
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-2xl font-black">Inspection Report</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              Inspection Type
            </label>
            <select
              value={form.inspection_type}
              onChange={(event) =>
                updateField("inspection_type", event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
            >
              <option value="checkout">Checkout Inspection</option>
              <option value="return">Return Inspection</option>
            </select>
          </div>

          <Input
            label="Mileage"
            type="number"
            value={form.mileage}
            onChange={(value) => updateField("mileage", value)}
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              Fuel Level
            </label>
            <select
              value={form.fuel_level}
              onChange={(event) => updateField("fuel_level", event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Fuel Level</option>
              <option value="Empty">Empty</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="3/4">3/4</option>
              <option value="Full">Full</option>
            </select>
          </div>
        </div>

        <TextArea
          label="Exterior Condition"
          value={form.exterior_condition}
          onChange={(value) => updateField("exterior_condition", value)}
          placeholder="Example: Front bumper clean, small scratch on left rear door..."
        />

        <TextArea
          label="Interior Condition"
          value={form.interior_condition}
          onChange={(value) => updateField("interior_condition", value)}
          placeholder="Example: Seats clean, dashboard clean, no smell..."
        />

        <TextArea
          label="Damage Notes"
          value={form.damage_notes}
          onChange={(value) => updateField("damage_notes", value)}
          placeholder="List scratches, dents, marks, missing items, warning lights, or customer notes."
        />

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 rounded-xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving Inspection..." : "Save Inspection"}
        </button>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-black">Upload Walkaround Evidence</h2>
        <p className="mt-2 text-white/60">
          Upload video or photos for this booking. These files will also appear
          on the booking evidence record.
        </p>

        <div className="mt-5">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f]"
          />
        </div>

        <button
          type="button"
          onClick={uploadFile}
          disabled={isUploading}
          className="mt-5 rounded-xl border border-[#d4af37] px-6 py-4 font-black text-[#d4af37] hover:bg-[#d4af37] hover:text-[#07111f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Upload Video / Photo"}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-bold text-white/70">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
      />
    </div>
  );
}