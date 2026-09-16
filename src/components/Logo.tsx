import logoAsset from "@/assets/sivik-logo.jpg.asset.json";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-36 sm:h-44" : size === "md" ? "h-12" : "h-9";
  return (
    <span className="inline-flex items-center leading-none">
      <img
        src={logoAsset.url}
        alt="SiViK Flowers — Kwiaty • Prezenty • Dostawa, Rabka-Zdrój"
        className={`${dim} w-auto rounded-full object-cover`}
      />
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
