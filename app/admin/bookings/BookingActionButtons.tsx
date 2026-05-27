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
    <div className="flex flex-wrap gap-2">
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("checkout")}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loadingAction === "checkout" ? "..." : "Check Out"}
        </button>
      )}

      {status === "active" && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("checkin")}
          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loadingAction === "checkin" ? "..." : "Check In"}
        </button>
      )}

      {status !== "completed" && status !== "cancelled" && (
        <button
          type="button"
          disabled={loadingAction !== ""}
          onClick={() => updateStatus("cancel")}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loadingAction === "cancel" ? "..." : "Cancel"}
        </button>
      )}
    </div>
  );
}