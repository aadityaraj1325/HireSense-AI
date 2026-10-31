import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex items-end justify-between gap-5 mb-8", className)}>
      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-[var(--ink)] leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-base leading-6 text-[var(--ink-muted)] mt-2">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
