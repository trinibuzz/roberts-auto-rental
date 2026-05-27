"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: number;
  booking_number: string;
  customer_name: string;
  vehicle_name: string;
  plate_number: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: string;
};

export default function NewPaymentPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [form, setForm] = useState({
    booking_id: "",
    amount: "",
    payment_method: "cash",
    payment_reference: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();

      if (data.success) {
        const openBookings = data.bookings.filter(
          (booking: Booking) =>
            booking.status !== "cancelled" &&
            Number(booking.balance || 0) > 0
        );

        setBookings(openBookings);
      }
    }

    loadBookings();
  }, []);

  function updateField(name: string, value: string) {
    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === "booking_id") {
      const foundBooking = bookings.find(
        (booking) => String(booking.id) === value
      );

      setSelectedBooking(foundBooking || null);

      if (foundBooking) {
        updatedForm.amount = String(foundBooking.balance || "");
      }
    }

    setForm(updatedForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to record payment.");
        setLoading(false);
        return;
      }

      router.push("/admin/payments");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
      setLoading(false);
    }
  }

  const paymentAmount = Number(form.amount || 0);
  const currentBalance = Number(selectedBooking?.balance || 0);
  const balanceAfterPayment = Math.max(currentBalance - paymentAmount, 0);

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-[#07111f] text-white md:block">
          <div className="border-b border-white/10 px-6 py-6">
            <h1 className="text-xl font-bold">Roberts Auto Rental</h1>
            <p className="text-sm text-[#d4af37]">Fleet & Booking Manager</p>
          </div>

          <nav className="space-y-2 px-4 py-6 text-sm">
            <Link href="/admin/dashboard" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Dashboard
            </Link>

            <Link href="/admin/vehicles" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Vehicles
            </Link>

            <Link href="/admin/customers" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Customers
            </Link>

            <Link href="/admin/bookings" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Bookings
            </Link>

            <Link href="/admin/calendar" className="block rounded-lg px-4 py-3 hover:bg-white/10">
              Calendar View
            </Link>

            <Link href="/admin/payments" className="block rounded-lg bg-[#d4af37] px-4 py-3 font-semibold text-[#07111f]">
              Payments
            </Link>
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Record Payment
              </h2>
              <p className="text-sm text-gray-500">
                Apply a customer payment to an open booking balance.
              </p>
            </div>

            <Link
              href="/admin/payments"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Payments
            </Link>
          </header>

          <div className="p-6">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm"
            >
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Booking
                  </label>
                  <select
                    required
                    value={form.booking_id}
                    onChange={(event) =>
                      updateField("booking_id", event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="">Select booking with balance</option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.booking_number} — {booking.customer_name} —{" "}
                        {booking.vehicle_name} / {booking.plate_number} —
                        Balance ${Number(booking.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Payment Amount"
                  name="amount"
                  value={form.amount}
                  onChange={updateField}
                  type="number"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Payment Method
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(event) =>
                      updateField("payment_method", event.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="online_payment">Online Payment</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Payment Reference"
                  name="payment_reference"
                  value={form.payment_reference}
                  onChange={updateField}
                  placeholder="Receipt #, bank ref, transaction ID"
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
                />
              </div>

              {selectedBooking && (
                <div className="mt-8 rounded-xl bg-gray-50 p-5">
                  <h3 className="font-bold text-gray-900">Payment Summary</h3>

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold">
                        ${Number(selectedBooking.total_amount || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Already Paid</p>
                      <p className="font-bold">
                        ${Number(selectedBooking.amount_paid || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Current Balance</p>
                      <p className="font-bold text-red-600">
                        ${currentBalance.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Balance After Payment</p>
                      <p className="font-bold text-green-700">
                        ${balanceAfterPayment.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <Link
                  href="/admin/payments"
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#07111f] px-5 py-3 font-semibold text-white hover:bg-[#12345f] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
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
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#07111f]"
      />
    </div>
  );
}