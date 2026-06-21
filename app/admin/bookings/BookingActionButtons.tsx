"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookingActionButtons({
  bookingId,
  status,
}: {
  bookingId: number;
  status: string;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState("");

  async function updateStatus(action: "checkout" | "checkin" | "cancel") {
    const confirmMessage =
      action === "checkout"
        ? "Check out this vehicle now?"
        : action === "checkin"
        ? "Check in this vehicle and mark it available?"
        : "Cancel this booking?";

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoadingAction(action);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update booking.");
        setLoadingAction("");
        return;
      }

      router.refresh();
    } catch {
      alert("Unable to connect to the server.");
      setLoadingAction("");
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("checkout")}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="mr-2">▣</span>
          {loadingAction === "checkout" ? "Processing..." : "Check Out"}
        </button>
      )}

      {status === "active" && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("checkin")}
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="mr-2">✓</span>
          {loadingAction === "checkin" ? "Processing..." : "Check In"}
        </button>
      )}

      {status !== "completed" && status !== "cancelled" && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("cancel")}
          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="mr-2">□</span>
          {loadingAction === "cancel" ? "Processing..." : "Cancel"}
        </button>
      )}
    </div>
  );
}