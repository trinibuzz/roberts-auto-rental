
"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type Booking = {
  id: number;
  booking_number: string | null;
  status: string;
  full_name: string | null;
  phone: string | null;
  customer_photo: string | null;
  vehicle_name: string | null;
  plate_number: string | null;
  vehicle_photo: string | null;
  pickup_date: string | null;
  return_date: string | null;
};

type MediaItem = {
  id: number;
  media_type: "photo" | "video";
  media_url: string;
  note: string | null;
};

export default function RepCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [form, setForm] = useState({
    checkout_mileage: "",
    fuel_level: "Full",
    damage_notes: "",
    staff_notes: "",
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => setCameraError("Camera preview could not start."));
  }, [cameraOpen]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function loadBooking() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rep/bookings/${bookingId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to load booking.");
        return;
      }

      setBooking(data.booking);
      setMedia(data.media || []);
    } catch {
      setError("Unable to load booking.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(name: string, value: string) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function uploadMediaFile(file: File, note = "") {
    setUploading(true);
    setError("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("booking_id", bookingId);
      uploadForm.append("note", note);

      const response = await fetch("/api/rep/checkout-media", {
        method: "POST",
        body: uploadForm,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to upload media.");
        return;
      }

      await loadBooking();
    } catch {
      setError("Unable to upload media.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadMediaFile(file, "Vehicle going out");
    event.target.value = "";
  }

  async function openCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Camera access was blocked. Allow camera permission and try again.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video) {
      setCameraError("Camera preview is not ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Could not capture photo.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `checkout-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadMediaFile(file, "Captured check-out photo");
      stopCamera();
    }, "image/jpeg", 0.92);
  }

  async function finishCheckout() {
    setError("");
    setSuccess("");

    if (!form.checkout_mileage) {
      setError("Mileage out is required before check-out.");
      return;
    }

    if (media.length === 0) {
      setError("Take or upload at least one photo/video before check-out.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/rep/bookings/${bookingId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to complete check-out.");
        return;
      }

      setSuccess("Vehicle checked out successfully.");
      router.push("/rep");
      router.refresh();
    } catch {
      setError("Unable to complete check-out.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-28 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b98320]">Roberts Rep Mode</p>
            <h1 className="mt-1 font-serif text-3xl font-black">Vehicle Check-Out</h1>
          </div>
          <Link href="/rep" className="rounded-full border border-[#e7e2d9] bg-white px-6 py-4 text-sm font-black shadow-sm">Home</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div>}
        {success && <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">{success}</div>}

        {loading ? (
          <div className="rounded-[2rem] border border-[#e7e2d9] bg-white p-10 text-center font-bold text-[#7a7168]">Loading check-out...</div>
        ) : booking ? (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-[#d8d0c4] bg-white shadow-xl">
              {booking.vehicle_photo ? <img src={booking.vehicle_photo} alt={booking.vehicle_name || "Vehicle"} className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center bg-[#111] text-5xl">🚗</div>}
              <div className="p-5">
                <h2 className="font-serif text-3xl font-black">{booking.vehicle_name}</h2>
                <p className="mt-1 text-sm font-bold text-[#7a7168]">{booking.plate_number} • {booking.booking_number || `#${booking.id}`}</p>
                <p className="mt-3 text-sm font-bold text-[#1d1d1f]">Customer: {booking.full_name || "-"} • {booking.phone || "-"}</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
              <h3 className="font-serif text-3xl font-black">Going Out Details</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label><span className="block text-sm font-black text-[#4b443d]">Mileage Out</span><input type="number" value={form.checkout_mileage} onChange={(event) => updateField("checkout_mileage", event.target.value)} className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]" /></label>
                <label><span className="block text-sm font-black text-[#4b443d]">Fuel Level</span><select value={form.fuel_level} onChange={(event) => updateField("fuel_level", event.target.value)} className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"><option>Full</option><option>3/4</option><option>1/2</option><option>1/4</option><option>Empty</option></select></label>
              </div>
              <label className="mt-4 block"><span className="block text-sm font-black text-[#4b443d]">Damage Notes</span><textarea value={form.damage_notes} onChange={(event) => updateField("damage_notes", event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border-2 border-[#e7e2d9] px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]" placeholder="Scratches, dents, tyre condition, lights, etc." /></label>
              <label className="mt-4 block"><span className="block text-sm font-black text-[#4b443d]">Staff Notes</span><textarea value={form.staff_notes} onChange={(event) => updateField("staff_notes", event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border-2 border-[#e7e2d9] px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]" /></label>
            </section>

            <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
              <h3 className="font-serif text-3xl font-black">Photos / Videos</h3>
              <p className="mt-1 text-sm text-[#7a7168]">Take photos or upload videos of the car before it goes out.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="rounded-2xl bg-[#111] px-5 py-5 text-center text-sm font-black text-white">Upload Photo / Video<input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} /></label>
                <button type="button" onClick={openCamera} className="rounded-2xl border border-[#d4af37]/40 bg-[#fff9e8] px-5 py-5 text-sm font-black">Take Photo</button>
              </div>
              {uploading && <p className="mt-3 text-sm font-bold text-[#b98320]">Uploading...</p>}
              {cameraError && <p className="mt-3 text-sm font-bold text-red-700">{cameraError}</p>}
              {cameraOpen && <div className="mt-5 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black"><video ref={videoRef} autoPlay muted playsInline className="h-80 w-full object-cover" /><div className="grid gap-3 bg-white p-4 sm:grid-cols-2"><button type="button" onClick={capturePhoto} className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-3 text-sm font-black text-white">Capture Photo</button><button type="button" onClick={stopCamera} className="rounded-xl border border-[#e7e2d9] px-5 py-3 text-sm font-black">Close Camera</button></div></div>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {media.map((item) => <div key={item.id} className="overflow-hidden rounded-2xl border border-[#eee9df] bg-[#fbfaf8]">{item.media_type === "video" ? <video src={item.media_url} controls className="h-44 w-full object-cover" /> : <img src={item.media_url} alt="Check-out media" className="h-44 w-full object-cover" />}<p className="p-3 text-xs font-bold text-[#7a7168]">{item.note || item.media_type}</p></div>)}
              </div>
            </section>
          </>
        ) : null}
      </section>

      <section className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d9] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3">
          <Link href="/rep" className="flex-1 rounded-2xl border border-[#e7e2d9] bg-white px-5 py-5 text-center text-base font-black">Cancel</Link>
          <button type="button" onClick={finishCheckout} disabled={saving} className="flex-[1.5] rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-base font-black text-white disabled:opacity-60">{saving ? "Saving..." : "Complete Check-Out"}</button>
        </div>
      </section>
    </main>
  );
}
