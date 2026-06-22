"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/app/admin/components/AdminSidebar";
import AdminMobileHeader from "@/app/admin/components/AdminMobileHeader";

type Customer = {
  id: number;
  full_name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
};

type Vehicle = {
  id: number;
  vehicle_name: string;
  plate_number: string;
  daily_rate: string;
  deposit_amount: string;
  status: string;
  vehicle_photo?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  color?: string | null;
};

export default function NewBookingPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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

  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [customerSuccess, setCustomerSuccess] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === String(form.vehicle_id)
  );

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(form.customer_id)
  );

  useEffect(() => {
    async function loadData() {
      try {
        await loadCustomers();
        await loadVehicles();
      } catch {
        setError("Unable to load customers and vehicles.");
      }
    }

    loadData();
  }, []);

  async function loadCustomers() {
    const customerResponse = await fetch("/api/admin/customers");
    const customerData = await customerResponse.json();

    if (customerData.success) {
      setCustomers(customerData.customers);
      return customerData.customers as Customer[];
    }

    throw new Error(customerData.message || "Failed to load customers.");
  }

  async function loadVehicles() {
    const vehicleResponse = await fetch("/api/admin/vehicles");
    const vehicleData = await vehicleResponse.json();

    if (vehicleData.success) {
      setVehicles(vehicleData.vehicles);
      return vehicleData.vehicles as Vehicle[];
    }

    throw new Error(vehicleData.message || "Failed to load vehicles.");
  }

  function updateField(name: string, value: string) {
    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (name === "vehicle_id") {
      const selected = vehicles.find((vehicle) => String(vehicle.id) === value);

      if (selected) {
        updatedForm.daily_rate = String(selected.daily_rate || "0");
        updatedForm.deposit = String(selected.deposit_amount || "0");
      }
    }

    const calculated = calculateTotals(updatedForm);

    setForm({
      ...updatedForm,
      ...calculated,
    });
  }

  function updateQuickCustomerField(name: string, value: string | boolean) {
    setQuickCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function calculateTotals(currentForm: typeof form) {
    let days = Number(currentForm.number_of_days || 1);

    if (currentForm.pickup_date && currentForm.return_date) {
      const pickup = new Date(currentForm.pickup_date);
      const returned = new Date(currentForm.return_date);

      const diff = returned.getTime() - pickup.getTime();
      const calculatedDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

      days = calculatedDays > 0 ? calculatedDays : 1;
    }

    const dailyRate = Number(currentForm.daily_rate || 0);
    const discount = Number(currentForm.discount || 0);
    const extras = Number(currentForm.extra_charges || 0);
    const amountPaid = Number(currentForm.amount_paid || 0);

    const total = days * dailyRate + extras - discount;
    const balance = total - amountPaid;

    return {
      number_of_days: String(days),
      total_amount: String(total < 0 ? 0 : total),
      balance: String(balance < 0 ? 0 : balance),
    };
  }

  async function handleQuickCustomerSubmit() {
    setCustomerError("");
    setCustomerSuccess("");

    if (!quickCustomer.full_name.trim() || !quickCustomer.phone.trim()) {
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

      const refreshedCustomers = await loadCustomers();

      const newCustomer = refreshedCustomers.find(
        (customer) =>
          customer.phone === quickCustomer.phone ||
          customer.full_name.toLowerCase() === quickCustomer.full_name.toLowerCase()
      );

      if (newCustomer) {
        setForm((previous) => ({
          ...previous,
          customer_id: String(newCustomer.id),
        }));
      }

      setCustomerSuccess("Customer added and selected for this booking.");
      setShowQuickCustomer(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to create booking.");
        setLoading(false);
        return;
      }

      router.push("/admin/bookings");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#1d1d1f]">
      <AdminMobileHeader />

      <div className="flex min-h-screen">
        <AdminSidebar active="bookings" />

        <section className="flex-1">
          <header className="border-b border-[#e7e2d9] bg-white px-6 py-6 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-serif text-4xl font-black text-[#1d1d1f]">
                  New Booking
                </h1>

                <p className="mt-2 text-sm text-[#6b6257]">
                  Create a rental booking, add a customer if needed, reserve a
                  vehicle, and confirm the correct vehicle image.
                </p>
              </div>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-sm font-black text-[#1d1d1f] shadow-sm transition hover:bg-[#fbfaf8]"
              >
                Back to Bookings
              </Link>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl">
              <div className="relative min-h-[230px] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(90deg,#050505_0%,#111111_45%,#3a2410_100%)]" />

                <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
                  <div className="max-w-2xl">
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
                      Roberts Auto Rental
                    </p>

                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
                      One Stop Booking.
                      <br />
                      Customer, Vehicle, Payment.
                    </h2>

                    <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

                    <p className="mt-6 font-serif text-xl text-[#d4af37]">
                      Add a customer without leaving the booking screen.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                  <FormSection
                    number="1"
                    title="Customer & Vehicle"
                    subtitle="Select the renter and the exact vehicle being reserved."
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCustomer((current) => !current);
                          setCustomerError("");
                          setCustomerSuccess("");
                        }}
                        className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-5 py-3 text-sm font-black text-white shadow-lg shadow-black/10"
                      >
                        {showQuickCustomer ? "Close Customer Form" : "+ Add New Customer"}
                      </button>
                    }
                  >
                    {customerSuccess && (
                      <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700">
                        {customerSuccess}
                      </div>
                    )}

                    {customerError && (
                      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                        {customerError}
                      </div>
                    )}

                    {showQuickCustomer && (
                      <div className="mb-6 rounded-3xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <div className="mb-5">
                          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                            Quick Add Customer
                          </p>

                          <h4 className="mt-2 font-serif text-2xl font-black text-[#1d1d1f]">
                            Add customer without leaving booking
                          </h4>

                          <p className="mt-1 text-sm text-[#7a7168]">
                            Name and phone are required. Other fields can be
                            completed now or updated later.
                          </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <Input
                            label="Full Name"
                            name="full_name"
                            value={quickCustomer.full_name}
                            onChange={updateQuickCustomerField}
                            required
                            placeholder="Customer full name"
                          />

                          <Input
                            label="Phone"
                            name="phone"
                            value={quickCustomer.phone}
                            onChange={updateQuickCustomerField}
                            required
                            placeholder="868-000-0000"
                          />

                          <Input
                            label="WhatsApp"
                            name="whatsapp"
                            value={quickCustomer.whatsapp}
                            onChange={updateQuickCustomerField}
                            placeholder="868-000-0000"
                          />

                          <Input
                            label="Email"
                            name="email"
                            value={quickCustomer.email}
                            onChange={updateQuickCustomerField}
                            type="email"
                          />

                          <Input
                            label="License Number"
                            name="license_number"
                            value={quickCustomer.license_number}
                            onChange={updateQuickCustomerField}
                          />

                          <Input
                            label="License Expiry"
                            name="license_expiry"
                            value={quickCustomer.license_expiry}
                            onChange={updateQuickCustomerField}
                            type="date"
                          />

                          <Input
                            label="ID Number"
                            name="id_number"
                            value={quickCustomer.id_number}
                            onChange={updateQuickCustomerField}
                          />

                          <Input
                            label="Date of Birth"
                            name="date_of_birth"
                            value={quickCustomer.date_of_birth}
                            onChange={updateQuickCustomerField}
                            type="date"
                          />

                          <Input
                            label="Emergency Contact Name"
                            name="emergency_contact_name"
                            value={quickCustomer.emergency_contact_name}
                            onChange={updateQuickCustomerField}
                          />

                          <Input
                            label="Emergency Contact Phone"
                            name="emergency_contact_phone"
                            value={quickCustomer.emergency_contact_phone}
                            onChange={updateQuickCustomerField}
                          />
                        </div>

                        <div className="mt-5">
                          <label className="block text-sm font-black text-[#4b443d]">
                            Address
                          </label>

                          <textarea
                            value={quickCustomer.address}
                            onChange={(event) =>
                              updateQuickCustomerField("address", event.target.value)
                            }
                            className="mt-2 min-h-24 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                          />
                        </div>

                        <div className="mt-5">
                          <label className="block text-sm font-black text-[#4b443d]">
                            Customer Notes
                          </label>

                          <textarea
                            value={quickCustomer.notes}
                            onChange={(event) =>
                              updateQuickCustomerField("notes", event.target.value)
                            }
                            className="mt-2 min-h-24 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                          />
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => setShowQuickCustomer(false)}
                            className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
                          >
                            Cancel Customer
                          </button>

                          <button
                            type="button"
                            disabled={customerSaving}
                            onClick={handleQuickCustomerSubmit}
                            className="rounded-xl bg-[#0b0b0c] px-7 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:bg-[#1c1c1e] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {customerSaving ? "Saving Customer..." : "Save & Select Customer"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                      <SelectField
                        label="Customer"
                        value={form.customer_id}
                        onChange={(value) => updateField("customer_id", value)}
                        required
                      >
                        <option value="">Select customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.full_name} — {customer.phone}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        label="Vehicle"
                        value={form.vehicle_id}
                        onChange={(value) => updateField("vehicle_id", value)}
                        required
                      >
                        <option value="">Select vehicle</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.vehicle_name} — {vehicle.plate_number} —{" "}
                            {vehicle.status}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                  </FormSection>

                  <FormSection
                    number="2"
                    title="Rental Dates"
                    subtitle="Enter pickup and return information."
                  >
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <Input
                        label="Pickup Date"
                        name="pickup_date"
                        value={form.pickup_date}
                        onChange={updateField}
                        type="date"
                        required
                      />

                      <Input
                        label="Pickup Time"
                        name="pickup_time"
                        value={form.pickup_time}
                        onChange={updateField}
                        type="time"
                      />

                      <Input
                        label="Return Date"
                        name="return_date"
                        value={form.return_date}
                        onChange={updateField}
                        type="date"
                        required
                      />

                      <Input
                        label="Return Time"
                        name="return_time"
                        value={form.return_time}
                        onChange={updateField}
                        type="time"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    number="3"
                    title="Charges & Payment"
                    subtitle="Rates and balances calculate automatically."
                  >
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <Input
                        label="Daily Rate"
                        name="daily_rate"
                        value={form.daily_rate}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Number of Days"
                        name="number_of_days"
                        value={form.number_of_days}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Deposit"
                        name="deposit"
                        value={form.deposit}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Discount"
                        name="discount"
                        value={form.discount}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Extra Charges"
                        name="extra_charges"
                        value={form.extra_charges}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Amount Paid"
                        name="amount_paid"
                        value={form.amount_paid}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Total Amount"
                        name="total_amount"
                        value={form.total_amount}
                        onChange={updateField}
                        type="number"
                      />

                      <Input
                        label="Balance"
                        name="balance"
                        value={form.balance}
                        onChange={updateField}
                        type="number"
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    number="4"
                    title="Status & Notes"
                    subtitle="Set the booking status and add any special instructions."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <SelectField
                        label="Booking Status"
                        value={form.status}
                        onChange={(value) => updateField("status", value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed / Reserved</option>
                        <option value="active">Active / Vehicle Out</option>
                      </SelectField>

                      <div className="rounded-2xl border border-[#eee9df] bg-[#fbfaf8] p-5">
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                          Booking Summary
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <SummaryItem label="Days" value={form.number_of_days} />
                          <SummaryItem
                            label="Daily Rate"
                            value={formatMoney(form.daily_rate)}
                          />
                          <SummaryItem
                            label="Total"
                            value={formatMoney(form.total_amount)}
                          />
                          <SummaryItem
                            label="Balance"
                            value={formatMoney(form.balance)}
                            danger
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="block text-sm font-black text-[#4b443d]">
                        Notes
                      </label>

                      <textarea
                        value={form.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                        className="mt-2 min-h-32 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
                      />
                    </div>
                  </FormSection>
                </div>

                <aside className="space-y-6">
                  <section className="sticky top-6 overflow-hidden rounded-3xl border border-[#e7e2d9] bg-white shadow-xl shadow-black/5">
                    <div className="border-b border-[#eee9df] px-6 py-5">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                        Booking Preview
                      </p>

                      <h3 className="mt-2 font-serif text-2xl font-black text-[#1d1d1f]">
                        Vehicle & Customer
                      </h3>

                      <p className="mt-2 text-sm text-[#7a7168]">
                        Confirm the selected renter and vehicle before saving.
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="overflow-hidden rounded-3xl border border-[#eee9df] bg-[#fbfaf8]">
                        {selectedVehicle?.vehicle_photo ? (
                          <img
                            src={selectedVehicle.vehicle_photo}
                            alt={selectedVehicle.vehicle_name}
                            className="h-64 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-64 w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.18),transparent_40%),linear-gradient(135deg,#111111,#3a2410)] px-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/20 text-3xl text-[#d4af37]">
                              ▣
                            </div>

                            <p className="mt-4 text-lg font-black text-white">
                              No vehicle selected
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              Select a vehicle to preview the rental photo.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <p className="text-sm font-black text-[#1d1d1f]">
                          Customer
                        </p>

                        {selectedCustomer ? (
                          <div className="mt-3 space-y-2 text-sm text-[#6b6257]">
                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Name:
                              </span>{" "}
                              {selectedCustomer.full_name}
                            </p>

                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Phone:
                              </span>{" "}
                              {selectedCustomer.phone}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[#6b6257]">
                            Customer details will appear here after selection.
                          </p>
                        )}
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#e7e2d9] bg-[#fff9e8] p-5">
                        <p className="text-sm font-black text-[#1d1d1f]">
                          Vehicle
                        </p>

                        {selectedVehicle ? (
                          <div className="mt-3 space-y-2 text-sm text-[#6b6257]">
                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Name:
                              </span>{" "}
                              {selectedVehicle.vehicle_name}
                            </p>

                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Plate:
                              </span>{" "}
                              {selectedVehicle.plate_number}
                            </p>

                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Status:
                              </span>{" "}
                              {selectedVehicle.status}
                            </p>

                            <p>
                              <span className="font-black text-[#1d1d1f]">
                                Rate:
                              </span>{" "}
                              {formatMoney(String(selectedVehicle.daily_rate || 0))}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[#6b6257]">
                            Vehicle details will appear here after selection.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </aside>
              </section>

              <section className="sticky bottom-0 z-10 rounded-3xl border border-[#e7e2d9] bg-white/95 p-5 shadow-2xl shadow-black/10 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#b98320]">
                      Ready to save
                    </p>

                    <p className="mt-1 text-sm text-[#7a7168]">
                      Confirm the customer, vehicle, dates, balance, and photo
                      before saving.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/admin/bookings"
                      className="rounded-xl border border-[#e7e2d9] bg-white px-6 py-4 text-center text-sm font-black text-[#1d1d1f] shadow-sm hover:bg-[#fbfaf8]"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b98320] px-7 py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save Booking"}
                    </button>
                  </div>
                </div>
              </section>
            </form>

            <footer className="pb-6 text-center text-sm text-[#9a9085]">
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
              © {new Date().getFullYear()} Roberts Auto Rental and Leasing. All
              rights reserved.
              <span className="mx-4 inline-block h-px w-16 bg-[#d4af37]/50 align-middle" />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function FormSection({
  number,
  title,
  subtitle,
  children,
  action,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#e7e2d9] bg-white p-6 shadow-xl shadow-black/5">
      <div className="mb-6 flex flex-col gap-4 border-b border-[#eee9df] pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-xl font-black text-[#b98320]">
            {number}
          </div>

          <div>
            <h3 className="font-serif text-2xl font-black text-[#1d1d1f]">
              {title}
            </h3>

            <p className="text-sm text-[#7a7168]">{subtitle}</p>
          </div>
        </div>

        {action}
      </div>

      {children}
    </section>
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
      <label className="block text-sm font-black text-[#4b443d]">{label}</label>

      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-[#4b443d]">{label}</label>

      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#e7e2d9] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] outline-none transition focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/15"
      >
        {children}
      </select>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a8178]">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-black ${
          danger ? "text-red-700" : "text-[#1d1d1f]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatMoney(value: string) {
  return `$${Number(value || 0).toFixed(2)}`;
}
