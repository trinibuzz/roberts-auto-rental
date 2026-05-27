"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InspectionMedia = {
  id: number;
  inspection_type: string;
  media_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  delete_after_completed_rentals: number;
  created_at: string;
};

export default function BookingVideosPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId = String(params.id);

  const [inspectionType, setInspectionType] = useState("checkout");
  const [deleteAfter, setDeleteAfter] = useState("3");
  const [file, setFile] = useState<File | null>(null);
  const [media, setMedia] = useState<InspectionMedia[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadMedia() {
    const response = await fetch(
      `/api/admin/inspection-media?booking_id=${bookingId}`
    );

    const data = await response.json();

    if (data.success) {
      setMedia(data.media);
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("booking_id", bookingId);
      formData.append("inspection_type", inspectionType);
      formData.append("delete_after_completed_rentals", deleteAfter);
      formData.append("file", file);

      const response = await fetch("/api/admin/inspection-media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to upload video.");
        setLoading(false);
        return;
      }

      setFile(null);
      setLoading(false);
      await loadMedia();
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
            <NavLink href="/admin/dashboard" label="Dashboard" />
            <NavLink href="/admin/vehicles" label="Vehicles" />
            <NavLink href="/admin/customers" label="Customers" />
            <NavLink href="/admin/bookings" label="Bookings" />
            <NavLink href="/admin/calendar" label="Calendar View" />
            <NavLink href="/admin/payments" label="Payments" />
            <NavLink href="/admin/maintenance" label="Maintenance" />
            <NavLink href="/admin/reports" label="Reports" />
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Inspection Videos
              </h2>
              <p className="text-sm text-gray-500">
                Upload check-out and return videos for this booking.
              </p>
            </div>

            <Link
              href={`/admin/bookings/${bookingId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Booking
            </Link>
          </header>

          <div className="p-6">
            <form
              onSubmit={handleUpload}
              className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900">
                Upload Video Evidence
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Use a short video. Recommended length: 30 seconds to 2 minutes.
              </p>

              {error && (
                <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Inspection Type
                  </label>
                  <select
                    value={inspectionType}
                    onChange={(event) => setInspectionType(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="checkout">Check-Out Video</option>
                    <option value="return">Return Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Auto-delete After Completed Rentals
                  </label>
                  <select
                    value={deleteAfter}
                    onChange={(event) => setDeleteAfter(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="2">After 2 more rentals</option>
                    <option value="3">After 3 more rentals</option>
                    <option value="5">After 5 more rentals</option>
                    <option value="999999">Never auto-delete</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Video File
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] || null)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#07111f]"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Allowed: MP4, MOV, WEBM. Maximum: 100MB.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href={`/admin/bookings/${bookingId}`}
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Uploading..." : "Upload Video"}
                </button>
              </div>
            </form>

            <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Uploaded Videos
              </h3>

              {media.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No inspection videos uploaded yet.
                </p>
              ) : (
                <div className="mt-5 space-y-6">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row">
                        <div>
                          <p className="font-bold capitalize text-gray-900">
                            {item.inspection_type} video
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded {formatDate(item.created_at)}
                          </p>
                        </div>

                        <div className="text-sm text-gray-500">
                          Auto-delete after{" "}
                          {item.delete_after_completed_rentals >= 999999
                            ? "never"
                            : `${item.delete_after_completed_rentals} completed rentals`}
                        </div>
                      </div>

                      <video
                        src={item.file_url}
                        controls
                        className="w-full rounded-xl border bg-black"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-lg px-4 py-3 hover:bg-white/10">
      {label}
    </Link>
  );
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}