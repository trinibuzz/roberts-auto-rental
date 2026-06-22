"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");

  function updateField(name: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoUploadError("");
    setPhotoUploading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const response = await fetch("/api/admin/vehicle-photo", {
        method: "POST",
        body: uploadForm,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPhotoUploadError(data.message || "Failed to upload vehicle image.");
        setPhotoUploading(false);
        return;
      }

      updateField("vehicle_photo", data.url);
      setPhotoUploading(false);
    } catch {
      setPhotoUploadError("Unable to upload vehicle image.");
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="vehicles" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Add Vehicle
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Add a vehicle to the fleet with rates, service details, and a
                  photo for bookings.
                </p>
              </div>

              <Link
                href="/admin/vehicles"
                className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
              >
                Back to Vehicles
              </Link>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[230px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(90deg,#050505_0%,#111111_45%,#3a2410_100%)]" />

                <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
                  <div className="max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Roberts Auto Rental
                    </p>

                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
                      Add Fleet Vehicle.
                      <br />
                      Upload the Rental Photo.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Vehicle images help staff confirm the correct car when
                      booking or renting.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                  <FormSection
                    number="1"
                    title="Vehicle Identity"
                    subtitle="Main vehicle details used across bookings and fleet records."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Input
                        label="Vehicle Name"
                        name="vehicle_name"
                        value={form.vehicle_name}
                        onChange={updateField}
                        required
                        placeholder="Toyota Camry"
                      />

                      <Input
                        label="Plate Number"
                        name="plate_number"
                        value={form.plate_number}
                        onChange={updateField}
                        required
                        placeholder="PXX 1234"
                      />

                      <Input
                        label="Make"
                        name="make"
                        value={form.make}
                        onChange={updateField}
                        placeholder="Toyota"
                      />

                      <Input
                        label="Model"
                        name="model"
                        value={form.model}
                        onChange={updateField}
                        placeholder="Camry"
                      />

                      <Input
                        label="Year"
                        name="year"
                        value={form.year}
                        onChange={updateField}
                        type="number"
                        placeholder="2022"
                      />

                      <Input
                        label="VIN / Chassis Number"
                        name="vin"
                        value={form.vin}
                        onChange={updateField}
                      />

                      <Input
                        label="Color"
                        name="color"
                        value={form.color}
                        onChange={updateField}
                        placeholder="Black"
                      />

                      <Input
                        label="Vehicle Category"
                        name="category"
                        value={form.category}
                        onChange={updateField}
                        placeholder="SUV, Sedan, Van, Economy"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    number="2"
                    title="Vehicle Specs"
                    subtitle="Transmission, fuel type, mileage, and current fleet status."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <SelectField
                        label="Transmission"
                        value={form.transmission}
                        onChange={(value) => updateField("transmission", value)}
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </SelectField>

                      <Input
                        label="Fuel Type"
                        name="fuel_type"
                        value={form.fuel_type}
                        onChange={updateField}
                        placeholder="Gas, Diesel, Hybrid"
                      />

                      <Input
                        label="Current Mileage"
                        name="current_mileage"
                        value={form.current_mileage}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Next Service Mileage"
                        name="next_service_mileage"
                        value={form.next_service_mileage}
                        onChange={updateField}
                        type="number"
                      />

                      <SelectField
                        label="Status"
                        value={form.status}
                        onChange={(value) => updateField("status", value)}
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="rented">Rented</option>
                        <option value="returned">Returned</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="out_of_service">Out of Service</option>
                        <option value="overdue">Overdue</option>
                      </SelectField>
                    </div>
                  </FormSection>

                  <FormSection
                    number="3"
                    title="Rates & Deposits"
                    subtitle="Rental pricing used when creating bookings."
                  >
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <Input
                        label="Daily Rate"
                        name="daily_rate"
                        value={form.daily_rate}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Weekly Rate"
                        name="weekly_rate"
                        value={form.weekly_rate}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Monthly Rate"
                        name="monthly_rate"
                        value={form.monthly_rate}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Deposit Amount"
                        name="deposit_amount"
                        value={form.deposit_amount}
                        onChange={updateField}
                        type="number"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    number="4"
                    title="Documents & Notes"
                    subtitle="Track insurance, inspection, and internal vehicle notes."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Input
                        label="Insurance Expiry Date"
                        name="insurance_expiry"
                        value={form.insurance_expiry}
                        onChange={updateField}
                        type="date"
                      />

                      <Input
                        label="Inspection Expiry Date"
                        name="inspection_expiry"
                        value={form.inspection_expiry}
                        onChange={updateField}
                        type="date"
                      />
                    </div>

                    <div className="mt-5">
                      <label className="block text-sm font-black text-[#4b443d]">
                        Notes
                      </label>

                      <textarea
                        className="mt-2 min-h-32 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                        value={form.notes}
                        onChange={(event) =>
                          updateField("notes", event.target.value)
                        }
                      />
                    </div>
                  </FormSection>
                </div>

                <aside className="space-y-6">
                  <section className="sticky top-6 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
                    <div className="border-b border-[#eee9df] px-6 py-5">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                        Vehicle Image
                      </p>

                      <h3 className="mt-2 font-serif text-2xl font-black text-[#1d1d1f]">
                        Booking Photo Preview
                      </h3>

                      <p className="mt-2 text-sm text-[#7a7168]">
                        Upload the vehicle image so the team can see the exact
                        car being booked.
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="overflow-hidden rounded-3xl border border-[#eee9df] bg-[#fbfaf8]">
                        {form.vehicle_photo ? (
                          <img
                            src={form.vehicle_photo}
                            alt="Vehicle preview"
                            className="h-64 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-64 w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(135deg,#111111,#3a2410)] px-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/20 text-3xl text-[#d4af37]">
                              ▣
                            </div>

                            <p className="mt-4 text-lg font-black text-white">
                              No vehicle photo yet
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              Upload a vehicle image to preview it here.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-5">
                        <label className="block text-sm font-black text-[#4b443d]">
                          Upload Vehicle Image
                        </label>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handlePhotoUpload}
                          className="mt-2 block w-full cursor-pointer rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] file:mr-4 file:rounded-xl file:border-0 file:bg-[#d4af37] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-[#b98320]"
                        />

                        {photoUploading && (
                          <p className="mt-3 text-sm font-bold text-[#b98320]">
                            Uploading image...
                          </p>
                        )}

                        {photoUploadError && (
                          <p className="mt-3 text-sm font-bold text-red-700">
                            {photoUploadError}
                          </p>
                        )}
                      </div>

                      <div className="mt-5">
                        <Input
                          label="Saved Image URL"
                          name="vehicle_photo"
                          value={form.vehicle_photo}
                          onChange={updateField}
                          placeholder="/uploads/vehicles/vehicle-photo.jpg"
                        />
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <p className="text-sm font-black text-[#1d1d1f]">
                          Image upload note:
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#6b6257]">
                          Images are saved to:
                          <br />
                          <span className="font-black text-[#1d1d1f]">
                            public/uploads/vehicles/
                          </span>
                        </p>
                      </div>
                    </div>
                  </section>
                </aside>
              </section>

              <section className="sticky bottom-0 z-10 rounded-3xl border border-[#e7e2d9] bg-white/95 p-5 shadow-2xl shadow-black/10 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                      Ready to save
                    </p>

                    <p className="mt-1 text-sm text-[#7a7168]">
                      Confirm vehicle details, rates, mileage, and image before
                      saving.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/admin/vehicles"
                      className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={loading || photoUploading}
                      className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-7 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save Vehicle"}
                    </button>
                  </div>
                </div>
              </section>
            </form>

            <footer className="pb-6 text-center text-sm text-[#9a9085]">
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
              © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
              rights reserved.
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function FormSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <div className="mb-6 flex items-center gap-4 border-b border-[#eee9df] pb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl font-black text-[#b98320]">
          {number}
        </div>

        <div>
          <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
            {title}
          </h3>

          <p className="text-sm text-[#7a7168]">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
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
      <label className="block text-sm font-black text-[#4b443d]">{label}</label>

      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-[#4b443d]">{label}</label>

      <select
        className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}
