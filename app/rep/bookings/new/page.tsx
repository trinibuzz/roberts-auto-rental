"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  customer_photo?: string | null;
};

type Vehicle = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  daily_rate: string | number | null;
  deposit_amount: string | number | null;
  status: string;
  vehicle_photo?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  color?: string | null;
};

const steps = ["Customer", "Vehicle", "Dates", "Payment", "Confirm"];

export default function RepNewBookingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState("");

  const [quickCustomer, setQuickCustomer] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    email: "",
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

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    daily_rate: "",
    number_of_days: "1",
    deposit: "",
    discount: "0",
    extra_charges: "0",
    total_amount: "0",
    amount_paid: "0",
    balance: "0",
    status: "confirmed",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      setError("");

      try {
        const [customerResponse, vehicleResponse] = await Promise.all([
          fetch("/api/admin/customers"),
          fetch("/api/admin/vehicles"),
        ]);

        const customerData = await customerResponse.json();
        const vehicleData = await vehicleResponse.json();

        if (customerData.success) {
          setCustomers(customerData.customers || []);
        }

        if (vehicleData.success) {
          setVehicles(vehicleData.vehicles || []);
        }
      } catch {
        setError("Unable to load customers and vehicles.");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === form.customer_id
  );

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === form.vehicle_id
  );

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (!search) return customers.slice(0, 10);

    return customers
      .filter((customer) => {
        return (
          customer.full_name?.toLowerCase().includes(search) ||
          customer.phone?.toLowerCase().includes(search) ||
          customer.whatsapp?.toLowerCase().includes(search)
        );
      })
      .slice(0, 20);
  }, [customers, customerSearch]);

  const filteredVehicles = useMemo(() => {
    const search = vehicleSearch.trim().toLowerCase();

    return vehicles
      .filter((vehicle) => {
        const status = vehicle.status?.toLowerCase();
        const available = status === "available" || status === "reserved";

        const matches =
          !search ||
          vehicle.vehicle_name?.toLowerCase().includes(search) ||
          vehicle.plate_number?.toLowerCase().includes(search) ||
          vehicle.make?.toLowerCase().includes(search) ||
          vehicle.model?.toLowerCase().includes(search);

        return available && matches;
      })
      .slice(0, 30);
  }, [vehicles, vehicleSearch]);

  function updateField(name: string, value: string) {
    setForm((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      return calculateTotals(next);
    });
  }

  function updateQuickCustomerField(name: string, value: string | boolean) {
    setQuickCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function selectVehicle(vehicle: Vehicle) {
    const dailyRate = String(vehicle.daily_rate || "");
    const deposit = String(vehicle.deposit_amount || "");

    setForm((previous) =>
      calculateTotals({
        ...previous,
        vehicle_id: String(vehicle.id),
        daily_rate: dailyRate,
        deposit,
        amount_paid: previous.amount_paid || deposit || "0",
      })
    );
  }

  async function saveQuickCustomer() {
    setCustomerError("");

    if (!quickCustomer.full_name || !quickCustomer.phone) {
      setCustomerError("Customer name and phone number are required.");
      return;
    }

    setCustomerSaving(true);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quickCustomer),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setCustomerError(data.message || "Failed to add customer.");
        setCustomerSaving(false);
        return;
      }

      const refreshed = await fetch("/api/admin/customers");
      const refreshedData = await refreshed.json();

      if (refreshedData.success) {
        const updatedCustomers = refreshedData.customers || [];
        setCustomers(updatedCustomers);

        const newCustomer = updatedCustomers.find((customer: Customer) => {
          return (
            customer.phone === quickCustomer.phone ||
            customer.full_name?.toLowerCase() ===
              quickCustomer.full_name.toLowerCase()
          );
        });

        if (newCustomer) {
          updateField("customer_id", String(newCustomer.id));
          setCustomerSearch(newCustomer.full_name);
        }
      }

      setQuickCustomerOpen(false);
      setQuickCustomer({
        full_name: "",
        phone: "",
        whatsapp: "",
        email: "",
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
    } catch {
      setCustomerError("Unable to connect to the server.");
    } finally {
      setCustomerSaving(false);
    }
  }

  function goNext() {
    setError("");

    if (currentStep === 1 && !form.customer_id) {
      setError("Select or add a customer first.");
      return;
    }

    if (currentStep === 2 && !form.vehicle_id) {
      setError("Select a vehicle first.");
      return;
    }

    if (
      currentStep === 3 &&
      (!form.pickup_date || !form.pickup_time || !form.return_date || !form.return_time)
    ) {
      setError("Enter pickup and return date/time.");
      return;
    }

    if (currentStep === 4 && !form.daily_rate) {
      setError("Daily rate is required.");
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, 5));
  }

  function goBack() {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    if (!form.customer_id || !form.vehicle_id) {
      setError("Customer and vehicle are required.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calculateTotals(form)),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to create booking.");
        setSaving(false);
        return;
      }

      router.push("/rep");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] pb-28 text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#e7e2d9] bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b98320]">
              Roberts Rep Mode
            </p>

            <h1 className="mt-1 font-serif text-2xl font-black">
              Quick Booking
            </h1>
          </div>

          <Link
            href="/rep"
            className="rounded-full border border-[#e7e2d9] bg-white px-4 py-3 text-xs font-black text-[#1d1d1f] shadow-sm"
          >
            Home
          </Link>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-5 p-5">
        <section className="overflow-hidden rounded-3xl bg-black shadow-xl">
          <div className="relative min-h-[170px] overflow-hidden px-6 py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(212,175,55,0.30),transparent_34%),linear-gradient(135deg,#050505_0%,#151515_45%,#3a2410_100%)]" />

            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4af37]">
                Step {currentStep} of 5
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-white">
                {steps[currentStep - 1]}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/75">
                Fast mobile flow for staff to create a booking quickly from a
                phone or tablet.
              </p>
            </div>
          </div>
        </section>

        <StepDots currentStep={currentStep} />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {loadingData ? (
          <section className="rounded-3xl border border-[#e7e2d9] bg-white p-8 text-center text-sm font-bold text-[#7a7168] shadow-xl shadow-black/5">
            Loading booking tools...
          </section>
        ) : (
          <>
            {currentStep === 1 && (
              <section className="rounded-3xl border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl font-black">
                      Select Customer
                    </h3>
                    <p className="mt-1 text-sm text-[#7a7168]">
                      Search existing customer or add a quick customer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickCustomerOpen((open) => !open);
                      setCustomerError("");
                    }}
                    className="rounded-xl bg-[#111111] px-4 py-3 text-xs font-black text-white"
                  >
                    + Add
                  </button>
                </div>

                {quickCustomerOpen && (
                  <div className="mt-5 rounded-3xl border border-[#eee9df] bg-[#fbfaf8] p-5">
                    <h4 className="font-black">Quick Add Customer</h4>

                    {customerError && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {customerError}
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Full Name"
                        value={quickCustomer.full_name}
                        onChange={(value) =>
                          updateQuickCustomerField("full_name", value)
                        }
                        required
                      />

                      <Input
                        label="Phone"
                        value={quickCustomer.phone}
                        onChange={(value) =>
                          updateQuickCustomerField("phone", value)
                        }
                        required
                      />

                      <Input
                        label="WhatsApp"
                        value={quickCustomer.whatsapp}
                        onChange={(value) =>
                          updateQuickCustomerField("whatsapp", value)
                        }
                      />

                      <Input
                        label="Email"
                        value={quickCustomer.email}
                        onChange={(value) =>
                          updateQuickCustomerField("email", value)
                        }
                        type="email"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={saveQuickCustomer}
                      disabled={customerSaving}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
                    >
                      {customerSaving ? "Saving Customer..." : "Save & Select Customer"}
                    </button>
                  </div>
                )}

                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search by name, phone, or WhatsApp..."
                  className="mt-5 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                />

                <div className="mt-5 grid gap-3">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        updateField("customer_id", String(customer.id));
                        setCustomerSearch(customer.full_name);
                      }}
                      className={`rounded-3xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${
                        String(customer.id) === form.customer_id
                          ? "border-[#d4af37] bg-[#fff9e8]"
                          : "border-[#eee9df] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <CustomerPhoto customer={customer} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-[#1d1d1f]">
                            {customer.full_name}
                          </p>

                          <p className="mt-1 text-sm text-[#7a7168]">
                            {customer.phone}
                          </p>
                        </div>

                        {String(customer.id) === form.customer_id && (
                          <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-white">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="rounded-3xl border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
                <h3 className="font-serif text-2xl font-black">
                  Select Vehicle
                </h3>
                <p className="mt-1 text-sm text-[#7a7168]">
                  Choose an available vehicle by photo, name, or plate.
                </p>

                <input
                  value={vehicleSearch}
                  onChange={(event) => setVehicleSearch(event.target.value)}
                  placeholder="Search vehicle, plate, make or model..."
                  className="mt-5 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => selectVehicle(vehicle)}
                      className={`overflow-hidden rounded-3xl border text-left shadow-sm transition active:scale-[0.99] ${
                        String(vehicle.id) === form.vehicle_id
                          ? "border-[#d4af37] bg-[#fff9e8]"
                          : "border-[#eee9df] bg-white"
                      }`}
                    >
                      <VehiclePhoto vehicle={vehicle} />

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-[#1d1d1f]">
                              {vehicle.vehicle_name}
                            </p>

                            <p className="mt-1 text-sm text-[#7a7168]">
                              {[vehicle.year, vehicle.make, vehicle.model]
                                .filter(Boolean)
                                .join(" ") || "Vehicle details not set"}
                            </p>
                          </div>

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black capitalize text-green-800">
                            {vehicle.status}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <p>
                            <span className="font-black">Plate:</span>{" "}
                            {vehicle.plate_number}
                          </p>

                          <p>
                            <span className="font-black">Rate:</span>{" "}
                            {formatMoney(vehicle.daily_rate)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredVehicles.length === 0 && (
                  <div className="mt-5 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5 text-sm font-bold text-[#7a7168]">
                    No available vehicles found.
                  </div>
                )}
              </section>
            )}

            {currentStep === 3 && (
              <section className="rounded-3xl border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
                <h3 className="font-serif text-2xl font-black">
                  Pickup & Return
                </h3>
                <p className="mt-1 text-sm text-[#7a7168]">
                  Enter the rental start and return date/time.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Pickup Date"
                    value={form.pickup_date}
                    onChange={(value) => updateField("pickup_date", value)}
                    type="date"
                    required
                  />

                  <Input
                    label="Pickup Time"
                    value={form.pickup_time}
                    onChange={(value) => updateField("pickup_time", value)}
                    type="time"
                    required
                  />

                  <Input
                    label="Return Date"
                    value={form.return_date}
                    onChange={(value) => updateField("return_date", value)}
                    type="date"
                    required
                  />

                  <Input
                    label="Return Time"
                    value={form.return_time}
                    onChange={(value) => updateField("return_time", value)}
                    type="time"
                    required
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#b98320]">
                    Rental Days
                  </p>

                  <p className="mt-2 text-4xl font-black">
                    {form.number_of_days}
                  </p>
                </div>
              </section>
            )}

            {currentStep === 4 && (
              <section className="rounded-3xl border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
                <h3 className="font-serif text-2xl font-black">
                  Rate & Payment
                </h3>
                <p className="mt-1 text-sm text-[#7a7168]">
                  Confirm pricing, deposit, amount paid, and balance.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Daily Rate"
                    value={form.daily_rate}
                    onChange={(value) => updateField("daily_rate", value)}
                    type="number"
                    required
                  />

                  <Input
                    label="Deposit"
                    value={form.deposit}
                    onChange={(value) => updateField("deposit", value)}
                    type="number"
                  />

                  <Input
                    label="Discount"
                    value={form.discount}
                    onChange={(value) => updateField("discount", value)}
                    type="number"
                  />

                  <Input
                    label="Extra Charges"
                    value={form.extra_charges}
                    onChange={(value) => updateField("extra_charges", value)}
                    type="number"
                  />

                  <Input
                    label="Amount Paid"
                    value={form.amount_paid}
                    onChange={(value) => updateField("amount_paid", value)}
                    type="number"
                  />

                  <label>
                    <span className="block text-sm font-black text-[#4b443d]">
                      Booking Status
                    </span>

                    <select
                      value={form.status}
                      onChange={(event) => updateField("status", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="reserved">Reserved</option>
                      <option value="rented">Rented</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MoneyCard label="Total" value={form.total_amount} />
                  <MoneyCard label="Paid" value={form.amount_paid} />
                  <MoneyCard label="Balance" value={form.balance} danger />
                </div>
              </section>
            )}

            {currentStep === 5 && (
              <section className="space-y-4">
                <div className="rounded-3xl border border-[#e7e2d9] bg-white p-5 shadow-xl shadow-black/5">
                  <h3 className="font-serif text-2xl font-black">
                    Confirm Booking
                  </h3>
                  <p className="mt-1 text-sm text-[#7a7168]">
                    Review the details before saving.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <SummaryBlock
                      title="Customer"
                      main={selectedCustomer?.full_name || "No customer selected"}
                      sub={selectedCustomer?.phone || "-"}
                    />

                    <SummaryBlock
                      title="Vehicle"
                      main={selectedVehicle?.vehicle_name || "No vehicle selected"}
                      sub={
                        selectedVehicle
                          ? `${selectedVehicle.plate_number} • ${formatMoney(
                              selectedVehicle.daily_rate
                            )}/day`
                          : "-"
                      }
                    />

                    <SummaryBlock
                      title="Dates"
                      main={`${formatShortDate(form.pickup_date)} ${form.pickup_time}`}
                      sub={`Return: ${formatShortDate(form.return_date)} ${
                        form.return_time
                      }`}
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MoneyCard label="Total" value={form.total_amount} />
                      <MoneyCard label="Paid" value={form.amount_paid} />
                      <MoneyCard label="Balance" value={form.balance} danger />
                    </div>

                    <label>
                      <span className="block text-sm font-black text-[#4b443d]">
                        Notes
                      </span>

                      <textarea
                        value={form.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                        className="mt-2 min-h-28 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                        placeholder="Optional booking notes..."
                      />
                    </label>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        <section className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e7e2d9] bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-4xl gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-2xl border border-[#e7e2d9] bg-white px-5 py-4 text-sm font-black text-[#1d1d1f]"
              >
                Back
              </button>
            ) : (
              <Link
                href="/rep"
                className="flex-1 rounded-2xl border border-[#e7e2d9] bg-white px-5 py-4 text-center text-sm font-black text-[#1d1d1f]"
              >
                Cancel
              </Link>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-[1.5] rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-4 text-sm font-black text-white shadow-lg shadow-black/10"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex-[1.5] rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-4 text-sm font-black text-white shadow-lg shadow-black/10 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Booking"}
              </button>
            )}
          </div>
        </section>
      </form>
    </main>
  );
}

function StepDots({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const active = stepNumber <= currentStep;

        return (
          <div key={step} className="text-center">
            <div
              className={`h-2 rounded-full ${
                active ? "bg-[#d4af37]" : "bg-[#e7e2d9]"
              }`}
            />
            <p
              className={`mt-2 hidden text-[10px] font-black uppercase tracking-wide sm:block ${
                active ? "text-[#b98320]" : "text-[#9a9085]"
              }`}
            >
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="block text-sm font-black text-[#4b443d]">{label}</span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-4 text-base font-semibold outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
      />
    </label>
  );
}

function CustomerPhoto({ customer }: { customer: Customer }) {
  if (customer.customer_photo) {
    return (
      <img
        src={customer.customer_photo}
        alt={customer.full_name}
        className="h-14 w-14 rounded-2xl border border-[#eee9df] object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/15 text-xl font-black text-[#b98320]">
      {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : "?"}
    </div>
  );
}

function VehiclePhoto({ vehicle }: { vehicle: Vehicle }) {
  if (vehicle.vehicle_photo) {
    return (
      <img
        src={vehicle.vehicle_photo}
        alt={vehicle.vehicle_name}
        className="h-36 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-36 w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(135deg,#111111,#3a2410)] text-4xl">
      🚗
    </div>
  );
}

function MoneyCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8178]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          danger && Number(value || 0) > 0 ? "text-red-700" : "text-[#1d1d1f]"
        }`}
      >
        {formatMoney(value)}
      </p>
    </div>
  );
}

function SummaryBlock({
  title,
  main,
  sub,
}: {
  title: string;
  main: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a8178]">
        {title}
      </p>

      <p className="mt-2 text-xl font-black text-[#1d1d1f]">{main}</p>
      <p className="mt-1 text-sm font-semibold text-[#7a7168]">{sub}</p>
    </div>
  );
}

function calculateTotals(currentForm: BookingForm) {
  const pickup = currentForm.pickup_date
    ? new Date(`${currentForm.pickup_date}T${currentForm.pickup_time || "00:00"}`)
    : null;

  const returnDate = currentForm.return_date
    ? new Date(`${currentForm.return_date}T${currentForm.return_time || "00:00"}`)
    : null;

  let days = Number(currentForm.number_of_days || 1);

  if (
    pickup &&
    returnDate &&
    !Number.isNaN(pickup.getTime()) &&
    !Number.isNaN(returnDate.getTime()) &&
    returnDate > pickup
  ) {
    const milliseconds = returnDate.getTime() - pickup.getTime();
    days = Math.max(1, Math.ceil(milliseconds / (1000 * 60 * 60 * 24)));
  }

  const dailyRate = Number(currentForm.daily_rate || 0);
  const discount = Number(currentForm.discount || 0);
  const extraCharges = Number(currentForm.extra_charges || 0);
  const amountPaid = Number(currentForm.amount_paid || 0);

  const totalAmount = Math.max(0, dailyRate * days + extraCharges - discount);
  const balance = Math.max(0, totalAmount - amountPaid);

  return {
    ...currentForm,
    number_of_days: String(days),
    total_amount: totalAmount.toFixed(2),
    balance: balance.toFixed(2),
  };
}

type BookingForm = {
  customer_id: string;
  vehicle_id: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  daily_rate: string;
  number_of_days: string;
  deposit: string;
  discount: string;
  extra_charges: string;
  total_amount: string;
  amount_paid: string;
  balance: string;
  status: string;
  notes: string;
};

const initialCalculationShape: BookingForm = {
  customer_id: "",
  vehicle_id: "",
  pickup_date: "",
  pickup_time: "",
  return_date: "",
  return_time: "",
  daily_rate: "",
  number_of_days: "1",
  deposit: "",
  discount: "0",
  extra_charges: "0",
  total_amount: "0",
  amount_paid: "0",
  balance: "0",
  status: "confirmed",
  notes: "",
};

function formatMoney(value: string | number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatShortDate(value: string) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
