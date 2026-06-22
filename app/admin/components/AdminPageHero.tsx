type HeroVariant =
  | "dashboard"
  | "bookings"
  | "calendar"
  | "vehicles"
  | "customers"
  | "payments"
  | "maintenance"
  | "reports";

export default function AdminPageHero({
  label = "Roberts Auto Rental",
  title,
  subtitle,
  variant = "dashboard",
}: {
  label?: string;
  title: string;
  subtitle: string;
  variant?: HeroVariant;
}) {
  const hero = getHeroStyle(variant);

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e7e2d9] bg-black shadow-xl shadow-black/10">
      <div className={`relative min-h-[230px] overflow-hidden ${hero.bg}`}>
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-0 opacity-35">
          <div className={hero.pattern} />
        </div>

        <div className="absolute right-0 top-0 hidden h-full w-1/2 opacity-50 md:block">
          <div className={hero.glow} />
        </div>

        <div className="relative flex min-h-[230px] items-center px-8 py-8 md:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d4af37]">
              {label}
            </p>

            <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-white md:text-4xl">
              {title}
            </h2>

            <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

            <p className="mt-6 font-serif text-xl text-[#d4af37]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function getHeroStyle(variant: HeroVariant) {
  const styles: Record<
    HeroVariant,
    {
      bg: string;
      pattern: string;
      glow: string;
    }
  > = {
    dashboard: {
      bg: "bg-[radial-gradient(circle_at_75%_35%,rgba(212,175,55,0.35),transparent_30%),linear-gradient(100deg,#050505_0%,#111111_45%,#3a260f_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,transparent_35%,rgba(212,175,55,0.20)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.35),transparent_55%)]",
    },

    bookings: {
      bg: "bg-[radial-gradient(circle_at_75%_35%,rgba(212,175,55,0.32),transparent_32%),linear-gradient(100deg,#050505_0%,#111111_48%,#43260b_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,transparent_40%,rgba(212,175,55,0.22)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(255,195,75,0.32),transparent_58%)]",
    },

    calendar: {
      bg: "bg-[radial-gradient(circle_at_78%_32%,rgba(65,105,170,0.35),transparent_33%),linear-gradient(100deg,#050505_0%,#101723_48%,#0b2038_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_38%,rgba(65,105,170,0.25)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(65,105,170,0.38),transparent_58%)]",
    },

    vehicles: {
      bg: "bg-[radial-gradient(circle_at_78%_34%,rgba(212,175,55,0.28),transparent_34%),linear-gradient(100deg,#040404_0%,#131313_45%,#2d2d2d_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(120deg,rgba(255,255,255,0.09)_0%,transparent_36%,rgba(212,175,55,0.18)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.30),transparent_58%)]",
    },

    customers: {
      bg: "bg-[radial-gradient(circle_at_78%_35%,rgba(212,175,55,0.26),transparent_34%),linear-gradient(100deg,#050505_0%,#15110c_46%,#3b2a16_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_36%,rgba(212,175,55,0.20)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.28),transparent_58%)]",
    },

    payments: {
      bg: "bg-[radial-gradient(circle_at_78%_35%,rgba(30,145,90,0.32),transparent_34%),linear-gradient(100deg,#050505_0%,#0e1712_46%,#102d20_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_36%,rgba(30,145,90,0.22)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(30,145,90,0.34),transparent_58%)]",
    },

    maintenance: {
      bg: "bg-[radial-gradient(circle_at_78%_35%,rgba(220,120,40,0.34),transparent_34%),linear-gradient(100deg,#050505_0%,#17110d_46%,#3b1f0c_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_36%,rgba(220,120,40,0.24)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(220,120,40,0.35),transparent_58%)]",
    },

    reports: {
      bg: "bg-[radial-gradient(circle_at_78%_35%,rgba(145,95,210,0.34),transparent_34%),linear-gradient(100deg,#050505_0%,#14101b_46%,#241238_100%)]",
      pattern:
        "h-full w-full bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_36%,rgba(145,95,210,0.24)_100%)]",
      glow: "h-full w-full bg-[radial-gradient(circle_at_center,rgba(145,95,210,0.35),transparent_58%)]",
    },
  };

  return styles[variant];
}