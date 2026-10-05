import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className={buttonVariants({ variant: "primary" })}>
        Back to dashboard
      </Link>
    </main>
  );
}
