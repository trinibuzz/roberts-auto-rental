"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VehicleStatusButtons({
  vehicleId,
  currentStatus,
}: {
  vehicleId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState("");

  async function updateVehicleStatus(status: string) {
    const label = status.replaceAll("_", " ");

    if (!confirm(`Mark this vehicle as ${label}?`)) {
      return;
    }

    setLoadingStatus(status);

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update vehicle.");
        setLoadingStatus("");
        return;
      }

      router.refresh();
    } catch {
      alert("Unable to connect to the server.");
      setLoadingStatus("");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "available" && (
        <button
          type="button"
          disabled={loadingStatus !== ""}
          onClick={() => updateVehicleStatus("available")}
          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loadingStatus === "available" ? "..." : "Available"}
        </button>
      )}

      {currentStatus !== "maintenance" && (
        <button
          type="button"
          disabled={loadingStatus !== ""}
          onClick={() => updateVehicleStatus("maintenance")}
          className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {loadingStatus === "maintenance" ? "..." : "Maintenance"}
        </button>
      )}

      {currentStatus !== "out_of_service" && (
        <button
          type="button"
          disabled={loadingStatus !== ""}
          onClick={() => updateVehicleStatus("out_of_service")}
          className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loadingStatus === "out_of_service" ? "..." : "Out of Service"}
        </button>
      )}
    </div>
  );
}