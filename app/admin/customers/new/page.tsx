"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

export default function AddCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    customer_photo: "",
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
  const [photoError, setPhotoError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;

    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {
      setCameraError("Camera opened, but the preview could not start.");
    });
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function updateField(name: string, value: string | boolean) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function uploadCustomerPhoto(file: File) {
    setPhotoError("");
    setPhotoUploading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const response = await fetch("/api/admin/customer-photo", {
        method: "POST",
        body: uploadForm,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPhotoError(data.message || "Failed to upload customer photo.");
        setPhotoUploading(false);
        return;
      }

      updateField("customer_photo", data.imagePath);
    } catch {
      setPhotoError("Unable to upload customer photo.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    await uploadCustomerPhoto(file);
    event.target.value = "";
  }

  async function openCamera() {
    setCameraError("");
    setPhotoError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Camera access was blocked. Please allow camera permission and try again."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  async function captureCameraPhoto() {
    const video = videoRef.current;

    if (!video) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Could not capture photo from camera.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setCameraError("Could not create the captured photo.");
          return;
        }

        const file = new File([blob], `customer-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        await uploadCustomerPhoto(file);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="customers" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  Add Customer
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Create a customer profile with a DP, contact details, license
                  information, emergency contact, and rental notes.
                </p>
              </div>

              <Link
                href="/admin/customers"
                className="inline-flex items-center justify-center rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-sm font-black text-[#1d1d1f] shadow-sm transition hover:bg-[#fbfaf8]"
              >
                Back to Customers
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
                      Add Customer DP.
                      <br />
                      Build the Rental Profile.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      The customer photo appears on the list and profile page.
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
                    title="Customer Information"
                    subtitle="Basic contact information used for bookings and communication."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Input
                        label="Full Name"
                        name="full_name"
                        value={form.full_name}
                        onChange={updateField}
                        required
                        placeholder="Customer full name"
                      />

                      <Input
                        label="Phone Number"
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        required
                        placeholder="868-000-0000"
                      />

                      <Input
                        label="WhatsApp Number"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={updateField}
                        placeholder="868-000-0000"
                      />

                      <Input
                        label="Email"
                        name="email"
                        value={form.email}
                        onChange={updateField}
                        type="email"
                        placeholder="customer@email.com"
                      />

                      <Input
                        label="Date of Birth"
                        name="date_of_birth"
                        value={form.date_of_birth}
                        onChange={updateField}
                        type="date"
                      />

                      <Input
                        label="ID / Passport Number"
                        name="id_number"
                        value={form.id_number}
                        onChange={updateField}
                      />
                    </div>

                    <div className="mt-5">
                      <label className="block text-sm font-black text-[#4b443d]">
                        Address
                      </label>

                      <textarea
                        className="mt-2 min-h-24 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                        value={form.address}
                        onChange={(event) =>
                          updateField("address", event.target.value)
                        }
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    number="2"
                    title="License Details"
                    subtitle="Driver information needed before a vehicle is released."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <Input
                        label="Driver's License Number"
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
                    </div>
                  </FormSection>

                  <FormSection
                    number="3"
                    title="Emergency Contact"
                    subtitle="Backup contact information for rentals and urgent situations."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
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
                  </FormSection>

                  <FormSection
                    number="4"
                    title="Notes & Warnings"
                    subtitle="Internal notes and customer warning status."
                  >
                    <div>
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

                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-5">
                      <label className="flex items-start gap-3 text-sm font-black text-red-700">
                        <input
                          type="checkbox"
                          checked={form.is_blacklisted}
                          onChange={(event) =>
                            updateField("is_blacklisted", event.target.checked)
                          }
                          className="mt-1 h-4 w-4"
                        />

                        <span>
                          Mark this customer as blacklisted / warning customer
                          <span className="mt-1 block text-xs font-semibold leading-5 text-red-600">
                            Use this only when staff should be warned before
                            approving or releasing a rental.
                          </span>
                        </span>
                      </label>
                    </div>
                  </FormSection>
                </div>

                <aside className="space-y-6">
                  <section className="sticky top-6 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
                    <div className="border-b border-[#eee9df] px-6 py-5">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                        Customer DP
                      </p>

                      <h3 className="mt-2 font-serif text-2xl font-black text-[#1d1d1f]">
                        Profile Photo
                      </h3>

                      <p className="mt-2 text-sm text-[#7a7168]">
                        Upload a clear photo to identify this customer quickly.
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="overflow-hidden rounded-3xl border border-[#eee9df] bg-[#fbfaf8]">
                        {form.customer_photo ? (
                          <img
                            src={form.customer_photo}
                            alt="Customer preview"
                            className="h-80 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-80 w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(135deg,#111111,#3a2410)] px-6 text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#d4af37]/20 text-5xl font-black text-[#d4af37]">
                              {form.full_name
                                ? form.full_name.charAt(0).toUpperCase()
                                : "?"}
                            </div>

                            <p className="mt-5 text-lg font-black text-white">
                              No customer photo yet
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              Upload a customer DP below.
                            </p>
                          </div>
                        )}
                      </div>

                      {photoError && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                          {photoError}
                        </div>
                      )}

                      <label className="mt-5 flex cursor-pointer items-center justify-center rounded-xl bg-[#0b0b0c] px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:bg-[#1c1c1e]">
                        {photoUploading ? "Uploading Photo..." : "Upload Customer Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={photoUploading}
                          onChange={handlePhotoUpload}
                        />
                      </label>

                      {!cameraOpen ? (
                        <button
                          type="button"
                          onClick={openCamera}
                          disabled={photoUploading}
                          className="mt-3 w-full rounded-xl border border-[#d4af37]/40 bg-[#fff9e8] px-6 py-4 text-sm font-black text-[#1d1d1f] shadow-sm transition hover:bg-[#fff2c6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Take Photo / Use Camera
                        </button>
                      ) : (
                        <div className="mt-5 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-72 w-full object-cover"
                          />

                          <div className="grid gap-3 bg-white p-4 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={captureCameraPhoto}
                              disabled={photoUploading}
                              className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-3 text-sm font-black text-white shadow-lg shadow-black/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {photoUploading ? "Saving Photo..." : "Capture Photo"}
                            </button>

                            <button
                              type="button"
                              onClick={stopCamera}
                              className="rounded-xl border border-[#e7e2d9] bg-white px-5 py-3 text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
                            >
                              Close Camera
                            </button>
                          </div>
                        </div>
                      )}

                      {cameraError && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                          {cameraError}
                        </div>
                      )}

                      <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <p className="text-sm font-black text-[#1d1d1f]">
                          Saved Photo Path
                        </p>

                        <p className="mt-2 break-all text-sm leading-6 text-[#6b6257]">
                          {form.customer_photo || "No photo uploaded yet."}
                        </p>
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <p className="text-sm font-black text-[#1d1d1f]">
                          Quick Preview
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-[#6b6257]">
                          <PreviewRow label="Name" value={form.full_name} />
                          <PreviewRow label="Phone" value={form.phone} />
                          <PreviewRow label="WhatsApp" value={form.whatsapp} />
                          <PreviewRow label="License" value={form.license_number} />
                        </div>
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
                      Full name and phone number are required before saving.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/admin/customers"
                      className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-7 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save Customer"}
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

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-black text-[#1d1d1f]">{label}:</span>{" "}
      {value || "-"}
    </p>
  );
}
