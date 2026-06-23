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
  vehicle_photo: string | null;
};

export default function MobileInspectionForm({
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
        credentials: "include",
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

      if (!response.ok || data.success === false) {
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
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setMessage(data.message || "Unable to upload file.");
        return;
      }

      setFile(null);
      setSuccess("Video/photo uploaded successfully.");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
          {success}
        </div>
      ) : null}

      <form
        onSubmit={saveInspection}
        className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5"
      >
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
          Inspection Report
        </p>

        <h2 className="mt-2 font-serif text-3xl font-black">
          Vehicle Condition
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-black text-[#4b443d]">
              Inspection Type
            </span>

            <select
              value={form.inspection_type}
              onChange={(event) =>
                updateField("inspection_type", event.target.value)
              }
              className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
            >
              <option value="checkout">Checkout Inspection</option>
              <option value="return">Return Inspection</option>
            </select>
          </label>

          <Input
            label="Mileage"
            type="number"
            value={form.mileage}
            onChange={(value) => updateField("mileage", value)}
          />

          <label className="block sm:col-span-2">
            <span className="block text-sm font-black text-[#4b443d]">
              Fuel Level
            </span>

            <select
              value={form.fuel_level}
              onChange={(event) => updateField("fuel_level", event.target.value)}
              className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
            >
              <option value="">Select Fuel Level</option>
              <option value="Empty">Empty</option>
              <option value="1/4">1/4</option>
              <option value="1/2">1/2</option>
              <option value="3/4">3/4</option>
              <option value="Full">Full</option>
            </select>
          </label>
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
          className="mt-6 w-full rounded-2xl bg-blue-700 px-5 py-5 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving Inspection..." : "Save Inspection"}
        </button>
      </form>

      <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
          Walkaround Evidence
        </p>

        <h2 className="mt-2 font-serif text-3xl font-black">
          Upload Video / Photo
        </h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#7a7168]">
          Take photos or videos before the vehicle leaves and again when it
          returns.
        </p>

        <div className="mt-5">
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/*,video/*"
            capture="environment"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-sm font-bold text-[#1d1d1f]"
          />
        </div>

        {file ? (
          <div className="mt-4 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4 text-sm font-bold text-[#7a7168]">
            Selected: {file.name}
          </div>
        ) : null}

        <button
          type="button"
          onClick={uploadFile}
          disabled={isUploading}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Upload Video / Photo"}
        </button>
      </section>
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
    <label className="block">
      <span className="block text-sm font-black text-[#4b443d]">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
      />
    </label>
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
    <label className="mt-5 block">
      <span className="block text-sm font-black text-[#4b443d]">{label}</span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
      />
    </label>
  );
}
