import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all duration-300",
  {
    variants: {
      variant: {
        default: "hover:shadow-hover",
        accent:
          "bg-[var(--accent-hero)] text-white border-transparent bg-[image:linear-gradient(135deg,var(--accent-hero-2)_0%,var(--accent-hero)_55%,var(--accent-hero)_100%)]",
        flat: "",
      },
      radius: {
        md: "rounded-[22px]",
        lg: "rounded-[28px]",
      },
      padding: {
        none: "",
        sm: "p-5",
        md: "p-6",
        lg: "p-7",
      },
    },
    defaultVariants: { variant: "default", radius: "md", padding: "md" },
  }
);

export const Card = forwardRef(
  ({ className, variant, radius, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, radius, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex items-start justify-between gap-3 mb-4", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3
    className={cn(
      "text-lg font-semibold text-[var(--ink)] tracking-[-0.025em] leading-tight",
      className
    )}
    {...props}
  />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm leading-6 text-[var(--ink-muted)]", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("", className)} {...props} />
);
