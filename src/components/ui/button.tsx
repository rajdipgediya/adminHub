import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        outline: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        ghost: "border border-slate-200 text-slate-600 hover:bg-slate-50",
        dangerSoft: "bg-red-100 text-red-800 hover:bg-red-200",
        dangerOutline: "border border-red-800 text-red-800 hover:bg-red-50",
        neutralOutline: "border border-slate-500 text-slate-600 hover:bg-slate-50",
      },
      size: {
        /** 14px / px-16 py-10 — page header actions. */
        md: "rounded-lg px-4 py-2.5 text-sm",
        /** 12px / px-12 py-6 — pagination, bulk actions. */
        sm: "rounded-md px-3 py-1.5 text-xs",
        /** Full-width mobile action buttons. */
        block: "w-full rounded-lg py-3 text-sm",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
