interface LogoProps {
  /** Pixel size of the logo mark (width & height). */
  size?: number;
  /** "color" for light backgrounds, "white" for dark backgrounds. */
  variant?: "color" | "white";
  className?: string;
}

/**
 * URAV brand mark. The image lives in /public (logo.png / logo-white.png)
 * and has a transparent background so it sits on any surface.
 */
export function Logo({ size = 36, variant = "color", className = "" }: LogoProps) {
  const src = variant === "white" ? "/logo-white.png" : "/logo.png";
  return (
    <img
      src={src}
      alt="URAV"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
