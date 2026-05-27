"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-[#07111f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12345f]"
    >
      Print
    </button>
  );
}