export default function LoadingRepApp() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <img
          src="/images/drive-in-style-premium-rentals.png"
          alt="Roberts Auto Rental"
          className="mx-auto h-auto w-full max-w-[260px] rounded-3xl object-contain"
        />

        <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-[#d4af37]">
          Loading Booking App
        </p>

        <div className="mx-auto mt-8 h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-[#d4af37]" />
      </div>
    </main>
  );
}
