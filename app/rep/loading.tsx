export default function LoadingRepApp() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[#d4af37]/30 bg-white p-4 shadow-2xl shadow-[#d4af37]/10">
          <img
            src="/images/roberts-logo.png"
            alt="Roberts Auto Rental"
            className="h-full w-full object-contain"
          />
        </div>

        <h1 className="mt-6 font-serif text-4xl font-black">
          Roberts Auto Rental
        </h1>

        <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-[#d4af37]">
          Loading Rep App
        </p>

        <div className="mx-auto mt-8 h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-[#d4af37]" />
      </div>
    </main>
  );
}
