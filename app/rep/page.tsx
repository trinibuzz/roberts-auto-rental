import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireRepUser() {
  const token =
    cookies().get("roberts_rep_token")?.value ||
    cookies().get("roberts_token")?.value ||
    cookies().get("robers_token")?.value ||
    cookies().get("admin_token")?.value ||
    cookies().get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export default async function RepBookingFrontPage() {
  await requireRepUser();

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto min-h-screen max-w-[480px] bg-black">
        <div className="relative mx-auto w-full overflow-hidden bg-black">
          <img
            src="/images/drive-in-style-premium-rentals.png"
            alt="Roberts Auto Rental premium booking"
            className="block h-auto w-full"
          />

          {/* Main BOOK NOW button overlay.
             The visible button is part of the image.
             This transparent link makes it clickable while keeping the exact look. */}
          <Link
            href="/rep/pickups"
            aria-label="Book now"
            className="absolute left-[8.5%] top-[87.2%] h-[7.1%] w-[83%] rounded-2xl"
          />

          {/* Optional clickable booking fields.
             These are transparent so the design remains exactly like the image. */}
          <Link
            href="/rep/pickups"
            aria-label="Pick-up location"
            className="absolute left-[8.5%] top-[51.4%] h-[7.2%] w-[83%] rounded-xl"
          />

          <Link
            href="/rep/pickups"
            aria-label="Pick-up date and time"
            className="absolute left-[8.5%] top-[60.2%] h-[7.2%] w-[83%] rounded-xl"
          />

          <Link
            href="/rep/pickups"
            aria-label="Return date and time"
            className="absolute left-[8.5%] top-[69.1%] h-[7.2%] w-[83%] rounded-xl"
          />

          <Link
            href="/rep/vehicles"
            aria-label="Vehicle type"
            className="absolute left-[8.5%] top-[78%] h-[7.2%] w-[83%] rounded-xl"
          />
        </div>
      </section>
    </main>
  );
}
