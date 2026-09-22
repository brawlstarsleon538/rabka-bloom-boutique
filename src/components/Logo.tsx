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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
        <path d="M12 4c-2.2 0-4 1.8-4 4 0 2.8 4 5.5 4 5.5s4-2.7 4-5.5c0-2.2-1.8-4-4-4z" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 6c-1.1 0-2 .9-2 2 0 1.4 2 2.7 2 2.7s2-1.3 2-2.7c0-1.1-.9-2-2-2z" />
        <path d="M12 13.5v6.5" />
        <path d="M12 15c-1.5-.5-3-2-3-3 1.5 0 2.5 1.2 3 3z" fill="currentColor" fillOpacity="0.3" />
        <path d="M12 16c1.5-.5 3-2 3-3-1.5 0-2.5 1.2-3 3z" fill="currentColor" fillOpacity="0.3" />
      </svg>
      <span className="h-px w-12 bg-gold/50" />
    </div>
  );
}
