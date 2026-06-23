"use client";

import { useEffect, useRef, useState } from "react";

type BookingDetails = {
  id: number;
  booking_number: string;
  status: string;
  customer_id: number;
  vehicle_id: number;
  customer_name: string;
  phone: string;
  vehicle_name: string;
  plate_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
};

export default function MobileSignaturePad({
  booking,
  saveSignature,
}: {
  booking: BookingDetails;
  saveSignature: (formData: FormData) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [signedName, setSignedName] = useState(booking.customer_name || "");
  const [signatureData, setSignatureData] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    prepareCanvas();
    window.addEventListener("resize", prepareCanvas);

    return () => {
      window.removeEventListener("resize", prepareCanvas);
    };
  }, []);

  function prepareCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth || 700;
    const height = 260;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 4;
    context.strokeStyle = "#111111";
  }

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
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

    canvas.setPointerCapture(event.pointerId);

    const point = getPoint(event);

    context.beginPath();
    context.moveTo(point.x, point.y);

    setDrawing(true);
    setMessage("");
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignored
      }

      setSignatureData(canvas.toDataURL("image/png"));
    }

    setDrawing(false);
  }

  function clearSignature() {
    prepareCanvas();
    setSignatureData("");
    setMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const canvas = canvasRef.current;
    const data = canvas?.toDataURL("image/png") || "";

    if (!signedName.trim()) {
      event.preventDefault();
      setMessage("Please enter the customer name.");
      return;
    }

    if (!data || data.length < 5000) {
      event.preventDefault();
      setMessage("Please sign inside the box before saving.");
      return;
    }

    setSignatureData(data);
  }

  return (
    <section className="rounded-[2rem] border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
        Customer Approval
      </p>

      <h2 className="mt-2 font-serif text-3xl font-black">Sign Agreement</h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#7a7168]">
        Ask the customer to sign below after reviewing the rental details,
        vehicle condition, payment, and agreement.
      </p>

      {message ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <form action={saveSignature} onSubmit={handleSubmit} className="mt-5">
        <input type="hidden" name="booking_id" value={booking.id} />
        <input type="hidden" name="customer_id" value={booking.customer_id} />
        <input type="hidden" name="vehicle_id" value={booking.vehicle_id} />
        <input type="hidden" name="signature_data" value={signatureData} />

        <label className="block">
          <span className="block text-sm font-black text-[#4b443d]">
            Signed Name
          </span>

          <input
            name="signed_name"
            type="text"
            value={signedName}
            onChange={(event) => setSignedName(event.target.value)}
            className="mt-2 w-full rounded-2xl border-2 border-[#e7e2d9] bg-white px-5 py-5 text-lg font-semibold outline-none focus:border-[#d4af37]"
          />
        </label>

        <div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#e7e2d9] bg-white">
          <div className="border-b border-[#eee9df] bg-[#fbfaf8] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#8a8178]">
            Sign inside this box
          </div>

          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className="block w-full touch-none bg-white"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={clearSignature}
            className="rounded-2xl border border-[#e7e2d9] bg-white px-5 py-5 text-base font-black text-[#1d1d1f]"
          >
            Clear
          </button>

          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-5 text-base font-black text-white shadow-lg"
          >
            Save Signature
          </button>
        </div>
      </form>
    </section>
  );
}
