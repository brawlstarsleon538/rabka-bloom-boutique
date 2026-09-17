export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale =
    size === "lg" ? "text-6xl sm:text-7xl" : size === "md" ? "text-3xl" : "text-2xl";
  const sub =
    size === "lg" ? "text-sm tracking-[0.5em]" : "text-[0.6rem] tracking-[0.4em]";
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className={`font-display italic text-primary ${scale}`}>SiViK</span>
      <span className={`mt-1 uppercase text-muted-foreground ${sub}`}>Flowers</span>
    </span>
  );
}

export function PetalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`petal-divider ${className}`}>
      <span className="h-px w-12 bg-gold/50" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21s-8-5.4-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3.5C20 15.6 12 21 12 21z" />
      </svg>
      <span className="h-px w-12 bg-gold/50" />
    </div>
  );
}
