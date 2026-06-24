export default function LoadingRepApp() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030303] px-6 text-white">
      <div className="w-full max-w-md text-center">
        <img
          src="/images/roberts-logo-wide.jpg"
          alt="Roberts Auto Rental and Leasing"
          className="mx-auto h-auto w-full max-w-[360px] object-contain"
        />

        <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-[#d4af37]">
          Vehicle Booking App
        </p>

        <div className="mx-auto mt-8 h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#d4af37]" />

        <p className="mt-7 text-sm font-semibold leading-6 text-white/55">
          Loading premium vehicle booking.
        </p>
      </div>
    </main>
  );
}
