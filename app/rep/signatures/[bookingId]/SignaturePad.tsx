"use client";

import { useRef, useState } from "react";

type BookingDetails = {
  id: number;
  booking_number: string;
  customer_name: string;
};

export default function SignaturePad({
  booking,
}: {
  booking: BookingDetails;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [signedName, setSignedName] = useState(booking.customer_name || "");
  const [isDrawing, setIsDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const point = getCanvasPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#07111f";

    setIsDrawing(true);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const point = getCanvasPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setMessage("");
    setSuccess("");
  }

  async function saveSignature() {
    setMessage("");
    setSuccess("");
    setIsSaving(true);

    try {
      const canvas = canvasRef.current;

      if (!canvas) {
        setMessage("Signature pad not ready.");
        return;
      }

      const signatureData = canvas.toDataURL("image/png");

      const response = await fetch("/api/rep/signatures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: booking.id,
          signed_name: signedName,
          signature_data: signatureData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to save signature.");
        return;
      }

      setSuccess("Customer signature saved successfully.");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">Customer Signature</h2>

      <p className="mt-2 text-white/60">
        Ask the customer to sign inside the white box below.
      </p>

      {message ? (
        <div className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      {success ? (
        <div className="mt-5 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </div>
      ) : null}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-bold text-white/70">
          Signed Name
        </label>

        <input
          value={signedName}
          onChange={(event) => setSignedName(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white px-4 py-4 text-[#07111f] outline-none focus:border-[#d4af37]"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border-4 border-[#d4af37] bg-white">
        <canvas
          ref={canvasRef}
          width={900}
          height={320}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="h-80 w-full touch-none bg-white"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={saveSignature}
          disabled={isSaving}
          className="rounded-xl bg-[#d4af37] px-6 py-4 font-black text-[#07111f] hover:bg-[#c79f2f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving Signature..." : "Save Signature"}
        </button>

        <button
          type="button"
          onClick={clearSignature}
          className="rounded-xl border border-white/20 px-6 py-4 font-bold text-white hover:bg-white/10"
        >
          Clear Signature
        </button>
      </div>
    </div>
  );
}